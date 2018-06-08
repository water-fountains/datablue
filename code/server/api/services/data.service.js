import l from '../../common/logger';
import {NO_FOUNTAIN_AT_LOCATION} from "./constants";
var http = require('http');
var query_overpass = require('query-overpass');

class DataService {
  byCoords(lat, lng) {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject)=>{
      let query = 'node[amenity=drinking_water](around:10.0,' + lat + ',' + lng + ');out;';
      // l.info(query);
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
}

export default new DataService();
