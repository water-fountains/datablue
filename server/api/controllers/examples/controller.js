import ExamplesService from '../../services/examples.service';
import DataService from '../../services/data.service'
import WikidataService from '../../services/wikidata.service'
import translateOsm from '../../services/translate.osm.service';
import translateWikidata from '../../services/translate.wikidata.service';
import l from '../../../common/logger'
import applyImpliedPropertiesOsm from "../../services/applyImplied.service";
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "../../services/constants";
import combineData from "../../services/combine.data.service";

export class Controller {
  byCoords(req, res) {
    DataService
      .byCoords(req.query.lat, req.query.lng)
      .then(r => applyImpliedPropertiesOsm(r))
      .then(r => translateOsm(r))
      .then(function (r) {
        let osmPromise = new Promise((resolve, reject) => {resolve(r)});
        let wdPromise;
        if('id_wikidata' in r.properties){
          // fetch relevant information from wikidata based on wikidata ID
          wdPromise = WikidataService.byId(r.properties.id_wikidata)
              .then(r => translateWikidata(r));
        }else{
          // otherwise, try to discover the fountain in wikidata based on coordinates
          wdPromise = new Promise((resolve, reject) => {resolve({pano_url:undefined})});
        }
        return Promise.all([wdPromise, osmPromise])
          .then(r => combineData(r));
      })
      .then(r => res.json(r))
      .catch(error => {
        l.info(error);
        switch (error.message){
          case NO_FOUNTAIN_AT_LOCATION:
            res.status(204);
          case FUNCTION_NOT_AVAILABLE:
            res.send({});
          default:
            res.status(500);
        }})
  }

  create(req, res) {
    ExamplesService
      .create(req.body.name)
      .then(r => res
        .status(201)
        .location(`/api/v1/examples/${r.id}`)
        .json(r));
  }
}
export default new Controller();
