/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import OsmService from '../services/osm.service';
import WikidataService from '../services/wikidata.service';
import l from '../../common/logger'
import applyImpliedPropertiesOsm from "../services/applyImplied.service";
import {locations} from '../../../config/locations';
import {fountain_property_metadata} from "../../../config/fountain.properties";

const NodeCache = require( "node-cache" );
import {conflate} from "../services/conflate.data.service";
import {
  createUniqueIds, essenceOf, defaultCollectionEnhancement
} from "../services/processing.service";
import {updateCacheWithFountain} from "../services/database.service";
const haversine = require("haversine");
const _ = require('lodash');

const cityCache = new NodeCache( {
  stdTTL: 60*60*2, // time til expire in seconds
  checkperiod: 30, // how often to check for expire in seconds
  deleteOnExpire: false, // on expire, we want the cache to be recreated.
  useClones: false // do not create a clone of the data when fetching
} );

// when cache expires, regenerate it (ignore non-essential)
cityCache.on('expired', (key, value)=>{
  if(!key.includes('_essential')){
    generateLocationData(key)
      .then(r=>{
        // save new data to storage
        cityCache.set(key, r, 60*60*2);
      }).catch(error =>{
      l.error(`unable to set Cache. Error: ${error}`)
    })
  }
});

export class Controller {
  constructor(){
    // generate location data and save to storage
    // todo: uncomment when data derivation has been moved to front-end
    // for (let location of Object.keys(locations)){
    //   l.info(`Generating data for ${location}`);
    //   generateLocationData(location)
    //     .then(r => {
    //       // save new data to storage
    //       cityCache.set(location, r, 60 * 60 * 2);
    //       // create a reduced version of the data as well
    //       let r_essential = essenceOf(r);
    //       cityCache.set(location + '_essential', r_essential, 60 * 60 * 2);
    //     })
    // }
  }
  
  getSingle(req, res){
    if(req.query.queryType === 'byCoords'){
      byCoords(req, res)
    }else{
      byId(req, res)
    }
  }
  
  byLocation(req, res){
    // if an update is requested or if no data is in storage, then regenerate the data
    if(req.query.refresh || cityCache.keys().indexOf(req.query.city) === -1){
      generateLocationData(req.query.city)
        .then(r => {
        // save new data to storage
        cityCache.set(req.query.city, r, 60*60*2);
        // create a reduced version of the data as well
        let r_essential = essenceOf(r);
        cityCache.set(req.query.city + '_essential', r_essential, 60*60*2);
        if(req.query.essential){
          res.json(r_essential);
        }else{
          res.json(r);
        }
      })
        .catch(error =>{
          l.error(`Error: ${error}`);
          // res.status(500);
          res.sendStatus(500);
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
  
  getPropertyMetadata(req, res) {
    res.json(fountain_property_metadata);
  }
  
  getLocationMetadata(req, res) {
    res.json(locations);
  }
}
export default new Controller();

function generateLocationData(locationName){
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
        l.error(`Error collecting OSM data: ${e}`);
        reject(e);
      });
    
    // get data from Wikidata
    let wikidataPromise = WikidataService
      .idsByBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
      .then(r=>WikidataService.byIds(r))
      .catch(e=>{
        l.error(`Error collecting wikidata data: ${e}`);
        reject(e);
      });
    
    // conflate
    Promise.all([osmPromise, wikidataPromise])
      .then(r => conflate({
        osm: r[0],
        wikidata: r[1]
      }))
      .then(r => defaultCollectionEnhancement(r))
      .then(r => createUniqueIds(r))
      .then(r => resolve(
        {
          type: 'FeatureCollection',
          features: r
        }
      ))
      .catch(error => {
        l.error(`Error conflating or processing data: ${error}`);
        reject(error);
      })
    
  });
}

function byId(req, res){
  let fountain = _.find(
    cityCache.get(req.query.city).features,
    f=>{
      return f.properties['id_'+req.query.database].value === req.query.idval
    });
  res.json(fountain)
}

function byCoords(req, res) {
  
  // OSM promise
  let osmPromise = OsmService
    .byCenter(req.query.lat, req.query.lng, req.query.radius)
    .then(r => applyImpliedPropertiesOsm(r))
    .catch(e=>{
      l.error(`Error collecting OSM data: ${e}`);
      res.sendStatus(500);
    });
  
  let wikidataPromise = WikidataService
    .idsByCenter(req.query.lat, req.query.lng, req.query.radius)
    .then(r=>WikidataService.byIds(r))
    .catch(e=>{
      l.error(`Error collecting Wikidata data: ${e}`);
      res.sendStatus(500);
    });
  
  // conflate
  Promise.all([osmPromise, wikidataPromise])
    .then(r => conflate({
      osm: r[0],
      wikidata: r[1]
    }))
    .then(r => defaultCollectionEnhancement(r))
    // return the closest fountain in the list
    .then(r => {
      let distances = _.map(r, f=>{
        return haversine(
          f.geometry.coordinates, [req.query.lng, req.query.lat], {
            unit: 'meter',
            format: '[lon,lat]'
          });
      });
      let closest = r[_.indexOf(distances, _.min(distances))];
      closest = updateCacheWithFountain(cityCache, closest, req.query.city);
      res.json(closest);
    })
    .catch(e=>{
      l.error(`Error collecting data: ${e}`);
      res.sendStatus(500);
    });
}
