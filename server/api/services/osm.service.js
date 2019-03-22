/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import {NO_FOUNTAIN_AT_LOCATION} from "./constants";
import osm_fountain_config from "../../../config/fountains.sources.osm";
var query_overpass = require('query-overpass');

class OsmService {
  byCenter(lat, lng) {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject)=>{
      let query = queryBuilderCenter(lat, lng);
      // l.debug(query);
      query_overpass(query, (error, data)=>{
        if(error){
          reject(error);
        // }else if(data.features.length === 0){
        //   reject(new Error(NO_FOUNTAIN_AT_LOCATION));
        }else{
          // return only the first fountain in the list
          // l.info(data.features[0]);
          resolve(data.features);
        }
      }, {flatProperties: true})
    })
  }
  
  byBoundingBox(latMin, lngMin, latMax, lngMax) {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject)=>{
      let query = queryBuilderBox(latMin, lngMin, latMax, lngMax);
      // l.info(query);
      query_overpass(query, (error, data)=>{
        if(error){
          reject(error);
        }else if(data.features.length === 0){
          reject(new Error(NO_FOUNTAIN_AT_LOCATION));
        }else{
          resolve(data.features);
        }
      }, {flatProperties: true})
    })
  }
}

function queryBuilderCenter(lat, lng, radius=10) {
  let query = `
    (${['node', 'way'].map(e=>
      osm_fountain_config.sub_sources.map((item, i)=>
        `${e}[${item.tag.name}=${item.tag.value}](around:${radius},${lat},${lng});`).join('')).join('')}
    );out center;
  `;
  return query;
}

function queryBuilderBox(latMin, lngMin, latMax, lngMax) {
  let query = `
    (${['node', 'way'].map(e=>
      osm_fountain_config.sub_sources.map((item, i)=>
    `${e}[${item.tag.name}=${item.tag.value}](${latMin},${lngMin},${latMax},${lngMax});`).join('')).join('')}
    );out center;
  `;
  return query;
}

export default new OsmService();
