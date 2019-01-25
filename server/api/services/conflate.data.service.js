import l from '../../common/logger';
import {fountain_property_metadata, get_prop} from "../../../config/fountain.properties";
import {PROP_STATUS_OK} from "../../common/constants";

const _ = require('lodash');
const haversine = require('haversine');
const md5 = require('js-md5');


// wikidata property paths
const idwd_path_wd = fountain_property_metadata.id_wikidata.src_config.wikidata.src_path;
const idwd_path_osm = fountain_property_metadata.id_wikidata.src_config.osm.src_path;
// coordinate property paths
const coords_path_wd = fountain_property_metadata.coords.src_config.wikidata.src_path;
const coords_path_osm = fountain_property_metadata.coords.src_config.osm.src_path;
// coordinate property translator functions
const coords_translation_wd = fountain_property_metadata.coords.src_config.wikidata.value_translation;
const coords_translation_osm = fountain_property_metadata.coords.src_config.osm.value_translation;

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
      return mergeFountainProperties({osm:f_osm, wikidata:{}}, 'unmatched')});
    unmatched.wikidata = _.map(ftns.wikidata, f_wd =>{
      return mergeFountainProperties({osm:{}, wikidata:f_wd}, 'unmatched')});
    
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
  let mergedProperties = {};
  // loop through all property metadata
  _.forEach(fountain_property_metadata, (p)=>{
    // copy default values
    let temp = {
      name: p.name,
      value: p.value,
      comment: p.comment,
      status: p.status,
      type: p.type
    };
    // loop through preferred sources and look for values
    for(let src_name of p.src_pref){
      const cfg = p.src_config[src_name];
      // Get value of property from source
      let value =
        _.get(fountains[src_name], cfg.src_path, null);
      if(value !== null){
        // if successful, stop looking for values
        try{
          temp.value = cfg.value_translation(value);
        }catch(err) {
          throw `Lost in translation of ${p.name} from ${src_name}.`
        }
        temp.status = PROP_STATUS_OK;
        temp.comment = '';
        temp.source = src_name;
        break;
      }
    }
    // Add merged property to object
    mergedProperties[p.name] = temp;
    
  });
  // process panorama and image url
  mergedProperties.pano_url.value = processPanoUrl(mergedProperties);
  
  mergedProperties['merge_notes'] = mergeNotes;
  mergedProperties['merge_distance'] = mergeDistance;
  
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


function processPanoUrl(fountain) {
  if(fountain.pano_url.value === null){
    return `//instantstreetview.com/@${fountain.coords.value[1]},${fountain.coords.value[0]},0h,0p,1z`;
  }else{
    return fountain.pano_url.value;
  }
}