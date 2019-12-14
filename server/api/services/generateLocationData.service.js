/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */


import l from '../../common/logger'
import {locations} from '../../../config/locations';
import OsmService from '../services/osm.service';
import WikidataService from '../services/wikidata.service';
import {conflate} from "../services/conflate.data.service";
import applyImpliedPropertiesOsm from "../services/applyImplied.service";
import {
  createUniqueIds, essenceOf, defaultCollectionEnhancement, fillInMissingWikidataFountains
} from "../services/processing.service";

 /**
  * This function creates fountain collections
  * @param {string} locationName - the code name of the location for which fountains should be processed
  */
function generateLocationData(locationName){
    l.info(`processing all fountains from ${locationName}`);
    return new Promise((resolve, reject)=>{
      // get bounding box of location
      if(!locations.hasOwnProperty(locationName)){
        reject(new Error(`location not found in config: ${locationName}`))
      }
      let bbox = locations[locationName].bounding_box;
      // get data from Osm
      let osmPromise = OsmService
        .byBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
        .then(r => applyImpliedPropertiesOsm(r))
        .catch(e=>{
          l.error(`Error collecting OSM data: ${JSON.stringify(e)}`);
          reject(e);
        });
      
      // get data from Wikidata
      let wikidataPromise = WikidataService
        .idsByBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
        .then(r=>WikidataService.byIds(r));
      
      // conflate
      Promise.all([osmPromise, wikidataPromise])
      // get any missing wikidata fountains for #212
        .then(r=>fillInMissingWikidataFountains(r[0], r[1]))
        .then(r => conflate({
          osm: r.osm,
          wikidata: r.wikidata
        }))
        .then(r => defaultCollectionEnhancement(r))
        .then(r => createUniqueIds(r))
        .then(r => {
          //TODO add location size as per https://github.com/water-fountains/datablue/issues/39
          l.info(`successfully processed all (size t.b.d.) fountains from ${locationName} `);
          resolve({
            type: 'FeatureCollection',
            features: r
          })
        })
        .catch(error => {
          reject(error);
        })
      
    });
  }

export default generateLocationData;