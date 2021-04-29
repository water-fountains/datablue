/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import osm_fountain_config from '../../../config/fountains.sources.osm';
import { FountainConfig } from '../../common/typealias';
//TODO we could use overpas-ts thought I am not sure how well it is maintained and up-to-date
import query_overpass from 'query-overpass';

interface OsmFountainConfigCollection {
  features: FountainConfig[];
}

class OsmService {
  /**
   * Return all fountains within radius around center
   * @param {number} lat - latitude of center around which fountains should be fetched
   * @param {number} lng - longitude of center
   * @param {number} radius - radius around center to conduct search
   */
  byCenter(lat: number, lng: number, radius: number): Promise<FountainConfig[]> {
    // fetch fountains from OSM by coordinates and radius
    return new Promise((resolve, reject) => {
      const query = queryBuilderCenter(lat, lng, radius);
      if (process.env.NODE_ENV !== 'production') {
        l.info('osm.service byCenter: ' + query);
      }
      query_overpass(
        query,
        (error: any, data: OsmFountainConfigCollection) => {
          if (error) {
            reject(error);
          } else {
            l.info('osm.service byCenter: resulted in ' + data.features.length + ' foutains ');
            resolve(data.features);
          }
        },
        { flatProperties: true }
      );
    });
  }

  byBoundingBox(latMin: number, lngMin: number, latMax: number, lngMax: number): Promise<FountainConfig[]> {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject) => {
      const query = queryBuilderBox(latMin, lngMin, latMax, lngMax);
      // l.info(query);
      query_overpass(
        query,
        (error: any, data: OsmFountainConfigCollection) => {
          if (error) {
            reject(error);
          } else if (data.features.length === 0) {
            l.info('osm.service.js byBoundingBox - NO_FOUNTAIN_AT_LOCATION: ' + query);
            resolve(data.features);
          } else {
            if (process.env.NODE_ENV !== 'production') {
              l.info('osm.service.js byBoundingBox: ' + query);
            }
            l.info('osm.service.js byBoundingBox: resulted in ' + data.features.length + ' fountains');
            resolve(data.features);
          }
        },
        { flatProperties: true }
      );
    });
  }
}

function queryBuilderCenter(lat: number, lng: number, radius = 10): string {
  // The querybuilder uses the sub_sources defined in osm_fountain_config to know which tags should be queried
  return `
    (${['node', 'way']
      .map((e) =>
        osm_fountain_config.sub_sources
          .map((item) => `${e}[${item.tag.name}=${item.tag.value}](around:${radius},${lat},${lng});`)
          .join('')
      )
      .join('')}
    );out center;
  `;
}

function queryBuilderBox(latMin: number, lngMin: number, latMax: number, lngMax: number): string {
  // The querybuilder uses the sub_sources defined in osm_fountain_config to know which tags should be queried
  return `
    (${['node', 'way']
      .map((e) =>
        osm_fountain_config.sub_sources
          .map((item) => `${e}[${item.tag.name}=${item.tag.value}](${latMin},${lngMin},${latMax},${lngMax});`)
          .join('')
      )
      .join('')}
    );out center;
  `;
}

export default new OsmService();
