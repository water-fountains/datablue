import l from '../../common/logger';
import {NO_FOUNTAIN_AT_LOCATION} from "./constants";
import osm_fountain_config from "../../../config/fountains.sources.osm";
var query_overpass = require('query-overpass');

class DataService {
  byCenter(lat, lng) {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject)=>{
      let query = queryBuilderCenter(lat, lng);
      l.debug(query);
      query_overpass(query, (error, data)=>{
        if(error){
          reject(error);
        }else if(data.features.length === 0){
          reject(new Error(NO_FOUNTAIN_AT_LOCATION));
        }else{
          // return only the first fountain in the list
          // l.info(data.features[0]);
          resolve(data.features[0]);
        }
      }, {flatProperties: true})
    })
  }
  
  byBoundingBox(latMin, lngMin, latMax, lngMax) {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject)=>{
      let query = queryBuilderCenter(latMin, lngMin, latMax, lngMax);
      query_overpass(query, (error, data)=>{
        if(error){
          reject(error);
        }else if(data.features.length === 0){
          reject(new Error(NO_FOUNTAIN_AT_LOCATION));
        }else{
          // return only the first fountain in the list
          // l.info(data.features[0]);
          resolve(data.features);
        }
      }, {flatProperties: true})
    })
  }
}

function queryBuilderCenter(lat, lng) {
  let query = `
    (${osm_fountain_config.sub_sources.map((item, i)=>
    `node[${item.tag.name}=${item.tag.value}](around:10.0,${lat},${lng});`).join('')}
    );out;
  `;
  return query;
}

function queryBuilderBox(latMin, lngMin, latMax, lngMax) {
  let query = `
    (${osm_fountain_config.sub_sources.map((item, i)=>
    `node[${item.tag.name}=${item.tag.value}](${latMin},${lngMin},${latMax},${lngMax});`).join('')}
    );out;
  `;
  return query;
}

export default new DataService();
