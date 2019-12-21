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
  createUniqueIds, essenceOf, defaultCollectionEnhancement, fillInMissingWikidataFountains
} from "../services/processing.service";
import {updateCacheWithFountain} from "../services/database.service";
import {extractProcessingErrors} from "./processing-errors.controller";
const haversine = require("haversine");
const _ = require('lodash');


// Configuration of Cache after https://www.npmjs.com/package/node-cache
const cityCache = new NodeCache( {
  stdTTL: 60*60*2, // time till cache expires, in seconds
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
    
    l.info(`cityCache.on('expired',...): Automatic cache refresh of ${key}`);
    
    // trigger a reprocessing of the location's data, based on the key.
    generateLocationData(key)
      .then(fountainCollection=>{
        // save newly generated fountainCollection to the cache
        cityCache.set(key, fountainCollection, 60*60*2); // expire after two hours
  
        // create a reduced version of the data as well
        cityCache.set(key + '_essential', essenceOf(fountainCollection));
  
        // also create list of processing errors (for proximap#206)
        cityCache.set(key + '_errors', extractProcessingErrors(fountainCollection))

      }).catch(error =>{
      l.error(`unable to set Cache. Error: ${error}`)
    })
  }
});

export class Controller {
  constructor(){

    // In production mode, process all fountains when starting the server so that the data are ready for the first requests
    if(process.env.NODE_ENV === 'production') {
      for (let location_code of Object.keys(locations)){
        l.info(`Generating data for ${location_code}`);
        generateLocationData(location_code)
          .then(fountainCollection => {
            // save new data to storage
            cityCache.set(location_code, fountainCollection, 60 * 60 * 2); // expire after two hours
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
    l.info(`getSingle: refresh: ${req.query.refresh} , city: `+req.query.city)      
    if(req.query.queryType === 'byCoords'){
      // byCoords will return the nearest fountain to the given coordinates. 
      // The databases are queried and fountains are reprocessed for this
      reprocessFountainAtCoords(req, res,req.query.city)
    }else{
      // byId will look into the fountain cache and return the fountain with the given identifier
      byId(req, res,req.query.idval)
    }
  }
  
  // Function to return all fountain information for a location.
  byLocation(req, res){
    // if a refresh is requested or if no data is in the cache, then reprocessess the fountains
    if(req.query.refresh || cityCache.keys().indexOf(req.query.city) === -1){
      l.info(`byLocation: refresh: ${req.query.refresh} , city: `+req.query.city)      
      generateLocationData(req.query.city)
        .then(fountainCollection => {
        // save new data to storage
        cityCache.set(req.query.city, fountainCollection, 60*60*2);
        
        // create a reduced version of the data as well
        let r_essential = essenceOf(fountainCollection);
        cityCache.set(req.query.city + '_essential', r_essential);
        
        // return either the full or reduced version, depending on the "essential" parameter of the query
        if(req.query.essential){
          res.json(r_essential);
        }else{
          res.json(fountainCollection);
        }
        
        // also create list of processing errors (for proximap#206)
        cityCache.set(req.query.city + '_errors', extractProcessingErrors(fountainCollection));
      })
        .catch(error =>{
          if(error.message){res.statusMessage = error.message;}
          res.status(500).send(error.stack);
        })
    }
    // otherwise, get the data from storage
    else{
      if(req.query.essential){
        res.json(cityCache.get(req.query.city + '_essential'));
      }else{
        res.json(cityCache.get(req.query.city));
      }
    }
  }
  
  /**
   *  Function to return metadata regarding all the fountain properties that can be displayed. 
   * (e.g. name translations, definitions, contribution information and tips)
   * it simply returns the object created by fountain.properties.js
   */
  getPropertyMetadata(req, res) {
    res.json(fountain_property_metadata);
  }
  
  /**
   * Function to return metadata about locations supported by application
   */
  getLocationMetadata(req, res) {
    res.json(locations);
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
        res.json(value)
      } else {
        res.statusMessage = 'Error with cache: ' + err;
        res.status(500).send(err.stack);
      }
    });
  }
}
export default new Controller();

/**
 * Function to respond to request by returning the fountain as defined by the provided identifier
 */
function byId(req, res, dbg){
  let cityS = req.query.city;
  try{
      l.info('byId '+cityS+' '+dbg);
      let cty = cityCache.get(cityS);
      if (null== cty) {
        l.info('byId '+cityS+' not found in cache '+dbg+' - start city lazy load');
        generateLocationData();
        cty = cityCache.get(cityS);
      }
      let fountain = _.find(
       cty.features,
        f=>{
          if (null== f) {
             l.info('byId fountain of '+cityS+' not found in cache '+dbg);
          }
          return f.properties['id_'+req.query.database].value === req.query.idval
        });
      res.json(fountain)
  }catch (e) {
    l.error(`byId: Error finding fountain in preprocessed data: ${e} `+cityS+ ' '+dbg);
  }
  
}


/**
 * Function to reprocess data near provided coordinates and update cache with fountain. 
 * The req.query object should have the following properties:
 * - lat: latitude of search location
 * - lng: longitude of search location
 * - radius: radius in which to search for fountains
 */
function reprocessFountainAtCoords(req, res, dbg) {
  
  l.info(`reprocessFountainAtCoords: all fountains near lat:${req.query.lat}, lon: ${req.query.lng}, radius: ${req.query.radius} `+dbg);
  
  // OSM promise
  let osmPromise = OsmService
    // Get data from OSM within given radius
    .byCenter(req.query.lat, req.query.lng, req.query.radius)
    // Process OSM data to apply implied properties
    .then(r => applyImpliedPropertiesOsm(r))
    .catch(e=>{
      l.error(`Error collecting OSM data: ${JSON.stringify(e)}`);
      res.status(500).send(e.stack);
    });
  
  let wikidataPromise = WikidataService
    // Fetch all wikidata items within radius
    .idsByCenter(req.query.lat, req.query.lng, req.query.radius)
    // Fetch detailed information for fountains based on wikidata ids
    .then(r=>WikidataService.byIds(r))
    .catch(e=>{
      l.error(`Error collecting Wikidata data: ${e}`);
      res.status(500).send(e.stack);
    });
  
  // When both OSM and Wikidata data have been collected, continue with joint processing
  Promise.all([osmPromise, wikidataPromise])

    // Get any missing wikidata fountains for #212 (fountains not fetched from Wikidata because not listed as fountains, but referenced by fountains of OSM)
    .then(r=>fillInMissingWikidataFountains(r[0], r[1]))

    // Conflate osm and wikidata fountains together
    .then(r => conflate({
      osm: r.osm,
      wikidata: r.wikidata
    },dbg))

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
      res.json(closest);
  })
    .catch(e=>{
      l.error(`Error collecting data: ${e}`);
      res.status(500).send(e.stack);
    });
}
