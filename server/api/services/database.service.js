/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import {essenceOf} from "./processing.service";
import {CACHE_FOR_HRS_i45db} from "../../common/constants";

const _ = require('lodash');
const haversine = require('haversine');

export function updateCacheWithFountain(cache, fountain, cityname) {
  // updates cache and returns fountain with datablue id
  // get city data from cache
  let fountains = cache.get(cityname);
  const cacheTimeInSecs = 60*60*CACHE_FOR_HRS_i45db;
  if(fountains){
    // replace fountain
    [fountains, fountain] = replaceFountain(fountains, fountain, cityname);
    // send to cache
    cache.set(cityname, fountains, cacheTimeInSecs);
    // create a reduced version of the data as well
    let r_essential = essenceOf(fountains);
    cache.set(cityname + '_essential', r_essential, cacheTimeInSecs);
    return fountain;
  }
  l.info('database.services.js updateCacheWithFountain: no fountains were in cache of city '+cityname+' tried to work on '+fountain+' '+new Date().toISOString());
  return fountain;
}

function replaceFountain(fountains, fountain, cityname) {
//    update cache with fountain and assign correct datablue id
  
  let distances = [];
  
  for(let j = 0; j < fountains.features.length; j++ ){
    let ismatch =is_match(fountains.features[j], fountain);
    if(ismatch === true){
      //replace fountain
      fountain.properties.id = fountains.features[j].properties.id;
      fountains.features[j] = fountain;
      l.info('database.services.js replaceFountain: ismatch ftn '+j+',  city '+cityname+' , ftn '+fountain+' '+new Date().toISOString());
      return [fountains, fountain];
    }else{
      // compute distance otherwise
      distances.push(
      haversine(fountains.features[j].geometry.coordinates, fountain.geometry.coordinates, {
        unit: 'meter',
        format: '[lon,lat]'
      }))
    }
  };
  
  let min_d = _.min(distances);
  if(min_d < 15){
    let key = _.indexOf(distances, min_d);
    //replace fountain
    fountain.properties.id = f.properties.id;
    l.info('database.services.js replaceFountain: replaced with distance '+min_d+',  city '+cityname+' , ftn '+fountain+' '+new Date().toISOString());
    fountains.features[key] = fountain;
    return [fountains, fountain];
  }else{
    // fountain was not found; just add it to the list
    fountain.properties.id = _.max(fountains.features.map(f=>{return f.properties.id}))+1;
    fountains.features.push(fountain);
    l.info('database.services.js replaceFountain: added with distance '+min_d+',  city '+cityname+' , ftn '+fountain+' '+new Date().toISOString());
    return [fountains, fountain];
  }
}


function is_match(f1, f2) {
  // returns true if match, otherwise returns distance
  let ids = ['id_wikidata', 'id_operator', 'id_osm'];
  for(let id_name of ids){
    if(f1.properties[id_name].value === f2.properties[id_name].value){
      return true;
    }
  }
}