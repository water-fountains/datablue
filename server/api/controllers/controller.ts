/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import OsmService from '../services/osm.service';
import WikidataService from '../services/wikidata.service';
import l from '../../common/logger';
import generateLocationData from '../services/generateLocationData.service';
import { locations } from '../../../config/locations';
import { fountain_property_metadata } from '../../../config/fountain.properties';
import NodeCache from 'node-cache';
import { conflate } from '../services/conflate.data.service';
import applyImpliedPropertiesOsm from '../services/applyImplied.service';
import {
  essenceOf,
  defaultCollectionEnhancement,
  fillInMissingWikidataFountains,
  fillWikipediaSummary,
} from '../services/processing.service';
import { updateCacheWithFountain } from '../services/database.service';
import { extractProcessingErrors } from './processing-errors.controller';
import { getImageInfo, getImgsOfCat } from '../services/wikimedia.service';
import { getCatExtract, getImgClaims } from '../services/claims.wm';
import { isBlacklisted } from '../services/categories.wm';
import haversine from 'haversine';
import _ from 'lodash';
import {
  MAX_IMG_SHOWN_IN_GALLERY,
  LAZY_ARTIST_NAME_LOADING_i41db, //,CACHE_FOR_HRS_i45db
} from '../../common/constants';
import sharedConstants from './../../common/shared-constants';
import { Request, Response } from 'express';
import { getSingleBooleanQueryParam, getSingleNumberQueryParam, getSingleStringQueryParam } from './utils';
import { Fountain, FountainCollection, GalleryValue } from '../../common/typealias';
import { hasWikiCommonsCategories } from '../../common/wikimedia-types';
import { ImageLike } from '../../../config/text2img';

// Configuration of Cache after https://www.npmjs.com/package/node-cache
const cityCache = new NodeCache({
  stdTTL: 60 * 60 * sharedConstants.CACHE_FOR_HRS_i45db, // time till cache expires, in seconds
  checkperiod: 600, // how often to check for expiration, in seconds - default: 600
  deleteOnExpire: false, // on expire, we want the cache to be recreated not deleted
  useClones: false, // do not create a clone of the data when fetching from cache
});

/*
 * For each location (city), three JSON objects are created. Example for Zurich:
 * - "ch-zh": contains the full data for all fountains of the location
 * - "ch-zh_essential": contains a summary version of "ch-zh". This is the data loaded for display on the map. It is derived from "ch-zh".
 * - "ch-zh_errors": contains a list of errors encountered when processing "ch-zh".
 */

// when cached data expires, regenerate it (ignore non-essential)
cityCache.on('expired', key => {
  // check if cache item key is neither the summary nor the list of errors. These will be updated automatically when the detailed city data are updated.
  if (!key.includes('_essential') && !key.includes('_errors')) {
    l.info(`controller.js cityCache.on('expired',...): Automatic cache refresh of ${key}`);
    generateLocationDataAndCache(key, cityCache);
  }
});

export class Controller {
  constructor() {
    // In production mode, process all fountains when starting the server so that the data are ready for the first requests
    if (process.env.NODE_ENV === 'production') {
      Object.keys(locations).forEach(locationCode => {
        l.info(`controller.js Generating data for ${locationCode}`);
        generateLocationData(locationCode).then(fountainCollection => {
          // save new data to storage
          //TODO @ralfhauser, the old comment states  // expire after two hours but CACHE_FOR_HRS_i45db is currently 48, which means after two days
          cityCache.set<FountainCollection>(
            locationCode,
            fountainCollection,
            60 * 60 * sharedConstants.CACHE_FOR_HRS_i45db
          );
          // create a reduced version of the data as well
          cityCache.set<FountainCollection>(locationCode + '_essential', essenceOf(fountainCollection));
          // also create list of processing errors (for proximap#206)
          cityCache.set<any[]>(locationCode + '_errors', extractProcessingErrors(fountainCollection));
        });
      });
    }
  }

