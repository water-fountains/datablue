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
  /**
   * Return all fountains within radius around center
   * @param {number} lat - latitude of center around which fountains should be fetched
   * @param {number} lng - longitude of center
   * @param {number} radius - radius around center to conduct search
   */
  byCenter(lat, lng, radius) {
    // fetch fountains from OSM by coordinates and radius
    return new Promise((resolve, reject)=>{
      let query = queryBuilderCenter(lat, lng, radius);
      // l.info(query);
      query_overpass(query, (error, data)=>{
        if(error){
          reject(error);
        }else{
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
  // The querybuilder uses the sub_sources defined in osm_fountain_config to know which tags should be queried
  let query = `
    (${['node', 'way'].map(e=>
      osm_fountain_config.sub_sources.map((item, i)=>
        `${e}[${item.tag.name}=${item.tag.value}](around:${radius},${lat},${lng});`).join('')).join('')}
    );out center;
  `;
  return query;
}

function queryBuilderBox(latMin, lngMin, latMax, lngMax) {
  // The querybuilder uses the sub_sources defined in osm_fountain_config to know which tags should be queried
  let query = `
    (${['node', 'way'].map(e=>
      osm_fountain_config.sub_sources.map((item, i)=>
    `${e}[${item.tag.name}=${item.tag.value}](${latMin},${lngMin},${latMax},${lngMax});`).join('')).join('')}
    );out center;
  `;
  return query;
}

export default new OsmService();
