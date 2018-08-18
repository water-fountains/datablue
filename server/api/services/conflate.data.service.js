import l from '../../common/logger';
import {default_fountain} from "../../../config/default.fountain.object";

const _ = require('lodash');
const turf = require('@turf/distance');
const md5 = require('js-md5');

// This service combines data from osm and wikidata
export function conflate(r) {
  return new Promise((resolve, reject)=>{
    let conflated_fountains = [];
    let matched_idx_1 = [];
    let matched_idx_2 = [];
  
    // try to match based on wikidata id, if possible
    if(_.min([r[0].length, r[1].length])>0) {
      for(const [idx_1, f1] of r[0].entries()){
        if (f1.hasOwnProperty('id_wikidata')) {
          let idx_2 = _.findIndex(r[1], (f2) => {
            if (f2.hasOwnProperty('id_wikidata')) {
              return f1.id_wikidata.value === f2.id_wikidata.value;
            } else {
              return false;
            }
          });
          // if a match was found
          if (idx_2 >= 0) {
            // compute distance between fountains
            let d = turf.default(r[0][idx_1].coords.value, r[1][idx_2].coords.value);
            // conlfate the two fountains
            conflated_fountains.push(mergeFountains(
              [r[0][idx_1], r[1][idx_2]], 'merged by wikidata id', d));
            // document the indexes for removal
            matched_idx_1.push(idx_1);
            matched_idx_2.push(idx_2);
          }
        }
      }
  
      // remove matched fountains (reverse order to not mess up indexes)
      // sort indexes in matched_idx_2, otherwise indexes will be messed up
      matched_idx_2 = _.orderBy(matched_idx_2);
      for (let i = matched_idx_1.length -1; i >= 0; i--)
        r[0].splice(matched_idx_1[i],1);
      for (let i = matched_idx_2.length -1; i >= 0; i--)
        r[1].splice(matched_idx_2[i],1);
      // reset list of matched indexes
      matched_idx_1 = [];
      matched_idx_2 = [];
    }
    
    // try to match based on coordinates
    if(_.min([r[0].length, r[1].length])>0) {
      for(const [idx_1, f1] of r[0].entries()){
        // compute distance array
        let distances = _.map(r[1], f2 => {
          // compute distance in meters
          return turf.default(f1.coords.value, f2.coords.value) * 1000
        });
        let dMin = _.min(distances);
        let idx_2 = _.indexOf(distances, dMin);
        // selection criteria: dMin smaller than 10 meters
        if (dMin < 10) {
          // conlfate the two fountains
          conflated_fountains.push(mergeFountains(
            [r[0][idx_1], r[1][idx_2]], `merged by location`, dMin));
          // document the indexes for removal
          matched_idx_1.push(idx_1);
          matched_idx_2.push(idx_2);
          //todo: if matching is ambiguous, add a note for community
        }
      }
  
      // remove matched fountains (reverse order to not mess up indexes)
      // sort indexes in matched_idx_2, otherwise indexes will be messed up
      matched_idx_2 = _.orderBy(matched_idx_2);
      for (let i = matched_idx_1.length -1; i >= 0; i--)
        r[0].splice(matched_idx_1[i],1);
      for (let i = matched_idx_2.length -1; i >= 0; i--)
        r[1].splice(matched_idx_2[i],1);
      // console.log(r[0].length);
    }
    
    // process remaining fountains that were not matched
    r[0] = _.map(r[0], f=>{return mergeFountains(f, 'unmatched')});
    r[1] = _.map(r[1], f=>{return mergeFountains(f, 'unmatched')});
    
    // append the unmatched fountains to the list
    conflated_fountains = _.concat(
      conflated_fountains,
      r[0],
      r[1]
    );
    
    // return fountains
    resolve(collection2GeoJson(conflated_fountains));
  })
}

function mergeFountains(fountains, mergeNotes='', mergeDistance=null) {
  let mergedFountain = {};
  let default_fountain_copy = _.cloneDeep(default_fountain);
  
  // make array of all properties that exist
  // loop through properties of default fountain
  _.forEach(default_fountain_copy.properties, (p, key)=>{
    // extract properties of all fountains
    let propArray = _.map(_.concat(fountains, default_fountain_copy.properties), key);
    // keep only the property with the highest rank available
    mergedFountain[key] = _.sortBy(propArray, ['rank'])[0]
  });
  
  // process panorama and image url
    mergedFountain.pano_url.value = processPanoUrl(mergedFountain);
    // mergedFountain.image_url.value = processImageUrl(mergedFountain);
    
    mergedFountain['merge_notes'] = mergeNotes;
    mergedFountain['merge_distance'] = mergeDistance;
    
  return mergedFountain;
}

function collection2GeoJson(collection){
  return _.map(collection, f=>{
    return {
      type: 'Feature',
      geometry:{
        type: 'Point',
        coordinates: f.coords.value
      },
      properties: _.cloneDeep(f)
    }
  })
}


function processImageUrl(fountain, widthPx=640) {
  if (fountain.image_url.value === null){
    return `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${fountain.coords.value[1]},${fountain.coords.value[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
  }else{
    // construct url of thumbnail
    let imgName = fountain.image_url.value.replace(/ /g, '_');
    
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