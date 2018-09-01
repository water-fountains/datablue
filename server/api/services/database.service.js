import {essenceOf} from "./processing.service";

const _ = require('lodash');
const haversine = require('haversine');

export function updateCacheWithFountain(cache, fountain, cityname) {
  // updates cache and returns fountain with datablue id
  // get city data from cache
  let fountains = cache.get(cityname);
  // replace fountain
  [fountains, fountain] = replaceFountain(fountains, fountain);
  // send to cache
  cache.set(cityname, fountains, 60*60*2);
  // create a reduced version of the data as well
  let r_essential = essenceOf(fountains);
  cache.set(cityname + '_essential', r_essential, 60*60*2);
  return fountain;
}

function replaceFountain(fountains, fountain) {
//    update cache with fountain and assign correct datablue id
  
  let distances = [];
  
  _.forEach(fountains.features, function(f, key){
    let ismatch =is_match(f, fountain);
    if(ismatch === true){
      //replace fountain
      fountain.properties.id = f.properties.id;
      fountains.features[key] = fountain;
      return fountains;
    }else{
      distances.push(ismatch)
    }
  });
  
  let min_d = _.min(distances);
  if(min_d < 15){
    let key = _.indexOf(distances, min_d);
    //replace fountain
    fountain.properties.id = f.properties.id;
    fountains.features[key] = fountain;
    return fountains;
  }else{
    // fountain was not found; just add it to the list
    fountain.properties.id = _.max(fountains.features.map(f=>{return f.properties.id}))+1;
    fountains.features.push(fountain);
    return [fountains, fountain];
  }
}


function is_match(f1, f2) {
  // returns true if match, otherwise returns distance
  _.forEach(['id_wikidata', 'id_operator', 'id_osm'], id_name=>{
    if(f1.properties[id_name].value === f2.properties[id_name].value){
      return true;
    }
    // compute distances
    return haversine(f1.geometry.coordinates, f2.geometry.coordinates, {
      unit: 'meter',
      format: '[lon,lat]'
    })
  })
}