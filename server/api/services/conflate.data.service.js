/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import {fountain_property_metadata, get_prop} from "../../../config/fountain.properties";
import {
  PROP_STATUS_ERROR, PROP_STATUS_FOUNTAIN_NOT_EXIST,
  PROP_STATUS_INFO,
  PROP_STATUS_NOT_AVAILABLE,
  PROP_STATUS_NOT_DEFINED,
  PROP_STATUS_OK
} from "../../common/constants";

const _ = require('lodash');
const haversine = require('haversine');
const md5 = require('js-md5');


// wikidata property paths
const idwd_path_wd = fountain_property_metadata.id_wikidata.src_config.wikidata.src_path;
const idwd_path_osm = fountain_property_metadata.id_wikidata.src_config.osm.src_path;

// This service finds matching fountains from osm and wikidata
// and merges their properties

export function conflate(ftns) {
  return new Promise((resolve, reject)=>{
    
    let conflated = {
      wikidata: [],
      coord: []
    };
    
    // Only try to match if both lists contain fountains
    if(_.min([ftns.osm.length, ftns.wikidata.length])>0) {
      conflated.wikidata = conflateByWikidata(ftns);
      conflated.coord = conflateByCoordinates(ftns);
    }
    
    // process remaining fountains that were not matched
    let unmatched = {};
    unmatched.osm = _.map(ftns.osm, f_osm =>{
      return mergeFountainProperties({osm:f_osm, wikidata:false}, 'unmatched')});
    unmatched.wikidata = _.map(ftns.wikidata, f_wd =>{
      return mergeFountainProperties({osm:false, wikidata:f_wd}, 'unmatched')});
    
    // append the unmatched fountains to the list
    let conflated_fountains_all = _.concat(
      conflated.coord,
      conflated.wikidata,
      unmatched.osm,
      unmatched.wikidata
    );
    
    // return fountains
    resolve(properties2GeoJson(conflated_fountains_all));
  })
}


function conflateByWikidata(ftns) {
  // Holder for conflated fountains
  let conflated_fountains = [];
  // Temporary holders for matched fountain indexes
  let matched_idx_osm = [];
  let matched_idx_wd = [];
  
  // loop through OSM fountains
  for(const [idx_osm, f_osm] of ftns.osm.entries()){
    
    let idx_wd =  _.findIndex(ftns.wikidata, (f_wd) => {
      return _.get(f_osm, idwd_path_osm, 0) === _.get(f_wd, idwd_path_wd, 1);
    });
    // if a match was found
    if (idx_wd >= 0) {
      // compute distance between fountains
      let d = haversine(
        get_prop(ftns.osm[idx_osm], 'osm', 'coords'),
        get_prop(ftns.wikidata[idx_wd], 'wikidata', 'coords'), {
          unit: 'meter',
          format: '[lon,lat]'
        });
      // conflate the two fountains
      conflated_fountains.push(
        mergeFountainProperties(
          {
            osm: ftns.osm[idx_osm],
            wikidata: ftns.wikidata[idx_wd]
          }, 'merged by wikidata id', d));
      // document the indexes for removal
      matched_idx_osm.push(idx_osm);
      matched_idx_wd.push(idx_wd);
    }
  }
  
  // remove matched fountains from lists
  cleanFountainCollections(ftns, matched_idx_osm, matched_idx_wd);
  
  return conflated_fountains;
}

function cleanFountainCollections(ftns, matched_idx_osm, matched_idx_wd) {
  // remove matched fountains (reverse order to not mess up indexes)
  // sort indexes in matched_idx_wd, otherwise indexes will be messed up
  matched_idx_wd = _.orderBy(matched_idx_wd);
  for (let i = matched_idx_osm.length -1; i >= 0; i--)
    ftns.osm.splice(matched_idx_osm[i],1);
  for (let i = matched_idx_wd.length -1; i >= 0; i--)
    ftns.wikidata.splice(matched_idx_wd[i],1);
  // console.log(r.osm.length);
  
}

function conflateByCoordinates(ftns) {
  // Holder for conflated fountains
  let conflated_fountains = [];
  // Temporary holders for matched fountain indexes
  let matched_idx_osm = [];
  let matched_idx_wd = [];
  
  let coords_all_wd = _.map(ftns.wikidata, f_wd=>{return get_prop(f_wd, 'wikidata', 'coords')});
  
  for (const [idx_osm, f_osm] of ftns.osm.entries()) {
    // compute distance array
    let coords_osm = get_prop(f_osm, 'osm', 'coords');
    let distances = _.map(coords_all_wd, c_wd => {
      // compute distance in meters
      return haversine( c_wd, coords_osm, {
          unit: 'meter',
          format: '[lon,lat]'
        });
    });
    let dMin = _.min(distances);
    let idx_wd = _.indexOf(distances, dMin);
    // selection criteria: dMin smaller than 10 meters
    if (dMin < 10) {
      // conflate the two fountains
      conflated_fountains.push(mergeFountainProperties(
        {
          osm: ftns.osm[idx_osm],
          wikidata: ftns.wikidata[idx_wd]
        }, `merged by location`, dMin));
      // document the indexes for removal
      matched_idx_osm.push(idx_osm);
      matched_idx_wd.push(idx_wd);
      //todo: if matching is ambiguous, add a note for community
    }
  }
  // remove matched fountains from lists
  cleanFountainCollections(ftns, matched_idx_osm, matched_idx_wd);
  
  
  return conflated_fountains;
}


