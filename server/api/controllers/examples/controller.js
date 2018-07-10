import OsmService from '../../services/osm.service';
import * as loc from '../../../../config/locations';
import WikidataService from '../../services/wikidata.service';
import translateOsm from '../../services/translate.osm.service';
import translateWikidata from '../../services/translate.wikidata.service';
import l from '../../../common/logger'
import applyImpliedPropertiesOsm from "../../services/applyImplied.service";
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "../../services/constants";
import {combineData, conflate} from "../../services/conflate.data.service";

export class Controller {
  byCoords(req, res) {
    OsmService
      .byCenter(req.query.lat, req.query.lng)
      .then(r => applyImpliedPropertiesOsm(r))
      .then(r => translateOsm(r))
      .then(function (r) {
        let osmPromise = new Promise((resolve, reject) => {
          resolve(r[0])
        });
        let wdPromise;
        if ('id_wikidata' in r[0]) {
          // fetch relevant information from wikidata based on wikidata ID
          wdPromise = WikidataService.byIds([r[0].id_wikidata.value])
            // translate wikidata values
            .then(r => translateWikidata(r))
          // from all fountain data, just return the first (and only) fountain.
        .then(r => new Promise((resolve, reject) =>{resolve(r[0])}));
        } else {
          // otherwise, try to discover the fountain in wikidata based on coordinates
          wdPromise = new Promise((resolve, reject) => {
            resolve({pano_url: undefined})
          });
        }
        return Promise.all([wdPromise, osmPromise])
          .then(r => combineData(r));
      })
      .then(r => res.json(r))
      .catch(error => {
        l.info(error);
        switch (error.message) {
          case NO_FOUNTAIN_AT_LOCATION:
            res.status(204);
          case FUNCTION_NOT_AVAILABLE:
            res.send({});
          default:
            res.status(500);
        }
      });
  }
  
  byLocation(req, res){
    // if an update is requested or if no data is in storage, then regenerate the data
    // if(true){
      // get bounding box of location
      let bbox = loc.locations[req.query.city].bounding_box;
      
      // get data from Osm
      let osmPromise = OsmService
        .byBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
        .then(r => applyImpliedPropertiesOsm(r))
        .then(r => translateOsm(r));
      
      // get data from Wikidata
      let wikidataPromise = WikidataService
        .IdsByBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
        .then(r=>WikidataService.byIds(r))
        .then(r => translateWikidata(r));
      
      // conflate
      Promise.all([osmPromise, wikidataPromise])
        .then(r => conflate(r))
        .then(r => res.json(r))
        .catch(error => {
          l.error(error);
         })
      
      // todo: save new data to storage
      
    // }
    // todo: otherwise, get the data from storage
    // else{
    //
    // }
    
  }
}
export default new Controller();
