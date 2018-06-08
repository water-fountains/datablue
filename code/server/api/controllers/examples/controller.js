import ExamplesService from '../../services/examples.service';
import DataService from '../../services/data.service'
import WikidataService from '../../services/wikidata.service'
import translateOsm from '../../services/translate.service';
import l from '../../../common/logger'
import applyImpliedPropertiesOsm from "../../services/applyImplied.service";
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "../../services/constants";

export class Controller {
  byCoords(req, res) {
    DataService
      .byCoords(req.query.lat, req.query.lng)
      .then(r => applyImpliedPropertiesOsm(r))
      .then(r => translateOsm(r))
      .then(function (r) {
        // if('id_wikidata' in r.properties){
        //   // fetch relevant information from wikidata based on wikidata ID
        //     WikidataService.byId(r.properties.id_wikidata)
        //         // .then(r => translateWikidata(r))
        // }else{
        //   // otherwise, try to discover the fountain in wikidata based on coordinates
        // }
          // todo: figure how to merge two streams of data from promises
        return new Promise(function(resolve, reject){ resolve(r)})
      })
      .then(r => res.json(r))
      .catch(error => {
        switch (error.message){
          case NO_FOUNTAIN_AT_LOCATION:
            res.status(204);
          case FUNCTION_NOT_AVAILABLE:
            res.send({});
        }})
  }
  
  all(req, res) {
    ExamplesService.all()
      .then(r => res.json(r));
  }

  byId(req, res) {
    ExamplesService
      .byId(req.params.id)
      .then(r => {
        if (r) res.json(r);
        else res.status(404).end();
      });
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