function mergeFountainProperties(fountains, mergeNotes='', mergeDistance=null){
  // combines fountain properties from osm and wikidata
  // For https://github.com/water-fountains/proximap/issues/160 we keep values from both sources when possible
  let mergedProperties = {};
  // loop through all property metadata
  _.forEach(fountain_property_metadata, (p)=>{
    // copy default values
    let temp = {
      id: p.id,
      value: p.value,
      comments: p.comments,
      status: p.status,
      type: p.type,
      sources: {
        osm: {
          status: null,
          raw: null,
          extracted: null,
          comments: []
        },
        wikidata: {
          status: null,
          raw: null,
          extracted: null,
          comments: []
        }
      }
    };
    
    // loop through sources and extract values
    for(let src_name of ['wikidata', 'osm']){
      if(p.src_config[src_name] === null){
        // If property not available, define property as not available for source
        temp.sources[src_name].status = PROP_STATUS_NOT_AVAILABLE;
    
      } else if(! fountains[src_name]){
        // If fountain doesn't exist
        temp.sources[src_name].status = PROP_STATUS_FOUNTAIN_NOT_EXIST;
  
      }else {
        // if property is available for source, try to get it
        // get extraction information
        const cfg = p.src_config[src_name];
        
        // Get value of property from source
        let value = _.get(fountains[src_name], cfg.src_path, null);
        let useExtra = false;
  
        // If value is null and property has an additional source of data (e.g., wiki commons for #155), use that
        if(value === null && cfg.hasOwnProperty('src_path_extra')){
          value = _.get(fountains[src_name], cfg.src_path_extra, null);
          useExtra = true;
        }
        
        // If a value was obtained, try to process it
        if(value !== null){
          // save raw value
          temp.sources[src_name].raw = value;
          try{
            // use one translation or the alternative translation
            temp.sources[src_name].extracted = useExtra?cfg.value_translation_extra(value):cfg.value_translation(value);
            // if extracted value is not null, change status
            if(temp.sources[src_name].extracted !== null){
              temp.sources[src_name].status = PROP_STATUS_OK;
            }
          }catch(err) {
            temp.sources[src_name].status = PROP_STATUS_ERROR;
            let warning = `Lost in translation of ${p.id} from ${src_name}: ${err}`;
            temp.sources[src_name].comments.push(warning);
            l.error(warning);
          }
        }else{
          // If no property data was found, set status to "not defined"
          temp.sources[src_name].status = PROP_STATUS_NOT_DEFINED;
        }
      }
    }
    
    // Get preferred value to display
    for(let src_name of p.src_pref){
      // check if value is available
      if(temp.sources[src_name].status === PROP_STATUS_OK){
        temp.value = temp.sources[src_name].extracted;
        temp.status = PROP_STATUS_OK;
        temp.source = src_name;
        break;  // stop looking for data
      }
    }
    
    // Add merged property to object
    mergedProperties[p.id] = temp;
    
  });
  // process panorama and image url
  addDefaultPanoUrls(mergedProperties);
  
  mergedProperties['conflation_info'] = {
    'merge_notes': mergeNotes,
    'merge_distance': mergeDistance,
    // document merge date for datablue/#20
    'merge_date': new Date()
  };
  
  return mergedProperties
}

function properties2GeoJson(collection){
  return _.map(collection, properties=>{
    try{
      return {
        type: 'Feature',
        geometry:{
          type: 'Point',
          coordinates: properties.coords.value
        },
        properties: _.cloneDeep(properties)
      }
    } catch (err) {
      throw err;
    }
    
  })
}


function processImageUrl(fountain, widthPx=640) {
  if (fountain.featured_image_name.value === null){
    return `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${fountain.coords.value[1]},${fountain.coords.value[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
  }else{
    // construct url of thumbnail
    let imgName = fountain.featured_image_name.value.replace(/ /g, '_');
    
    let h = md5(imgName);
    return `//upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.substring(0,2)}/${imgName}/${widthPx}px-${imgName}`;
  }
}


function addDefaultPanoUrls(fountain) {
  if(fountain.pano_url.value === null){
    fountain.pano_url.value = [
      {url: `//instantstreetview.com/@${fountain.coords.value[1]},${fountain.coords.value[0]},0h,0p,1z`,
      source_name: 'Google Street View'}
    ];
    fountain.pano_url.status = PROP_STATUS_INFO;
    fountain.pano_url.comments = 'URL for Google Street View is automatically generated from coordinates'
  }
}