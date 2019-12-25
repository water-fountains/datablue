/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import {getStaticStreetView} from "./google.service";

const _ = require ('lodash');
import WikimediaService from './wikimedia.service';
import WikipediaService from './wikipedia.service';
import WikidataService from './wikidata.service';
import l from '../../common/logger';
import {fountain_property_metadata} from "../../../config/fountain.properties"
import {PROP_STATUS_INFO, PROP_STATUS_OK} from "../../common/constants";

export function defaultCollectionEnhancement(fountainCollection,dbg) {
  l.info('defaultCollectionEnhancement: '+dbg);
  return new Promise((resolve, reject)=>{
    fillImageGalleries(fountainCollection,dbg)
      .then(r => fillOutNames(r))
      .then(r => fillWikipediaSummaries(r,dbg))
      .then(r => fillArtistNames(r,dbg))
      .then(r => fillOperatorInfo(r))
      .then(r => resolve(r))
      .catch(err=>reject(err))
  })
}


export function fillImageGalleries(fountainCollection, city){
  // takes a collection of fountains and returns the same collection,
  // enhanced with image galleries when available or default images
  
  return new Promise((resolve, reject) => {
    let promises = [];
    let i = 0;
    let tot = fountainCollection.length;
    _.forEach(fountainCollection, fountain =>{
      i=i+1;
      let dbg = i+'/'+tot;
      promises.push(WikimediaService.fillGallery(fountain, dbg, city));
    });
    
    Promise.all(promises)
      .then(r =>resolve(r))
      .catch(err=>reject(err));
    
  })
}

// created for proximap #129
export function fillArtistNames(fountainCollection,dbg){
  // takes a collection of fountains and returns the same collection,
  // enhanced with artist names if only QID was given
  
  return new Promise((resolve, reject) => {
    let promises = [];
    _.forEach(fountainCollection, fountain =>{
      promises.push(WikidataService.fillArtistName(fountain,dbg));
    });
    
    Promise.all(promises)
      .then(r=>resolve(r))
      .catch(err=>reject(err));
    
  })
}

// created for proximap #149
export function fillOperatorInfo(fountainCollection, dbg){
  // takes a collection of fountains and returns the same collection,
  // enhanced with operator information if that information is available in Wikidata
  
  return new Promise((resolve, reject) => {
    let promises = [];
    _.forEach(fountainCollection, fountain =>{
      promises.push(WikidataService.fillOperatorInfo(fountain,dbg));
    });
    
    Promise.all(promises)
      .then(r=>resolve(r))
      .catch(err=>reject(err));
    
  })
}

export function fillWikipediaSummaries(fountainCollection, dbg){
  // takes a collection of fountains and returns the same collection, enhanced with wikipedia summaries
  return new Promise((resolve, reject) => {
    let promises = [];
    // loop through fountains
    _.forEach(fountainCollection, fountain =>{
      // check all languages to see if a wikipedia page is referenced
      let i = 0;
      let tot = fountainCollection.length;
      _.forEach(['en', 'de', 'fr', 'it', 'tr'], lang =>{
        let urlParam = `wikipedia_${lang}_url`;
        i=i+1;
        let dbgHere = i+'/'+tot+' '+dbg;
        if(!_.isNull(fountain.properties[urlParam].value)){
          // if not Null, get summary and create new property
          let dbgIdWd = null;
          if (null != fountain.properties.id_wikidata && null != fountain.properties.id_wikidata.value) {
            dbgIdWd = fountain.properties.id_wikidata.value;
          }       
          promises.push(new Promise((resolve, reject) => {
            WikipediaService.getSummary(fountain.properties[urlParam].value, dbgHere+' '+lang+' '+dbgIdWd)
              .then(summary => {
                // add suumary as derived information to url property
                fountain.properties[urlParam].derived = {
                  summary: summary
                };
                resolve();
              })
              .catch(error=>{
                l.error(`Error creating Wikipedia summary: ${error}`);
                reject(error)
              })
          }));
        }
      });
    });
    
    Promise.all(promises)
      .then(r =>resolve(fountainCollection))
      .catch(err=>reject(err));
  })
}