  // Function to return detailed fountain information
  // When requesting detailed information for a single fountain, there are two types of queries
  getSingle(req: Request, res: Response): void {
    // const start = new Date();
    // let what: string;
    const queryType = getSingleStringQueryParam(req, 'queryType');
    const refresh = getSingleBooleanQueryParam(req, 'refresh', /* isOptional = */ true);

    if (queryType === 'byCoords') {
      const city = getSingleStringQueryParam(req, 'city');
      l.info(`controller.js getSingle byCoords: refresh: ${refresh} , city: ` + city);

      // byCoords will return the nearest fountain to the given coordinates.
      // The databases are queried and fountains are reprocessed for this
      reprocessFountainAtCoords(req, res, city);
      // what = 'reprocessFountainAtCoords';
    } else if (queryType === 'byId') {
      l.info(`controller.js getSingle by: refresh: ${refresh}`);
      // byId will look into the fountain cache and return the fountain with the given identifier
      byId(req, res, req.query.idval?.toString() ?? '');
      // what = 'byId';
    } else {
      res.status(400).send('only byCoords and byId supported');
    }
    // const end = new Date();
    // const elapse = (end - start)/1000;
    //l.info('controller.js getSingle: '+what+' finished after '+elapse.toFixed(1)+' secs');
  }

  // Function to return all fountain information for a location.
  byLocation(req: Request, res: Response): void {
    const start = new Date();
    const city = getSingleStringQueryParam(req, 'city');
    const refresh = getSingleBooleanQueryParam(req, 'refresh', /* isOptional = */ true);

    // if a refresh is requested or if no data is in the cache, then reprocessess the fountains
    if (refresh || cityCache.keys().indexOf(city) === -1) {
      l.info(`controller.js byLocation: refresh: ${refresh} , city: ` + city);
      generateLocationData(city)
        .then(fountainCollection => {
          // save new data to storage
          cityCache.set<FountainCollection>(city, fountainCollection, 60 * 60 * sharedConstants.CACHE_FOR_HRS_i45db);

          // create a reduced version of the data as well
          const r_essential = essenceOf(fountainCollection);
          cityCache.set<FountainCollection>(city + '_essential', r_essential);

          // return either the full or reduced version, depending on the "essential" parameter of the query
          const essential = getSingleBooleanQueryParam(req, 'essential', /* isOptional = */ true) ?? false;
          if (essential) {
            sendJson(res, r_essential, 'r_essential');
          } else {
            sendJson(res, fountainCollection, 'fountainCollection');
          }

          // also create list of processing errors (for proximap#206)
          cityCache.set<any[]>(city + '_errors', extractProcessingErrors(fountainCollection));
          const end = new Date();
          const elapse = (end.getTime() - start.getTime()) / 1000;
          l.info('controller.js byLocation generateLocationData: finished after ' + elapse.toFixed(1) + ' secs');
        })
        .catch(error => {
          if (error.message) {
            res.statusMessage = error.message;
          }
          res.status(500).send(error.stack);
        });
    }
    // otherwise, get the data from storage
    else {
      const essential = getSingleBooleanQueryParam(req, 'essential', /* isOptional = */ true) ?? false;
      if (essential) {
        sendJson(res, cityCache.get<FountainCollection>(city + '_essential'), 'fromCache essential');
      } else {
        sendJson(res, cityCache.get<FountainCollection>(city), 'fromCache');
      }
      const end = new Date();
      const elapse = (end.getTime() - start.getTime()) / 1000;
      l.info('controller.js byLocation: finished after ' + elapse.toFixed(1) + ' secs');
    }
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
    sendJson(res, locations, 'getLocationMetadata'); //res.json(locations);
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
    // returns all processing errors for a given location
    // made for #206
    const city = getSingleStringQueryParam(req, 'city');
    const key = city + '_errors';

    if (cityCache.keys().indexOf(key) < 0) {
      // if data not in cache, create error list
      cityCache.set<any[]>(key, extractProcessingErrors(cityCache.get<FountainCollection>(city)));
    }
    cityCache.get<FountainCollection>(key, (err, value) => {
      if (!err) {
        sendJson(res, value, 'cityCache.get ' + key);
        l.info('controller.js: getProcessingErrors !err sent');
      } else {
        const errMsg = 'Error with cache: ' + err;
        l.info('controller.js: getProcessingErrors ' + errMsg);
        res.statusMessage = errMsg;
        res.status(500).send(err.stack);
      }
    });
  }
}
export const controller = new Controller();

