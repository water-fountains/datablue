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
import l from '../../common/logger';
import {fountain_property_metadata} from "../../../config/fountain.properties"
import {PROP_STATUS_INFO, PROP_STATUS_OK} from "../../common/constants";

export function defaultCollectionEnhancement(fountainCollection) {
  return new Promise((resolve, reject)=>{
    fillImageGalleries(fountainCollection)
      .then(r => fillOutNames(r))
      .then(r => fillWikipediaSummaries(r))
      .then(r => resolve(r))
      .catch(err=>reject(err))
  })
}


export function fillImageGalleries(fountainCollection){
  // takes a collection of fountains and returns the same collection,
  // enhanced with image galleries when available or default images
  
  return new Promise((resolve, reject) => {
    let promises = [];
    _.forEach(fountainCollection, fountain =>{
      promises.push(WikimediaService.fillGallery(fountain));
    });
    
    Promise.all(promises)
      .then(r =>resolve(r))
      .catch(err=>reject(err));
    
  })
}

export function fillWikipediaSummaries(fountainCollection){
  // takes a collection of fountains and returns the same collection, enhanced with image galleries when available
  return new Promise((resolve, reject) => {
    let promises = [];
    // loop through fountains
    _.forEach(fountainCollection, fountain =>{
      // check English and German
      _.forEach(['en', 'de'], lang =>{
        let urlParam = `wikipedia_${lang}_url`;
        let summaryParam = `wikipedia_${lang}_summary`;
        if(!_.isNull(fountain.properties[urlParam].value)){
          // if not Null, get summary and create new property
          promises.push(new Promise((resolve, reject) => {
            WikipediaService.getSummary(fountain.properties[urlParam].value)
              .then(summary => {
                fountain.properties[summaryParam].value = summary;
                fountain.properties[summaryParam].type = 'string';
                fountain.properties[summaryParam].source_name = 'wikipedia';
                fountain.properties[summaryParam].source_url = fountain.properties[urlParam].value;
                if(summary.length > 0){
                  fountain.properties[summaryParam].status = PROP_STATUS_OK;
                }
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
    features: []
  };
  
  let essentialPropNames = _.map(fountain_property_metadata, (p, p_name)=>{if (p.essential) {return p_name} });
  
  fountainCollection.features.forEach(f=>{
    let props = _.pick(f.properties, essentialPropNames);
    props = _.mapValues(props, (obj)=>{
      return obj.value
    });
    // add id manually, since it does not have the standard property structure
    props.id = f.properties.id;
    
    // create feature
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
  // takes a collection of fountains and returns the same collection, with holes in fountain names filled best possible way
  return new Promise((resolve, reject) => {
    let langs = ['en','de','fr'];
    fountainCollection.forEach(f => {
      // fill default name if not filled
      if(f.properties.name.value === null){
        for(let lang of langs){
          if(f.properties[`name_${lang}`].value !== null){
            f.properties.name.value = f.properties[`name_${lang}`].value;
            f.properties.name.source_name = f.properties[`name_${lang}`].source_name;
            f.properties.name.source_url = f.properties[`name_${lang}`].source_url;
            f.properties.name.comments = `Value taken from language ${lang}.`;
            f.properties.name.status = PROP_STATUS_INFO;
            break;
          }
        }
      }
      // fill specific names if not filled and a default name exists
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