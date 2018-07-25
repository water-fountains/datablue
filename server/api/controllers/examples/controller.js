import OsmService from '../../services/osm.service';
import * as loc from '../../../../config/locations';
import WikidataService from '../../services/wikidata.service';
import translateOsm from '../../services/translate.osm.service';
import translateWikidata from '../../services/translate.wikidata.service';
import l from '../../../common/logger'
import applyImpliedPropertiesOsm from "../../services/applyImplied.service";
const NodeCache = require( "node-cache" );
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "../../services/constants";
import {combineData, conflate} from "../../services/conflate.data.service";
import {fillImageGalleries} from "../../services/processing.service";

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
  
  byCoords(req, res) {
    
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
      // return the first fountain in the list
      .then(r => res.json(r[0]))
      // todo: update whole dataset
      .catch(error => {
        l.error(error);
      })
  }
  
  byLocation(req, res){
    // if an update is requested or if no data is in storage, then regenerate the data
    if(req.query.refresh || cityCache.keys().indexOf(req.query.city) === -1){
      generateLocationData(req.query.city)
        .then(r => {
        // save new data to storage
        cityCache.set(req.query.city, r, 60*60*2);
        res.json(r);
      })
        .catch(error =>{
          l.error(`unable to set Cache. Error: ${error}`)
        })
    }
    // otherwise, get the data from storage
    else{
      res.json(cityCache.get(req.query.city));
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
      .then(r => fillImageGalleries(r))
      .then(r => resolve(r))
      .catch(error => {
        l.error(`Error conflating or processing data: ${error}`);
        reject(error);
      })
    
  });
}