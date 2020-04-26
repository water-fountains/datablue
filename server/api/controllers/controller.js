/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import OsmService from '../services/osm.service';
import WikidataService from '../services/wikidata.service';
import l from '../../common/logger'
import generateLocationData from "../services/generateLocationData.service"
import {locations} from '../../../config/locations';
import {fountain_property_metadata} from "../../../config/fountain.properties";

const NodeCache = require( "node-cache" );
import {conflate} from "../services/conflate.data.service";
import applyImpliedPropertiesOsm from "../services/applyImplied.service";
import {
  essenceOf, defaultCollectionEnhancement, fillInMissingWikidataFountains,
  fillWikipediaSummary
} from "../services/processing.service";
import {updateCacheWithFountain} from "../services/database.service";
import {extractProcessingErrors} from "./processing-errors.controller";
import {getImageInfo,getImgsOfCat} from "../services/wikimedia.service";
import {getCatExtract,getImgClaims} from "../services/claims.wm";
const haversine = require("haversine");
const _ = require('lodash');
import {MAX_IMG_SHOWN_IN_GALLERY, LAZY_ARTIST_NAME_LOADING_i41db //,CACHE_FOR_HRS_i45db
  } from "../../common/constants";
const sharedConstants = require('./../../common/shared-constants');


// Configuration of Cache after https://www.npmjs.com/package/node-cache
const cityCache = new NodeCache( {
  stdTTL: 60*60*sharedConstants.CACHE_FOR_HRS_i45db, // time till cache expires, in seconds
  checkperiod: 30, // how often to check for expiration, in seconds
  deleteOnExpire: false, // on expire, we want the cache to be recreated not deleted
  useClones: false // do not create a clone of the data when fetching from cache
} );


/*
* For each location (city), three JSON objects are created. Example for Zurich:
* - "ch-zh": contains the full data for all fountains of the location
* - "ch-zh_essential": contains a summary version of "ch-zh". This is the data loaded for display on the map. It is derived from "ch-zh".
* - "ch-zh_errors": contains a list of errors encountered when processing "ch-zh". 
*/


// when cached data expires, regenerate it (ignore non-essential)
cityCache.on('expired', (key, value)=>{
  // check if cache item key is neither the summary nor the list of errors. These will be updated automatically when the detailed city data are updated.
  if(!key.includes('_essential') && !key.includes('_errors')){
    l.info(`controller.js cityCache.on('expired',...): Automatic cache refresh of ${key}`);
    
    // trigger a reprocessing of the location's data, based on the key.
    generateLocationData(key)
      .then(fountainCollection=>{
        // save newly generated fountainCollection to the cache
        cityCache.set(key, fountainCollection, 60*60*locations.CACHE_FOR_HRS_i45db); // expire after two hours
  
        // create a reduced version of the data as well
        cityCache.set(key + '_essential', essenceOf(fountainCollection));
  
        // also create list of processing errors (for proximap#206)
        cityCache.set(key + '_errors', extractProcessingErrors(fountainCollection))

      }).catch(error =>{
      l.error(`controller.js unable to set Cache. Error: ${error.stack}`)
    })
  }
});

export class Controller {
  constructor(){

    // In production mode, process all fountains when starting the server so that the data are ready for the first requests
    if(process.env.NODE_ENV === 'production') {
      for (let location_code of Object.keys(locations)){
        l.info(`controller.js Generating data for ${location_code}`);
        generateLocationData(location_code)
          .then(fountainCollection => {
            // save new data to storage
            cityCache.set(location_code, fountainCollection, 60 * 60 * locations.CACHE_FOR_HRS_i45db); // expire after two hours
            // create a reduced version of the data as well
            cityCache.set(location_code + '_essential', essenceOf(fountainCollection));
            // also create list of processing errors (for proximap#206)
            cityCache.set(location_code + '_errors', extractProcessingErrors(fountainCollection))
          })
      }
    }
  }
  