function sendJson(resp: Response, obj: Record<string, any> | undefined, dbg: string): void {
  //TODO consider using https://github.com/timberio/timber-js/issues/69 or rather https://github.com/davidmarkclements/fast-safe-stringify
  try {
    if (obj == undefined) {
      l.error('controller.js doJson null == obj: ' + dbg);
    }
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
  } catch (err: unknown) {
    const errS = 'controller.js doJson errors: "' + err + '" ' + dbg;
    l.error(errS);
    console.trace(errS);
  }
}

//TODO @ralfhauser, this function is too long and one does not have a good overview any more. Consider splitting it up into several functions
/**
 * Function to respond to request by returning the fountain as defined by the provided identifier
 */
function byId(req: Request, res: Response, dbg: string): Promise<Fountain | undefined> {
  const city = getSingleStringQueryParam(req, 'city');
  let name = 'unkNamById';
  //  l.info('controller.js byId: '+cityS+' '+dbg);
  let fountainCollection = cityCache.get<FountainCollection>(city);

  //	  l.info('controller.js byId in promise: '+cityS+' '+dbg);
  const cityPromises: Promise<FountainCollection | void>[] = [];
  if (fountainCollection === undefined) {
    l.info('controller.js byId: ' + city + ' not found in cache ' + dbg + ' - start city lazy load');
    const genLocPrms = generateLocationDataAndCache(city, cityCache);
    cityPromises.push(genLocPrms);
  }
  return Promise.all(cityPromises)
    .then(
      () => {
        if (fountainCollection === undefined) {
          fountainCollection = cityCache.get<FountainCollection>(city);
        }
        if (fountainCollection !== undefined) {
          const fountain = fountainCollection.features.find(
            f => f.properties['id_' + req.query.database]?.value === req.query.idval
          );
          const imgMetaPromises: Promise<any>[] = [];
          let lazyAdded = 0;
          const gl = -1;
          if (fountain === undefined) {
            l.info('controller.js byId: of ' + city + ' not found in cache ' + dbg);
            return undefined;
          } else {
            const props = fountain.properties;
            //    	  l.info('controller.js byId fountain: '+cityS+' '+dbg);
            if (null != props) {
              name = props.name.value;
              if (LAZY_ARTIST_NAME_LOADING_i41db) {
                imgMetaPromises.push(WikidataService.fillArtistName(fountain, dbg));
              }
              imgMetaPromises.push(WikidataService.fillOperatorInfo(fountain, dbg));
              fillWikipediaSummary(fountain, dbg, 1, imgMetaPromises);
              const gallery = props.gallery;
              //  		  l.info('controller.js byId props: '+cityS+' '+dbg);
              if (null != gallery && null != gallery.value) {
                //  			  l.info('controller.js byId gl: '+cityS+' '+dbg);
                if (0 < gallery.value.length) {
                  //  				  l.info('controller.js byId: of '+cityS+' found gal of size '+gl+' "'+name+'" '+dbg);
                  let i = 0;
                  let lzAtt = '';
                  const showDetails = true;
                  const singleRefresh = true;
                  const imgUrlSet = new Set<string>();
                  const catPromises: Promise<ImageLike[]>[] = [];
                  let numberOfCategories = -1;
                  let numberOfCategoriesLazyAdded = 0;
                  const imgUrlsLazyByCategory: ImageLike[] = [];
                  // TODO @ralfhauser, this condition does not make sense, if value.length < 0 means basically if it is empty and if it is empty, then numberOfCategories will always be 0 and the for-loop will do nothing
                  if (hasWikiCommonsCategories(props) && 0 < props.wiki_commons_name.value.length) {
                    numberOfCategories = props.wiki_commons_name.value.length;
                    let j = 0;
                    for (const cat of props.wiki_commons_name.value) {
                      j++;
                      if (null == cat) {
                        l.info(i + '-' + j + ' controller.js: null == commons category "' + cat + '" "' + dbg);
                        continue;
                      }
                      if (null == cat.c) {
                        l.info(i + '-' + j + ' controller.js: null == commons cat.c "' + cat + '" "' + dbg);
                        continue;
                      }
                      if (isBlacklisted(cat.c)) {
                        l.info(i + '-' + j + ' controller.js: commons category blacklisted  "' + cat + '" "' + dbg);
                        continue;
                      }
                      const add = 0 > cat.l;
                      if (add) {
                        numberOfCategoriesLazyAdded++;
                        if (0 == imgUrlSet.size) {
                          for (const img of gallery.value) {
                            imgUrlSet.add(img.pgTit);
                          }
                        }
                        const catPromise = getImgsOfCat(
                          cat,
                          dbg,
                          city,
                          imgUrlSet,
                          imgUrlsLazyByCategory,
                          'dbgIdWd',
                          props,
                          true
                        );
                        //TODO we might prioritize categories with small number of images to have greater variety of images?
                        catPromises.push(catPromise);
                      }
                      getCatExtract(singleRefresh, cat, catPromises, dbg);
                    }
                  }
                  return Promise.all(catPromises).then(
                    r => {
                      for (let k = 0; k < imgUrlsLazyByCategory.length && k < MAX_IMG_SHOWN_IN_GALLERY; k++) {
                        //between 6 && 50 imgs are on the gallery-preview
                        const img = imgUrlsLazyByCategory[k];
                        //TODO @ralfhauser, val does not exist on GalleryValue but value, changed it
                        const nImg: GalleryValue = {
                          s: img.src,
                          pgTit: img.value,
                          c: img.cat,
                          t: img.typ,
                        };
                        gallery.value.push(nImg);
                      }
                      if (0 < imgUrlsLazyByCategory.length) {
                        l.info(
                          'controller.js byId lazy img by lazy cat added: attempted ' +
                            imgUrlsLazyByCategory.length +
                            ' in ' +
                            numberOfCategoriesLazyAdded +
                            '/' +
                            numberOfCategories +
                            ' cats, tot ' +
                            gl +
                            ' of ' +
                            city +
                            ' ' +
                            dbg +
                            ' "' +
                            name +
                            '" ' +
                            r.length
                        );
                      }
                      for (const img of gallery.value) {
                        const imMetaDat = img.metadata;
                        if (null == imMetaDat && 'wm' == img.t) {
                          lzAtt += i + ',';
                          l.info(
                            'controller.js byId lazy getImageInfo: ' +
                              city +
                              ' ' +
                              i +
                              '/' +
                              gl +
                              ' "' +
                              img.pgTit +
                              '" "' +
                              name +
                              '" ' +
                              dbg
                          );
                          imgMetaPromises.push(
                            getImageInfo(
                              img,
                              i + '/' + gl + ' ' + dbg + ' ' + name + ' ' + city,
                              showDetails,
                              props
                            ).catch(giiErr => {
                              //TODO @ralfhauser, dbgIdWd does not exist
                              const dbgIdWd = undefined;
                              l.info(
                                'wikimedia.service.js: fillGallery getImageInfo failed for "' +
                                  img.pgTit +
                                  '" ' +
                                  dbg +
                                  ' ' +
                                  city +
                                  ' ' +
                                  dbgIdWd +
                                  ' "' +
                                  name +
                                  '"' +
                                  '\n' +
                                  giiErr.stack
                              );
                            })
                          );
                          lazyAdded++;
                        } else {
                          //  							  l.info('controller.js byId: of '+cityS+' found imMetaDat '+i+' in gal of size '+gl+' "'+name+'" '+dbg);
                        }
                        getImgClaims(singleRefresh, img, imgMetaPromises, i + ': ' + dbg);
                        i++;
                      }
                      if (0 < lazyAdded) {
                        l.info(
                          'controller.js byId lazy img metadata loading: attempted ' +
                            lazyAdded +
                            '/' +
                            gl +
                            ' (' +
                            lzAtt +
                            ') of ' +
                            city +
                            ' ' +
                            dbg +
                            ' "' +
                            name +
                            '"'
                        );
                      }
                      return Promise.all(imgMetaPromises).then(
                        r => {
                          if (0 < lazyAdded) {
                            l.info(
                              'controller.js byId lazy img metadata loading after promise: attempted ' +
                                lazyAdded +
                                ' tot ' +
                                gl +
                                ' of ' +
                                city +
                                ' ' +
                                dbg +
                                ' "' +
                                name +
                                '" ' +
                                r.length
                            );
                          }
                          //TODO @ralfhauser this is a clear smell, we already send the response before we resolve the promise
                          // it would be better if we return the fountain in a then once the promise completes
                          sendJson(res, fountain, 'byId ' + dbg); //  res.json(fountain);
                          l.info('controller.js byId: of ' + city + ' res.json ' + dbg + ' "' + name + '"');
                          return fountain;
                        },
                        err => {
                          l.error(
                            `controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '" ' + city
                          );
                          return undefined;
                        }
                      );
                    },
                    err => {
                      l.error(
                        `controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '" ' + city
                      );
                      return undefined;
                    }
                  );
                } else {
                  l.info('controller.js byId: of ' + city + ' gl < 1  ' + dbg);
                  return Promise.all(imgMetaPromises).then(
                    r => {
                      if (0 < lazyAdded) {
                        l.info(
                          'controller.js byId lazy img metadata loading after promise: attempted ' +
                            lazyAdded +
                            ' tot ' +
                            gl +
                            ' of ' +
                            city +
                            ' ' +
                            dbg +
                            ' "' +
                            name +
                            '" ' +
                            r.length
                        );
                      }
                      //TODO @ralfhauser this is a clear smell, we already send the response before we resovle the promise
                      sendJson(res, fountain, 'byId ' + dbg); //  res.json(fountain);
                      l.info('controller.js byId: of ' + city + ' res.json ' + dbg + ' "' + name + '"');
                      return fountain;
                    },
                    err => {
                      l.error(
                        `controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '" ' + city
                      );
                      return undefined;
                    }
                  );
                }
              } else {
                l.info('controller.js byId: of ' + city + ' gallery null || null == gal.value  ' + dbg);
                return undefined;
              }
            } else {
              l.info('controller.js byId: of ' + city + ' no props ' + dbg);
              return undefined;
            }
          }
        } else {
          return undefined;
        }
        //      l.info('controller.js byId: end of '+cityS+' '+dbg);
      },
      err => {
        l.error(`controller.js byId: Failed on genLocPrms: ${err.stack} .` + dbg + ' ' + city);
        return undefined;
      }
    )
    .catch(e => {
      //TODO @ralfhauser, this error will never occurr because we already defined an error case two lines above
      l.error(`controller.js byId: Error finding fountain in preprocessed data: ${e} , city: ` + city + ' ' + dbg);
      l.error(e.stack);
      return undefined;
    });
}

/**
 * Function to reprocess data near provided coordinates and update cache with fountain.
 * The req.query object should have the following properties:
 * - lat: latitude of search location
 * - lng: longitude of search location
 * - radius: radius in which to search for fountains
 */
function reprocessFountainAtCoords(req: Request, res: Response, dbg: string): void {
  const lat = getSingleNumberQueryParam(req, 'lat');
  const lng = getSingleNumberQueryParam(req, 'lng');
  const radius = getSingleNumberQueryParam(req, 'radius');

  l.info(
    `controller.js reprocessFountainAtCoords: all fountains near lat:${lat}, lng: ${lng}, radius: ${radius} ` + dbg
  );

  // OSM promise
  const osmPromise = OsmService
    // Get data from OSM within given radius
    .byCenter(lat, lng, radius)
    // Process OSM data to apply implied properties
    .then(r => applyImpliedPropertiesOsm(r))
    .catch(e => {
      l.error(`controller.js reprocessFountainAtCoords: Error collecting OSM data: ${JSON.stringify(e)} `);
      // TODO @ralfhauser, this is an ugly side effect, this does nost stop the program but implies return void
      // hence I changed it because we already catch errors in Promise.all
      // res.status(500).send(e.stack);
      throw e;
    });

  const wikidataPromise = WikidataService
    // Fetch all wikidata items within radius
    .idsByCenter(lat, lng, radius, dbg)
    // Fetch detailed information for fountains based on wikidata ids
    .then(r => WikidataService.byIds(r, dbg))
    .catch(e => {
      l.error(`Error collecting Wikidata data: ${e}`);
      // TODO @ralfhauser, same same as above
      // res.status(500).send(e.stack);
      throw e;
    });
  const debugAll = true;
  // When both OSM and Wikidata data have been collected, continue with joint processing
  Promise.all([osmPromise, wikidataPromise])

    // Get any missing wikidata fountains for #212 (fountains not fetched from Wikidata because not listed as fountains, but referenced by fountains of OSM)
    .then(r => fillInMissingWikidataFountains(r[0], r[1], dbg))

    // Conflate osm and wikidata fountains together
    .then(r =>
      conflate(
        {
          osm: r.osm,
          wikidata: r.wikidata,
        },
        dbg,
        debugAll
      )
    )

    // return only the fountain that is closest to the coordinates of the query
    .then(r => {
      const distances = _.map(r, f => {
        // compute distance to center for each fountain
        return haversine(f.geometry.coordinates, [lng, lat], {
          unit: 'meter',
          format: '[lon,lat]',
        });
      });
      // return closest
      const closest = r[_.indexOf(distances, _.min(distances))];
      return [closest];
    })

    // fetch more information about fountains (Artist information, gallery, etc.)
    //TOOD @ralfhauser, the last parameter for debugAll was missing undefined is falsy hence I used false
    .then(r => defaultCollectionEnhancement(r, dbg, false))

    // Update cache with newly processed fountain
    .then(r => {
      const city = getSingleStringQueryParam(req, 'city');
      const closest = updateCacheWithFountain(cityCache, r[0], city);
      sendJson(res, closest, 'after updateCacheWithFountain');
    })
    .catch(e => {
      l.error(`Error collecting data: ${e.stack}`);
      res.status(500).send(e.stack);
    });
}

export function generateLocationDataAndCache(key: string, cityCache: NodeCache): Promise<FountainCollection | void> {
  // trigger a reprocessing of the location's data, based on the key.
  const genLocPrms = generateLocationData(key)
    .then(fountainCollection => {
      // save newly generated fountainCollection to the cache
      let ftns = -1;
      if (null != fountainCollection && null != fountainCollection.features) {
        ftns = fountainCollection.features.length;
      }
      //TODO @ralfhauser, the old comment states  // expire after two hours but CACHE_FOR_HRS_i45db is currently 48, which means after two days
      cityCache.set(key, fountainCollection, 60 * 60 * sharedConstants.CACHE_FOR_HRS_i45db); // expire after two hours

      // create a reduced version of the data as well
      const essence = essenceOf(fountainCollection);
      cityCache.set(key + '_essential', essence);
      let ess = -1;
      if (null != essence && null != essence.features) {
        ess = essence.features.length;
      }

      // also create list of processing errors (for proximap#206)
      const processingErrors = extractProcessingErrors(fountainCollection);
      cityCache.set(key + '_errors', processingErrors);
      //TODO @ralfhauser, processingErrors is never null but an array, which also means processingErrors.features never exists and hence this will always be false
      // let prcErr = -1;
      // if (null != processingErrors && null != processingErrors.features) {
      //    prcErr = processingErrors.features.length;
      // }
      const prcErr = processingErrors.length;
      l.info(
        `generateLocationDataAndCache setting cache of ${key} ` +
          ' ftns: ' +
          ftns +
          ' ess: ' +
          ess +
          ' prcErr: ' +
          prcErr
      );
      return fountainCollection;
    })
    .catch(error => {
      l.error(`controller.js unable to set Cache. Error: ${error.stack}`);
      // TODO @ralfhauser, return void is not so nice IMO but that's what was defined beforehand implicitly
      return;
    });
  return genLocPrms;
}
