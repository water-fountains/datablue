import OsmService from '../../services/osm.service';
import * as loc from '../../../../config/locations';
import WikidataService from '../../services/wikidata.service';
import translateOsm from '../../services/translate.osm.service';
import translateWikidata from '../../services/translate.wikidata.service';
import l from '../../../common/logger'
import applyImpliedPropertiesOsm from "../../services/applyImplied.service";

const distance = require('@turf/distance');
const NodeCache = require( "node-cache" );
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "../../services/constants";
import {combineData, conflate} from "../../services/conflate.data.service";
import {createUniqueIds, essenceOf, fillImageGalleries, fillOutNames} from "../../services/processing.service";

const _ = require('lodash');

const cityCache = new NodeCache( {
  stdTTL: 60*60*2, // time til expire in seconds
  checkperiod: 30, // how often to check for expire in seconds
  deleteOnExpire: false // on expire, we want the cache to be recreated.
} );

// when cache expires, regenerate it
cityCache.on('expired', (key, value)=>{
  generateLocationData(key)
    .then(r=>{
      // save new data to storage
      cityCache.set(key, r, 60*60*2);
    }).catch(error =>{
    l.error(`unable to set Cache. Error: ${error}`)
  })
});

export class Controller {
  
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
          l.error(`unable to set Cache. Error: ${error}`)
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
}
export default new Controller();

function generateLocationData(locationName){
  return new Promise((resolve, reject)=>{
    // get bounding box of location
    let bbox = loc.locations[locationName].bounding_box;
    // get data from Osm
    let osmPromise = OsmService
      .byBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
      .then(r => applyImpliedPropertiesOsm(r))
      .then(r => translateOsm(r))
      .catch(e=>{
        l.error(`Error collecting OSM data: ${e}`);
        reject(e);
      });
    
    // get data from Wikidata
    let wikidataPromise = WikidataService
      .idsByBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
      .then(r=>WikidataService.byIds(r))
      .then(r => translateWikidata(r))
      .catch(e=>{
        l.error(`Error collecting wikidata data: ${e}`);
        reject(e);
      });
    
    // conflate
    Promise.all([osmPromise, wikidataPromise])
      .then(r => conflate(r))
      .then(r => fillOutNames(r))
      .then(r => fillImageGalleries(r))
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
    cityCache.get('zurich').features,
    f=>{
      return f.properties['id_'+req.query.database].value == req.query.idval
    });
  res.json(fountain)
}

function byCoords(req, res) {
  
  // OSM promise
  let osmPromise = OsmService
    .byCenter(req.query.lat, req.query.lng, req.query.radius)
    .then(r => applyImpliedPropertiesOsm(r))
    .then(r => translateOsm(r));
  
  let wikidataPromise = WikidataService
    .idsByCenter(req.query.lat, req.query.lng, req.query.radius)
    .then(r=>WikidataService.byIds(r))
    .then(r => translateWikidata(r));
  
  // conflate
  Promise.all([osmPromise, wikidataPromise])
    .then(r => conflate(r))
    .then(r => fillImageGalleries(r))
    .then(r => fillOutNames(r))
    // return the first fountain in the list
    .then(r => {
      let distances = _.map(r, f=>{
        return distance.default(f.geometry.coordinates, [req.query.lng, req.query.lat])
      });
      res.json(r[_.indexOf(distances, _.min(distances))])
    })
    // todo: update whole dataset with the refreshed data
    .catch(error => {
      l.error(error);
    })
}