  // Function to return detailed fountain information
  // When requesting detailed information for a single fountain, there are two types of queries
  getSingle(req, res){
	  const start = new Date();
	  let what = 'unkWhat';
    l.info(`controller.js getSingle: refresh: ${req.query.refresh} , city: `+req.query.city+' '+start.toISOString())      
    if(req.query.queryType === 'byCoords'){
      // byCoords will return the nearest fountain to the given coordinates. 
      // The databases are queried and fountains are reprocessed for this
      reprocessFountainAtCoords(req, res,req.query.city)
      what = 'reprocessFountainAtCoords';
    }else{
      // byId will look into the fountain cache and return the fountain with the given identifier
      byId(req, res,req.query.idval)
      what = 'byId';
    }
    const end = new Date();
    const elapse = (end - start)/1000;
    //l.info('controller.js getSingle: '+what+' finished after '+elapse.toFixed(1)+' secs\nend:   '+end.toISOString());
  }
  
  // Function to return all fountain information for a location.
  byLocation(req, res){
	  const start = new Date();
    // if a refresh is requested or if no data is in the cache, then reprocessess the fountains
    if(req.query.refresh || cityCache.keys().indexOf(req.query.city) === -1){
      l.info(`controller.js byLocation: refresh: ${req.query.refresh} , city: `+req.query.city)      
      generateLocationData(req.query.city)
        .then(fountainCollection => {
        // save new data to storage
        cityCache.set(req.query.city, fountainCollection, 60*60*locations.CACHE_FOR_HRS_i45db);
        
        // create a reduced version of the data as well
        let r_essential = essenceOf(fountainCollection);
        cityCache.set(req.query.city + '_essential', r_essential);
        
        // return either the full or reduced version, depending on the "essential" parameter of the query
        if(req.query.essential){
        	doJson(res,r_essential,'r_essential'); //res.json(r_essential);
        }else{
        	doJson(res,fountainCollection,'fountainCollection'); //res.json(fountainCollection);
        }
        
        // also create list of processing errors (for proximap#206)
        cityCache.set(req.query.city + '_errors', extractProcessingErrors(fountainCollection));
        const end = new Date();
        const elapse = (end - start)/1000;
        l.info('controller.js byLocation generateLocationData: finished after '+elapse.toFixed(1)+' secs\nend:   '+end.toISOString());
      })
        .catch(error =>{
          if(error.message){res.statusMessage = error.message;}
          res.status(500).send(error.stack);
        })
    }
    // otherwise, get the data from storage
    else{
      if(req.query.essential){
    	  doJson(res,cityCache.get(req.query.city + '_essential'),'fromCache essential'); //res.json(cityCache.get(req.query.city + '_essential'));
      }else{
    	  doJson(res,cityCache.get(req.query.city), 'fromCache'); //res.json(cityCache.get(req.query.city));
      }
      const end = new Date();
      const elapse = (end - start)/1000;
      l.info('controller.js byLocation: finished after '+elapse.toFixed(1)+' secs\nend:   '+end.toISOString());
    }
  }
  
  /**
   *  Function to return metadata regarding all the fountain properties that can be displayed. 
   * (e.g. name translations, definitions, contribution information and tips)
   * it simply returns the object created by fountain.properties.js
   */
  getPropertyMetadata(req, res) {
	  doJson(res,fountain_property_metadata,'getPropertyMetadata'); //res.json(fountain_property_metadata);
    l.info("controller.js: getPropertyMetadata sent "+new Date().toISOString());
  }
  
  /**
   * Function to return metadata about locations supported by application
   */
  getLocationMetadata(req, res) {
    // let gak = locations.gak;
	  doJson(res,locations,'getLocationMetadata'); //res.json(locations);
    l.info("controller.js: getLocationMetadata sent "+new Date().toISOString());
  }
  
  getSharedConstants(req, res) {
    doJson(res,sharedConstants,'getSharedConstants'); //res.json(locations);
    l.info("controller.js: getSharedConstants sent "+new Date().toISOString());
  }
  
  /**
   * Function to extract processing errors from detailed list of fountains
   */
  getProcessingErrors(req, res){
    // returns all processing errors for a given location
    // made for #206
    let key = req.query.city + '_errors';
    
    if(cityCache.keys().indexOf(key)<0) {
      // if data not in cache, create error list
      cityCache.set(key, extractProcessingErrors(cityCache.get(req.query.city)));
    }
    cityCache.get(key, (err, value) => {
      if (!err) {
    	  doJson(res,value,'cityCache.get '+key); //res.json(value);
        l.info("controller.js: getProcessingErrors !err sent "+new Date().toISOString());
      } else {
        let errMsg = 'Error with cache: ' + err;
        l.info("controller.js: getProcessingErrors "+errMsg+" "+new Date().toISOString());
        res.statusMessage = errMst;
        res.status(500).send(err.stack);
      }
    });
  }
}
export default new Controller();

