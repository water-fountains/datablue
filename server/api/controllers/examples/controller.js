import OsmService from '../../services/osm.service';
import * as loc from '../../../../config/locations';
import WikidataService from '../../services/wikidata.service';
import translateOsm from '../../services/translate.osm.service';
import translateWikidata from '../../services/translate.wikidata.service';
import l from '../../../common/logger'
import applyImpliedPropertiesOsm from "../../services/applyImplied.service";
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "../../services/constants";
import {combineData, conflate} from "../../services/conflate.data.service";
import {fillWikimediaImageGallery, getMainImage} from "../../services/processing.service";

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
      .then(r => fillWikimediaImageGallery(r))
      .then(r => getMainImage(r))
      // return the first fountain in the list
      .then(r => res.json(r[0]))
      .catch(error => {
        l.error(error);
      })
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
        .idsByBoundingBox(bbox.latMin, bbox.lngMin, bbox.latMax, bbox.lngMax)
        .then(r=>WikidataService.byIds(r))
        .then(r => translateWikidata(r));
      
      // conflate
      Promise.all([osmPromise, wikidataPromise])
        .then(r => conflate(r))
        .then(r => fillWikimediaImageGallery(r))
        .then(r => getMainImage(r))
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
