/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
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
	const start = new Date();
    l.info(`generateLocationData.service.js: processing all fountains from "${locationName}" `+ start.toISOString());
    return new Promise((resolve, reject)=>{
      // get bounding box of location
      if(!locations.hasOwnProperty(locationName)) {
    	  const err = `location not found in config: ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      let bbox = locations[locationName].bounding_box;
      if (null == bbox) {
    	  const err = `fatal: null == bbox for ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      if (null == bbox.latMin) {
    	  const err = `fatal: null == bbox.latMin for ${locationName}`;
    	  l.error(err );
          reject(new Error(err))
      }
      if (null == bbox.lngMin) {
    	  const err = `fatal: null == bbox.lngMin for ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      if (null == bbox.latMax) {
    	  const err = `fatal: null == bbox.latMax for ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      if (null == bbox.lngMax) {
    	  const err = `fatal: null == bbox.lngMax for ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      if (bbox.lngMin > bbox.lngMax) {
    	  const err = `fatal: bbox.lngMin > bbox.lngMax for ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      if (bbox.latMin > bbox.latMax) {
    	  const err = `fatal: bbox.latMin > bbox.latMax for ${locationName}`;
    	  l.error(err);
          reject(new Error(err))
      }
      // get data from Osm
      let osmPromise = OsmService
        .byBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
        .then(r => applyImpliedPropertiesOsm(r))
        .catch(e=>{
        	if ("getaddrinfo" == e.syscall) {
        		l.info('Are you offline from the internet?');
        	}
          l.error(`generateLocationDataService.js: Error collecting OSM data - generateLocationData: ${e.stack} `+
        		  ' latMi '+bbox.latMin+', lngMi '+bbox.lngMin+', latMx '+bbox.latMax+', lngMx '+ bbox.lngMax);
          reject(e);
        });
      
      // get data from Wikidata
      let wikidataPromise = WikidataService
        .idsByBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax,locationName)
        .then(r=>WikidataService.byIds(r, locationName));
      
      let debugAll = -1 != locationName.indexOf('test');
      
      // conflate
      Promise.all([osmPromise, wikidataPromise])
      // get any missing wikidata fountains for #212
        .then(r=>fillInMissingWikidataFountains(r[0], r[1],locationName))
        .then(r => conflate({
          osm: r.osm,
          wikidata: r.wikidata
        },locationName, debugAll))
        .then(r => defaultCollectionEnhancement(r, locationName, debugAll))
        .then(r => createUniqueIds(r))
        .then(r => {
          const end = new Date();
          const elapse = (end - start)/1000;
          l.info('generateLocationData.service.js: after '+elapse.toFixed(1)+' secs successfully processed all (size '+r.length+
        		  `) fountains from ${locationName} \nstart: `+start.toISOString()+'\nend:   '+end.toISOString());
          resolve({
            type: 'FeatureCollection',
            features: r
          })
        })
        .catch(err => {
        	l.error('generateLocationData.service.js - Promise.all([osmPromise, wikidataPromise]): ' + err.stack);
          reject(err);
        })
      
    });
  }

export default generateLocationData;