function doJson(resp, obj, dbg) {
	//TODO consider using https://github.com/timberio/timber-js/issues/69 or rather https://github.com/davidmarkclements/fast-safe-stringify
	try {
		if (null == obj) {
			let errS = 'controller.js doJson null == obj: '+dbg+' '+new Date().toISOString(); 
	        l.error(errS);
		}
		let res = resp.json(obj);
	    if(process.env.NODE_ENV !== 'production') {
	    	// https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_class_http_serverresponse Event finish
	    	resp.finish = resp.close = function (event) {
	    		//not working  :(  https://github.com/water-fountains/datablue/issues/40
	    		//https://github.com/expressjs/express/issues/4158 https://github.com/expressjs/express/blob/5.0/lib/response.js   
	    		l.info('controller.js doJson length: keys '+Object.keys(obj).length+
            		//'\n responseData.data.length '+resp.responseData.data.length+
            		' -  '+dbg+' '+new Date().toISOString());
	    	}
	    }
		return res;
	} catch (err) {
		let errS = 'controller.js doJson errors: "'+err+'" '+dbg+' '+new Date().toISOString(); 
        l.error(errS);
		console.trace(errS);
	}
}

/**
 * Function to respond to request by returning the fountain as defined by the provided identifier
 */
function byId(req, res, dbg){
  let cityS = req.query.city;
  let name = 'unkNamById';
//  l.info('controller.js byId: '+cityS+' '+dbg+' '+new Date().toISOString());
  let cty = cityCache.get(cityS);
  return new Promise((resolve, reject) => {
//	  l.info('controller.js byId in promise: '+cityS+' '+dbg+' '+new Date().toISOString());
      if (null== cty) {
        l.info('controller.js byId: '+cityS+' not found in cache '+dbg+' - start city lazy load');
        generateLocationData(cityS);
        cty = cityCache.get(cityS);
      }
      let fountain = _.find(
       cty.features,
        f=>{
          return f.properties['id_'+req.query.database].value === req.query.idval
        });
      let imgMetaPromises = [];
	  let lazyAdded = 0;
	  let gl = -1;
      if (null== fountain) {
          l.info('controller.js byId: of '+cityS+' not found in cache '+dbg+' '+new Date().toISOString());
      } else {
    	  const props = fountain.properties;
//    	  l.info('controller.js byId fountain: '+cityS+' '+dbg+' '+new Date().toISOString());
    	  if (null != props) {
    		  name = props.name.value;
    		  if (LAZY_ARTIST_NAME_LOADING_i41db) {
    			  imgMetaPromises.push(WikidataService.fillArtistName(fountain,dbg));
    		  }
    		  imgMetaPromises.push(WikidataService.fillOperatorInfo(fountain,dbg));
    		  fillWikipediaSummary(fountain, dbg, 1, imgMetaPromises);
    		  const gal = props.gallery
//  		  l.info('controller.js byId props: '+cityS+' '+dbg+' '+new Date().toISOString());
    		  if (null != gal && null != gal.value) {
    			  gl = gal.value.length;
//  			  l.info('controller.js byId gl: '+cityS+' '+dbg+' '+new Date().toISOString());
    			  if (0 < gl) {
//  				  l.info('controller.js byId: of '+cityS+' found gal of size '+gl+' "'+name+'" '+dbg+' '+new Date().toISOString());
    				  let i = 0;
    				  let lzAtt = '';
    				  const showDetails = true;
    				  const singleRefresh = true;
    				  let imgUrlSet = new Set();
    				  let catPromises = [];
    				  let numbOfCats = -1;
    				  let numbOfCatsLazyAdded = 0;
    				  let imgUrlsLazyByCat = [];
    				  if (props.wiki_commons_name && props.wiki_commons_name.value && 0 < props.wiki_commons_name.value.length) {
    					  numbOfCats = props.wiki_commons_name.value.length;
    					  for(const cat of props.wiki_commons_name.value) {
    						  const add = 0 > cat.l;
    						  if (add) {
    							  numbOfCatsLazyAdded++;
    							  if (0 == imgUrlSet.size) {
    								  for(const img of gal.value) {
    									  imgUrlSet.add(img.pgTit);
    								  }
    							  }
    							  const catPromise = getImgsOfCat(cat, dbg, cityS, imgUrlSet, imgUrlsLazyByCat, "dbgIdWd", props,true);
    							  //TODO we might prioritize categories with small number of images to have greater variety of images?
    							  catPromises.push(catPromise);
    						  }
    					      getCatExtract(singleRefresh,cat, catPromises, dbg);
    					  }  
    				  }         			  
    				  Promise.all(catPromises).then(r => {
    					  for(let k = 0; k < imgUrlsLazyByCat.length && k < MAX_IMG_SHOWN_IN_GALLERY;k++) { //between 6 && 50 imgs are on the gallery-preview
    						  const img = imgUrlsLazyByCat[k];
    						  let nImg = {s: img.src,pgTit: img.val,c: img.cat,t:img.typ};
    						  gal.value.push(nImg);
    					  }   
    					  if (0 < imgUrlsLazyByCat.length) {
    						  l.info('controller.js byId lazy img by lazy cat added: attempted '+imgUrlsLazyByCat.length+' in '+numbOfCatsLazyAdded+'/'+
    								  numbOfCats+' cats, tot '+gl+' of '+cityS+' '+dbg+' "'+name+'" '+r.length+' '+new Date().toISOString());
    					  }
    					  for(const img of gal.value) {
    						  let imMetaDat = img.metadata; 
    						  if (null == imMetaDat && 'wm' == img.t) {
    							  lzAtt += i+',';
    							  l.info('controller.js byId lazy getImageInfo: '+cityS+' '+i+'/'+gl+' "'+img.pgTit+'" "'+name+'" '+dbg+' '+new Date().toISOString());
    							  imgMetaPromises.push(getImageInfo(img, i+'/'+gl+' '+dbg+' '+name+' '+cityS,showDetails, props).catch(giiErr=>{
    								  l.info('wikimedia.service.js: fillGallery getImageInfo failed for "'+img.pgTit+'" '+dbg+' '+city+' '+dbgIdWd+' "'+name+'" '+new Date().toISOString()
    										  + '\n'+giiErr.stack);
    							  }));
    							  lazyAdded++;
    						  } else {
//  							  l.info('controller.js byId: of '+cityS+' found imMetaDat '+i+' in gal of size '+gl+' "'+name+'" '+dbg+' '+new Date().toISOString());
    						  }
    					      getImgClaims(singleRefresh,img, imgMetaPromises, dbg);
    						  i++;
    					  }
    					  if (0 < lazyAdded) {
    						  l.info('controller.js byId lazy img metadata loading: attempted '+lazyAdded+'/'+gl+' ('+lzAtt+') of '+cityS+' '+dbg+' "'+name+'" '+new Date().toISOString());
    					  }
    					  Promise.all(imgMetaPromises).then(r => {
    						  if (0 < lazyAdded) {
    							  l.info('controller.js byId lazy img metadata loading after promise: attempted '+lazyAdded+' tot '+gl+' of '+cityS+' '+dbg+' "'+name+'" '+r.length+' '+new Date().toISOString());
    						  }
    						  doJson(res,fountain, 'byId '+dbg); //  res.json(fountain);
    						  l.info('controller.js byId: of '+cityS+' res.json '+dbg+' "'+name+'" '+new Date().toISOString());
    						  resolve(fountain);      
    					  }, err => {
    						  l.error(`controller.js: Failed on imgMetaPromises: ${err.stack} .`+dbg+' "'+name+'" '+cityS);
    					  });
    				  }, err => {
    					  l.error(`controller.js: Failed on imgMetaPromises: ${err.stack} .`+dbg+' "'+name+'" '+cityS);
    				  });
    			  } else {
    				  l.info('controller.js byId: of '+cityS+' gl < 1  '+dbg+' '+new Date().toISOString());
					  Promise.all(imgMetaPromises).then(r => {
						  if (0 < lazyAdded) {
							  l.info('controller.js byId lazy img metadata loading after promise: attempted '+lazyAdded+' tot '+gl+' of '+cityS+' '+dbg+' "'+name+'" '+r.length+' '+new Date().toISOString());
						  }
						  doJson(res,fountain, 'byId '+dbg); //  res.json(fountain);
						  l.info('controller.js byId: of '+cityS+' res.json '+dbg+' "'+name+'" '+new Date().toISOString());
						  resolve(fountain);      
					  }, err => {
						  l.error(`controller.js: Failed on imgMetaPromises: ${err.stack} .`+dbg+' "'+name+'" '+cityS);
					  });
    			  }
    		  } else {
    			  l.info('controller.js byId: of '+cityS+' gallery null || null == gal.val  '+dbg+' '+new Date().toISOString());
    		  }
    	  } else {
              l.info('controller.js byId: of '+cityS+' no props '+dbg+' '+new Date().toISOString());
    	  }
      }
//      l.info('controller.js byId: end of '+cityS+' '+dbg+' '+new Date().toISOString());
    }).catch (e=> {
    l.error(`controller.js byId: Error finding fountain in preprocessed data: ${e} , city: `+cityS+ ' '+dbg+' '+new Date().toISOString());
    l.error(e.stack);
  })  
}


