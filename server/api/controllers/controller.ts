/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import { locationsCollection } from '../../../config/locations';
import { fountain_property_metadata } from '../../../config/fountain.properties';

import sharedConstants from './../../common/shared-constants';
import { Request, Response } from 'express';
import { getSingleBooleanQueryParam, getSingleStringQueryParam } from './utils';
import { BoundingBox, isDatabase, parseLngLat } from '../../common/typealias';
import {
  getFountainFromCacheIfNotForceRefreshOrFetch,
  getByBoundingBoxFromCacheIfNotForceRefreshOrPopulate,
  populateCacheWithCities as populateLocationCacheWithCities,
  getProcessingErrorsByBoundingBox,
} from '../services/generateLocationData.service';
import { illegalState } from '../../common/illegalState';
import { tileToLocationCacheKey } from '../services/locationCache';

export class Controller {
  constructor() {
    // In production mode, process all fountains of pre-defnied cities when starting the server
    // so that the data is ready for the first requests
    if (process.env.NODE_ENV === 'production') {
      populateLocationCacheWithCities().catch((e: any) => {
        l.error('unexpected error occured during populateLocationCacheWithCities\n' + e.stack);
      });
    }
  }

  // Function to return detailed fountain information
  // When requesting detailed information for a single fountain, there are two types of queries
  async getSingle(req: Request, res: Response, next: ErrorHandler): Promise<void> {
    handlingErrors(next, () => {
      const queryType = getSingleStringQueryParam(req, 'queryType');
      const refresh = getSingleBooleanQueryParam(req, 'refresh', /* isOptional = */ true) ?? false;

      if (queryType === 'byId') {
        l.info(`controller.js getSingle byId: refresh: ${refresh}`);
        return this.byId(req, res, refresh);
      } else {
        illegalState('queryType only byId supported');
      }
    });
  }
  private async byId(req: Request, res: Response, forceRefresh: boolean): Promise<void> {
    const loc = parseLngLat(getSingleStringQueryParam(req, 'loc'));
    const database = getSingleStringQueryParam(req, 'database');
    if (!isDatabase(database)) {
      illegalState('unsupported database given: ' + database);
    }
    const idval = getSingleStringQueryParam(req, 'idval');

    const fountain = await getFountainFromCacheIfNotForceRefreshOrFetch(forceRefresh, database, idval, loc);
    sendJson(res, fountain, 'byId');
  }

  async getByBounds(req: Request, res: Response, next: ErrorHandler): Promise<void> {
    handlingErrors(next, () => {
      const boundingBox = this.getBoundingBoxFromQueryParam(req);
      const essential = getSingleBooleanQueryParam(req, 'essential');
      const refresh = getSingleBooleanQueryParam(req, 'refresh');

      return this.byBoundingBox(res, boundingBox, essential, refresh);
    });
  }

  private getBoundingBoxFromQueryParam(req: Request): BoundingBox {
    const southWest = parseLngLat(getSingleStringQueryParam(req, 'sw'));
    const northEast = parseLngLat(getSingleStringQueryParam(req, 'ne'));
    const boundingBox = BoundingBox(southWest, northEast);
    return boundingBox;
  }

  private async byBoundingBox(
    res: Response,
    boundingBox: BoundingBox,
    essential: boolean,
    forceRefresh: boolean
  ): Promise<void> {
    const collection = await getByBoundingBoxFromCacheIfNotForceRefreshOrPopulate(
      forceRefresh,
      boundingBox,
      essential,
      'byBounds',
      /* debugAll = */ false
    );
    sendJson(res, collection, 'fountainCollection');
  }
  /**
   *  Function to return metadata regarding all the fountain properties that can be displayed.
   * (e.g. name translations, definitions, contribution information and tips)
   * it simply returns the object created by fountain.properties.js
   */
  getPropertyMetadata(_req: Request, res: Response): void {
    sendJson(res, fountain_property_metadata, 'getPropertyMetadata'); //res.json(fountain_property_metadata);
    l.info('controller.js: getPropertyMetadata sent');
  }

  /**
   * Function to return metadata about locations supported by application
   */
  getLocationMetadata(_req: Request, res: Response): void {
    // let gak = locations.gak;
    sendJson(res, locationsCollection, 'getLocationMetadata'); //res.json(locations);
    l.info('controller.js: getLocationMetadata sent');
  }

  getSharedConstants(_req: Request, res: Response): void {
    sendJson(res, sharedConstants, 'getSharedConstants'); //res.json(locations);
    l.info('controller.js: getSharedConstants sent');
  }

  /**
   * Function to extract processing errors from detailed list of fountains
   */
  getProcessingErrors(req: Request, res: Response): void {
    // returns all processing errors for a given location made for #206
    const boundingBox = this.getBoundingBoxFromQueryParam(req);
    const errors = getProcessingErrorsByBoundingBox(boundingBox);
    sendJson(res, errors ?? [], tileToLocationCacheKey(boundingBox));
  }
}
export const controller = new Controller();

function sendJson(resp: Response, obj: Record<string, any> | undefined, dbg: string): void {
  //TODO consider using https://github.com/timberio/timber-js/issues/69 or rather https://github.com/davidmarkclements/fast-safe-stringify
  try {
    if (obj === undefined) {
      l.error('controller.js doJson null == obj: ' + dbg);
      resp.status(404).send();
    } else {
      resp.json(obj);
      //TODO @ralfhauser, neihter res.finish nor res.close exist, logging the json would need to be done before hand
      // let res = resp.json(obj);
      // if(process.env.NODE_ENV !== 'production') {
      //   // https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_class_http_serverresponse Event finish
      //   res.finish = res.close = function (event) {
      //     //not working  :(  https://github.com/water-fountains/datablue/issues/40
      //     //https://github.com/expressjs/express/issues/4158 https://github.com/expressjs/express/blob/5.0/lib/response.js
      //     l.info('controller.js doJson length: keys '+Object.keys(obj).length+
      //           //'\n responseData.data.length '+resp.responseData.data.length+
      //           ' -  '+dbg);
      //   }
      // }
    }
  } catch (err: unknown) {
    const errS = 'controller.js doJson errors: "' + err + '" ' + dbg;
    l.error(errS);
    console.trace(errS);
  }
}

// TODO should no longer be necessary starting with Express 5.x
function handlingErrors<T>(next: ErrorHandler, action: () => Promise<T>) {
  action().catch(next);
}

type ErrorHandler = (error: unknown) => unknown;
