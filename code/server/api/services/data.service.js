import l from '../../common/logger';
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
        }else{
          resolve(data);
        }
      }, {flatProperties: true})
    })
  }
}

export default new DataService();