/**
 * Function to reprocess data near provided coordinates and update cache with fountain. 
 * The req.query object should have the following properties:
 * - lat: latitude of search location
 * - lng: longitude of search location
 * - radius: radius in which to search for fountains
 */
function reprocessFountainAtCoords(req, res, dbg) {
  
  l.info(`controller.js reprocessFountainAtCoords: all fountains near lat:${req.query.lat}, lon: ${req.query.lng}, radius: ${req.query.radius} `+dbg);
  
  // OSM promise
  let osmPromise = OsmService
    // Get data from OSM within given radius
    .byCenter(req.query.lat, req.query.lng, req.query.radius)
    // Process OSM data to apply implied properties
    .then(r => applyImpliedPropertiesOsm(r))
    .catch(e=>{
      l.error(`controller.js reprocessFountainAtCoords: Error collecting OSM data: ${JSON.stringify(e)} `+new Date().toISOString());
      res.status(500).send(e.stack);
    });
  
  let wikidataPromise = WikidataService
    // Fetch all wikidata items within radius
    .idsByCenter(req.query.lat, req.query.lng, req.query.radius, dbg)
    // Fetch detailed information for fountains based on wikidata ids
    .then(r=>WikidataService.byIds(r, dbg))
    .catch(e=>{
      l.error(`Error collecting Wikidata data: ${e}`);
      res.status(500).send(e.stack);
    });
  let debugAll = true;
  // When both OSM and Wikidata data have been collected, continue with joint processing
  Promise.all([osmPromise, wikidataPromise])

    // Get any missing wikidata fountains for #212 (fountains not fetched from Wikidata because not listed as fountains, but referenced by fountains of OSM)
    .then(r=>fillInMissingWikidataFountains(r[0], r[1]))

    // Conflate osm and wikidata fountains together
    .then(r => conflate({
      osm: r.osm,
      wikidata: r.wikidata
    },dbg, debugAll))

    // return only the fountain that is closest to the coordinates of the query
    .then(r => {
      let distances = _.map(r, f=>{
        // compute distance to center for each fountain
        return haversine(
          f.geometry.coordinates, [req.query.lng, req.query.lat], {
            unit: 'meter',
            format: '[lon,lat]'
          });
      });
      // return closest
      let closest = r[_.indexOf(distances, _.min(distances))];
      return [closest];
    })

     // fetch more information about fountains (Artist information, gallery, etc.)
    .then(r => defaultCollectionEnhancement(r,dbg))

    // Update cache with newly processed fountain
    .then(r=>{
      let closest = updateCacheWithFountain(cityCache, r[0], req.query.city);
      doJson(res,closest,'after updateCacheWithFountain'); //  res.json(closest);
  })
    .catch(e=>{
      l.error(`Error collecting data: ${e}`);
      res.status(500).send(e.stack);
    });
}