export function createUniqueIds(fountainCollection){
  // takes a collection of fountains and returns the same collection, enhanced with unique and as persistent as possible ids
  return new Promise((resolve, reject) => {
    let i_n = 0;
    fountainCollection.forEach(f => {
      f.properties.id = i_n;
      f.properties.id_datablue = {
        value: i_n
      };
      i_n += 1;
    });
    resolve(fountainCollection)
  });
}

export function essenceOf(fountainCollection) {
  // returns a version of the fountain data with only the essential data
  let newCollection = {
    type: 'FeatureCollection',
    properties:
      {
        // Add last scan time info for https://github.com/water-fountains/proximap/issues/188
        last_scan: new Date()
      },
    features: []
  };
  
  // Get list of property names that are marked as essential in the metadata
  let essentialPropNames = _.map(fountain_property_metadata, (p, p_name)=>{if (p.essential) {return p_name} });
  
  // Use the list of essential property names to create a compact version of the fountain data
  fountainCollection.features.forEach(f=>{
    let fPrps = f.properties;
    let props = _.pick(fPrps, essentialPropNames);
    props = _.mapValues(props, (obj)=>{
      return obj.value
    });
    // add id manually, since it does not have the standard property structure
    props.id = fPrps.id;
    // add photo if it is not google street view
    let fGal = fPrps.gallery;
    let fGV = fGal.value;
    let fGV0 = fGV[0];
    props.ph = fGal.comments?'':{s:fGV0.s,
                                 pt:fGV0.pgTit };
    
    // create feature for fountain
    newCollection.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: f.geometry.coordinates
      },
      properties: props
    })
  });
  
  return newCollection;
  
}

export function fillOutNames(fountainCollection) {
  // takes a collection of fountains and returns the same collection, with blanks in fountain names filled from other languages or from 'name' property
  return new Promise((resolve, reject) => {
    let langs = ['en','de','fr', 'it', 'tr'];
    fountainCollection.forEach(f => {
      // if the default name (aka title) if not filled, then fill it from one of the other languages
      if(f.properties.name.value === null){
        for(let lang of langs){
          if(f.properties[`name_${lang}`].value !== null){
            // take the first language-specific name that is not null and apply it to the default name
            f.properties.name.value = f.properties[`name_${lang}`].value;
            f.properties.name.source_name = f.properties[`name_${lang}`].source_name;
            f.properties.name.source_url = f.properties[`name_${lang}`].source_url;
            f.properties.name.comments = `Value taken from language ${lang}.`;
            f.properties.name.status = PROP_STATUS_INFO;
            break;
          }
        }
      }
      // fill lang-specific names if null and if a default name exists
      if(f.properties.name.value !== null) {
        for (let lang of langs) {
          if (f.properties[`name_${lang}`].value === null) {
            f.properties[`name_${lang}`].value = f.properties.name.value;
            f.properties[`name_${lang}`].source_name = f.properties.name.source_name;
            f.properties[`name_${lang}`].source_url = f.properties.name.source_url;
            f.properties[`name_${lang}`].status = PROP_STATUS_INFO;
            if(f.properties.name.comments === ''){
              f.properties[`name_${lang}`].comments = 'Value taken from default language.';
            }else{
              f.properties[`name_${lang}`].comments = f.properties.name.comments;
            }
          }
        }
      }
      
    });
    resolve(fountainCollection)
  });
}

export function fillInMissingWikidataFountains(osm_fountains, wikidata_fountains){
  // Created for #212. This function should run before conflation. It checks if all Wikidata
  // fountains referenced in OSM have been fetched, and fetches any missing wikidata fountains.
  // It returns the original OSM fountain collection and the completed Wikidata fountain collection.
  
  return new Promise((resolve, reject)=>{
    // Get list of all Wikidata fountain qids referenced by OSM
    let qid_from_osm = _.compact(_.map(osm_fountains, f=>_.get(f,['properties', 'wikidata'])));
  
    // Get list of all Wikidata fountain qids collected
    let qid_from_wikidata = _.map(wikidata_fountains, 'id');
  
    // Get qids not included in wikidata collection
    let missing_qids = _.difference(qid_from_osm, qid_from_wikidata);
  
    // Fetch fountains with missing qids and add them to the wikidata_fountains collection
    WikidataService.byIds(missing_qids)
      .then(missing_wikidata_fountains=>{
        resolve({
          osm: osm_fountains,
          wikidata: missing_wikidata_fountains.concat(wikidata_fountains)
        })
      })
  });
  
}