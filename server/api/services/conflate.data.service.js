import l from '../../common/logger';
const _ = require('lodash');
const turf = require('@turf/distance');

// This service combines data from osm and wikidata

export function combineData(r) {
  // simple function for combining data from wikidata and osm in a basic way: only panorama url is copied over
  return new Promise((resolve, reject) => {
    let wikidata = r[0];
    let osm = r[1];
    
    // copy some properties over to osm
    if(typeof wikidata.pano_url.value !== 'undefined'){
      osm['pano_url'] = wikidata.pano_url;
    }else{
      // use default panorama link
      osm['pano_url'] = {
        value: `https://www.instantstreetview.com/@${osm.coords.value[1]},${osm.coords.value[0]},0h,0p,1z`
      }
    }
    // format data as a geojson feature
    let data_geojson = {
      geometry:{
        type: 'Point',
        coordinates: osm.coords.value
      },
      properties: {}
    };
    Object.keys(osm).forEach(key=>{
      data_geojson.properties[key] = osm[key].value;
    });
    // return the translated data
    resolve(data_geojson);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}
export function conflate(r) {
  return new Promise((resolve, reject)=>{
    // todo: instead of just returning the data, it must be conflated (identify matching fountains and merge)
    let conflated_fountains = [];
    let matched_idx_1 = [];
    let matched_idx_2 = [];
  
    // try to match based on wikidata id, if possible
    r[0].forEach((f1,idx_1)=>{
      if(f1.hasOwnProperty('id_wikidata')){
        let idx_2 = _.findIndex(r[1], (f2)=>{
          if (f2.hasOwnProperty('id_wikidata')){
            return f1.id_wikidata.value === f2.id_wikidata.value;
          }else{
            return false;
          }
        });
        // if a match was found
        if (idx_2 >= 0){
          // compute distance between fountains
          let d = turf.default(r[0][idx_1].coords.value, r[1][idx_2].coords.value);
          // conlfate the two fountains
          conflated_fountains.push(mergeFountains(
            r[0][idx_1], r[1][idx_2], 'merged by wikidata id', d));
          // document the indexes for removal
          matched_idx_1.push(idx_1);
          matched_idx_2.push(idx_2);
        }
      }
    });
    
    // remove matched fountains (reverse order to not mess up indexes
    // console.log(r[0].length);
    for (let i = matched_idx_1.length -1; i >= 0; i--)
      r[0].splice(matched_idx_1[i],1);
    for (let i = matched_idx_2.length -1; i >= 0; i--)
      r[1].splice(matched_idx_2[i],1);
    // console.log(r[0].length);
    // reset list of matched indexes
    matched_idx_1 = [];
    matched_idx_2 = [];
    
    // try to match based on coordinates
    r[0].forEach((f1,idx_1)=>{
      // compute distance array
      let distances = _.map(r[1], f2=>{
        // compute distance in meters
        return turf.default(f1.coords.value, f2.coords.value)*1000
      });
      let dMin = _.min(distances);
      let idx_2 = _.indexOf(distances,dMin);
      // selection criteria: dMin smaller than 10 meters
      if (dMin < 10){
        // conlfate the two fountains
        conflated_fountains.push(mergeFountains(
          r[0][idx_1], r[1][idx_2], `merged by location`, dMin));
        // document the indexes for removal
        matched_idx_1.push(idx_1);
        matched_idx_2.push(idx_2);
        //todo: if matching is ambiguous, add a note for community
      }
    });
  
    // remove matched fountains again (reverse order to not mess up indexes
    for (let i = matched_idx_1.length -1; i >= 0; i--)
      r[0].splice(matched_idx_1[i],1);
    for (let i = matched_idx_2.length -1; i >= 0; i--)
      r[1].splice(matched_idx_2[i],1);
    // console.log(r[0].length);
    
    // append the unmatched fountains to the list
    // todo: for some reason, we are getting duplicate fountains in the end result
    conflated_fountains = _.concat(
      conflated_fountains,
      r[0],
      r[1]
    );
    
    // return fountains
    resolve(collection2GeoJson(conflated_fountains));
  })
}

function mergeFountains(f1, f2, mergeNotes='', mergeDistance=null) {
  let mergedFountain = {};
  
  // make array of all properties that exist
  // todo: instead of creating this list from the two fountains, the list should be made from a config file that includes default values
  let props = _.union(Object.keys(f1), Object.keys(f2));
  // loop through properties
  props.forEach(p=>{
    // extract properties
    let propArray = _.map([f1, f2], p);
    // keep only the property with the highest rank
    mergedFountain[p] = _.sortBy(propArray, ['rank'])[0]
  });
  
  mergedFountain['merge_notes'] = mergeNotes;
  mergedFountain['merge_distance'] = mergeDistance;
  
  return mergedFountain;
}

function collection2GeoJson(collection){
  return _.map(collection, f=>{
    return {
      "geometry":{
        "type": 'point',
        "coordinates": f.coords.value
      },
      "properties": _.cloneDeep(f)
    }
  })
}