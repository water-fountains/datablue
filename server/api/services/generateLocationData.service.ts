/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import { cities, getCityBoundingBox } from '../../../config/locations';
import OsmService from '../services/osm.service';
import WikidataService from '../services/wikidata.service';
import { conflate } from '../services/conflate.data.service';
import applyImpliedPropertiesOsm from '../services/applyImplied.service';
import {
  createUniqueIds,
  defaultCollectionEnhancement,
  essenceOf,
  fillInMissingWikidataFountains,
} from '../services/processing.service';
import { BoundingBox, Database, Fountain, FountainCollection, LngLat } from '../../common/typealias';
import { MediaWikiSimplifiedEntity } from '../../common/wikimedia-types';
import sharedConstants from '../../common/shared-constants';
import { extractProcessingErrors, ProcessingError } from '../controllers/processing-errors.controller';
import { illegalState } from '../../common/illegalState';
import '../../common/importAllExtensions';
import {
  cacheEssentialFountainCollection,
  cacheFullFountainCollection,
  cacheProcessingErrors,
  getBoundingBoxOfTiles,
  getCachedEssentialFountainCollection,
  getCachedFullFountainCollection,
  getCachedProcessingErrors,
  getTileOfLocation,
  locationCacheKeyToTile,
  splitInTiles,
  Tile,
  tileToLocationCacheKey,
} from './locationCache';
import { sleep } from '../../common/sleep';

//TODO @ralf.hauser reconsider this functionality. If a user queries a city in the same time then it is more likely
//that we run into a throttling timeout. Maybe only load the default city?
export async function populateCacheWithCities(): Promise<void> {
  for (const city of cities) {
    if (city !== 'test') continue;
    l.info(`Generating data for ${city}`);
    await getByBoundingBoxFromCacheIfNotForceRefreshOrPopulate(
      /*forceRefresh= */ false,
      getCityBoundingBox(city),
      /* essential= */ false,
      /* dbg=*/ city,
      /* debugAll= */ false,
      sharedConstants.CITY_TTL_IN_HOURS
    ).catch(async (e: any) => {
      // we still want to try to populate the others, thus we are not re-throwing.
      //TODO @ralf.hauser it would actually be better if we react to a 429 response from OSM or wikidata
      if (e.statusCode === 429) {
        console.error('we got throttled, waiting for 2 minutes');
        // wait 2 minutes because OSM or wikidata throttled us
        await sleep(2 * 60 * 1000);
      } else {
        console.error(e.message + '\n' + e.stack);
      }
    });
    // wait 30 seconds between each city to lower the chance that OSM or wikidata throttles us
    await sleep(30 * 1000);
  }
  l.info('finished populating cache with cities');
}

export async function getByBoundingBoxFromCacheIfNotForceRefreshOrPopulate(
  forceRefresh: boolean,
  boundingBox: BoundingBox,
  essential: boolean,
  dbg: string,
  debugAll: boolean,
  ttlInHours: number | undefined = undefined
): Promise<FountainCollection> {
  const start = new Date();
  const tiles = splitInTiles(boundingBox);
  l.info('processing ' + tiles.length + ' tiles');
  const allFountains = await byTilesFromCacheIfNotForceRefreshOrPopulate(
    forceRefresh,
    tiles,
    essential,
    dbg,
    debugAll,
    ttlInHours
  );

  const end = new Date();
  const elapse = (end.getTime() - start.getTime()) / 1000;
  l.info(
    'generateLocationData.service.js: after ' +
      elapse.toFixed(1) +
      ' secs successfully processed all (size ' +
      allFountains.length +
      `) fountains from ${dbg} \nstart: ` +
      start.toISOString() +
      '\nend:   ' +
      end.toISOString()
  );
  //TODO @ralf.hauser, derive lastScan from the cached collections (what date to use?) otherwise it will result in a
  // different e-tag and client needs to refetch data even though it is still the same
  return FountainCollection(allFountains, /* lastScan= */ start);
}
export function getProcessingErrorsByBoundingBox(boundingBox: BoundingBox): ProcessingError[] {
  const arr = splitInTiles(boundingBox).map(tile => getCachedProcessingErrors(tile));
  return arr.reduce((acc, v) => (v !== undefined ? acc.concat(v.value) : acc), /*initial=*/ []);
}

async function byTilesFromCacheIfNotForceRefreshOrPopulate(
  forceRefresh: boolean,
  tiles: BoundingBox[],
  essential: boolean,
  dbg: string,
  debugAll: boolean,
  ttlInHours: number | undefined = undefined
): Promise<Fountain[]> {
  //TODO @ralf.hauser, we could optimise this a bit in case only bounding boxes at the border are not cached yet
  const maybeFountains = forceRefresh
    ? undefined // don't even search in cache in case of forceRefresh
    : tiles.reduce((acc, tile) => {
        if (acc === undefined) {
          // previous was not in cache, no need to search further
          return undefined;
        } else {
          const cacheEntry = essential
            ? getCachedEssentialFountainCollection(tile)
            : getCachedFullFountainCollection(tile);
          if (cacheEntry !== undefined) {
            return acc.concat(cacheEntry.value.features);
          } else {
            return undefined;
          }
        }
      }, /* initial= */ [] as Fountain[] | undefined);

  if (maybeFountains !== undefined) {
    l.info('all tiles in cache');
    // all in cache, return immediately
    return Promise.resolve(maybeFountains);
  } else {
    return fetchFountainsFromServerAndUpdateCache(tiles, essential, dbg, debugAll, ttlInHours);
  }
}

async function fetchFountainsFromServerAndUpdateCache(
  tiles: Tile[],
  essential: boolean,
  dbg: string,
  debugAll: boolean,
  ttlInHours: number | undefined
): Promise<Fountain[]> {
  const boundingBox = getBoundingBoxOfTiles(tiles);
  const fountains = await fetchFountainsByBoundingBox(boundingBox, dbg, debugAll);

  const groupedByTile = fountains.groupBy(fountain =>
    tileToLocationCacheKey(
      getTileOfLocation(LngLat(fountain.geometry.coordinates[0], fountain.geometry.coordinates[1]))
    )
  );

  const collections = tiles.map(tile => {
    const cacheKey = tileToLocationCacheKey(tile);
    const fountains = groupedByTile.get(cacheKey) ?? [];
    let fountainCollection: FountainCollection | undefined = FountainCollection(fountains);
    updateCacheWithFountains(tile, fountainCollection, ttlInHours);
    fountainCollection = (
      essential ? getCachedEssentialFountainCollection(tile) : getCachedFullFountainCollection(tile)
    )?.value;
    if (fountainCollection === undefined) {
      illegalState(`fountainCollection ${cacheKey} was undefined after writing it to the cache`);
    }
    return fountainCollection;
  });

  return collections.reduce((acc, collection) => acc.concat(collection.features), /* initial= */ new Array<Fountain>());
}

function fetchFountainsByBoundingBox(boundingBox: BoundingBox, dbg: string, debugAll: boolean): Promise<Fountain[]> {
  const osmPromise = OsmService.byBoundingBox(boundingBox)
    .then(arr => applyImpliedPropertiesOsm(arr))
    .catch(e => {
      if ('getaddrinfo' == e.syscall) {
        l.info('Are you offline from the internet?');
      }
      l.error(
        `generateLocationDataService: Error collecting OSM data - generateLocationData: ${e.message}` +
          ' latMin ' +
          boundingBox.min.lat +
          ', lngMim ' +
          boundingBox.min.lng +
          ', latMax ' +
          boundingBox.max.lat +
          ', lngMax ' +
          boundingBox.max.lng
      );
      throw e;
    });

  // get data from Wikidata
  const wikidataPromise: Promise<MediaWikiSimplifiedEntity[]> = WikidataService.idsByBoundingBox(boundingBox).then(r =>
    // TODO @ralf.hauser why not fetch the wikidata already in idsByBoundingBox?
    WikidataService.byIds(r, dbg)
  );

  // conflate
  return (
    Promise.all([osmPromise, wikidataPromise])
      // get any missing wikidata fountains for proximap#212
      .then(arr => fillInMissingWikidataFountains(arr[0], arr[1], dbg))
      .then(arr => conflate(arr, dbg, debugAll))
      .then(arr => defaultCollectionEnhancement(arr, dbg, debugAll))
      //TODO @ralf.hauser really required?
      .then(arr => createUniqueIds(arr))
  );
}

function updateCacheWithFountains(tile: Tile, fountainCollection: FountainCollection, ttlInHours: number | undefined) {
  // save newly generated fountainCollection to the cache

  const existing = getCachedFullFountainCollection(tile);
  const ttl = 60 * 60 * (ttlInHours ?? existing?.ttl ?? sharedConstants.BOUNDING_BOX_TTL_IN_HOURS);
  cacheFullFountainCollection(tile, fountainCollection, ttl);

  // create a reduced version of the data as well
  const essence = essenceOf(fountainCollection);
  cacheEssentialFountainCollection(tile, essence, ttl);

  // also create list of processing errors (for proximap#206)
  const processingErrors = extractProcessingErrors(fountainCollection);
  cacheProcessingErrors(tile, processingErrors, ttl);
  //TODO @ralfhauser, processingErrors is never null but an array, which also means processingErrors.features never exists and hence this will always be false
  // let prcErr = -1;
  // if (null != processingErrors && null != processingErrors.features) {
  //    prcErr = processingErrors.features.length;
  // }
  l.info(
    `generateLocationDataAndCache setting cache of ${tileToLocationCacheKey(tile)}` +
      ' number of fountains: ' +
      (fountainCollection?.features?.length ?? 'unknown') +
      ' ess: ' +
      (essence?.features?.length ?? 'unknown') +
      ' prcErr: ' +
      processingErrors.length
  );
}

export async function getFountainFromCacheIfNotForceRefreshOrFetch(
  forceRefresh: boolean,
  database: Database,
  idval: string,
  loc: LngLat
): Promise<Fountain | undefined> {
  const tile = getTileOfLocation(loc);
  const fountains = await byTilesFromCacheIfNotForceRefreshOrPopulate(
    forceRefresh,
    [tile],
    /* essential = */ false,
    'database: ' + database + ' idval: ' + idval,
    /* debugAll =*/ false
  );
  return fountains.find(f => f.properties['id_' + database]?.value === idval);

  // let name = 'unkNamById';

  // const cityPromises: Promise<FountainCollection | void>[] = [];
  // if (forceRefresh || fountains === undefined) {
  //   //TODO #150 don't load all city data but only the specific fountain?
  //   const genLocPrms = generateCityDataAndAddToCache(city, locationCache);
  //   cityPromises.push(genLocPrms);
  // }
  // return Promise.all(cityPromises)
  //   .then(
  //     () => {
  //       if (forceRefresh || fountains === undefined) {
  //         fountains = locationCache.get<FountainCollection>(city);
  //       }
  //       if (fountains !== undefined) {
  //         const fountain = fountains.features.find(f => f.properties['id_' + database]?.value === idval);
  //         const imgMetaPromises: Promise<any>[] = [];
  //         let lazyAdded = 0;
  //         const gl = -1;
  //         if (fountain === undefined) {
  //           l.info('controller.js byId: of ' + city + ' not found in cache ' + dbg);
  //           return undefined;
  //         } else {
  //           const props = fountain.properties;
  //           //    	  l.info('controller.js byId fountain: '+cityS+' '+dbg);
  //           if (null != props) {
  //             name = props.name.value;
  //             if (LAZY_ARTIST_NAME_LOADING_i41db) {
  //               imgMetaPromises.push(WikidataService.fillArtistName(fountain, dbg));
  //             }
  //             imgMetaPromises.push(WikidataService.fillOperatorInfo(fountain, dbg));
  //             fillWikipediaSummary(fountain, dbg, 1, imgMetaPromises);
  //             const gallery = props.gallery;
  //             //  		  l.info('controller.js byId props: '+cityS+' '+dbg);
  //             if (null != gallery && null != gallery.value) {
  //               //  			  l.info('controller.js byId gl: '+cityS+' '+dbg);
  //               if (0 < gallery.value.length) {
  //                 //  				  l.info('controller.js byId: of '+cityS+' found gal of size '+gl+' "'+name+'" '+dbg);
  //                 let i = 0;
  //                 let lzAtt = '';
  //                 const showDetails = true;
  //                 const singleRefresh = true;
  //                 const imgUrlSet = new Set<string>();
  //                 const catPromises: Promise<ImageLike[]>[] = [];
  //                 let numberOfCategories = -1;
  //                 let numberOfCategoriesLazyAdded = 0;
  //                 const imgUrlsLazyByCategory: ImageLike[] = [];
  //                 // TODO @ralfhauser, this condition does not make sense, if value.length < 0 means basically if it is empty and if it is empty, then numberOfCategories will always be 0 and the for-loop will do nothing
  //                 if (hasWikiCommonsCategories(props) && 0 < props.wiki_commons_name.value.length) {
  //                   numberOfCategories = props.wiki_commons_name.value.length;
  //                   let j = 0;
  //                   for (const cat of props.wiki_commons_name.value) {
  //                     j++;
  //                     if (null == cat) {
  //                       l.info(i + '-' + j + ' controller.js: null == commons category "' + cat + '" "' + dbg);
  //                       continue;
  //                     }
  //                     if (null == cat.c) {
  //                       l.info(i + '-' + j + ' controller.js: null == commons cat.c "' + cat + '" "' + dbg);
  //                       continue;
  //                     }
  //                     if (isBlacklisted(cat.c)) {
  //                       l.info(i + '-' + j + ' controller.js: commons category blacklisted  "' + cat + '" "' + dbg);
  //                       continue;
  //                     }
  //                     const add = 0 > cat.l;
  //                     if (add) {
  //                       numberOfCategoriesLazyAdded++;
  //                       if (0 == imgUrlSet.size) {
  //                         for (const img of gallery.value) {
  //                           imgUrlSet.add(img.pgTit);
  //                         }
  //                       }
  //                       const catPromise = getImgsOfCat(
  //                         cat,
  //                         dbg,
  //                         city,
  //                         imgUrlSet,
  //                         imgUrlsLazyByCategory,
  //                         'dbgIdWd',
  //                         props,
  //                         true
  //                       );
  //                       //TODO we might prioritize categories with small number of images to have greater variety of images?
  //                       catPromises.push(catPromise);
  //                     }
  //                     getCatExtract(singleRefresh, cat, catPromises, dbg);
  //                   }
  //                 }
  //                 return Promise.all(catPromises).then(
  //                   r => {
  //                     for (let k = 0; k < imgUrlsLazyByCategory.length && k < MAX_IMG_SHOWN_IN_GALLERY; k++) {
  //                       //between 6 && 50 imgs are on the gallery-preview
  //                       const img = imgUrlsLazyByCategory[k];
  //                       //TODO @ralfhauser, val does not exist on GalleryValue but value, changed it
  //                       const nImg: GalleryValue = {
  //                         s: img.src,
  //                         pgTit: img.value,
  //                         c: img.cat,
  //                         t: img.typ,
  //                       };
  //                       gallery.value.push(nImg);
  //                     }
  //                     if (0 < imgUrlsLazyByCategory.length) {
  //                       l.info(
  //                         'controller.js byId lazy img by lazy cat added: attempted ' +
  //                           imgUrlsLazyByCategory.length +
  //                           ' in ' +
  //                           numberOfCategoriesLazyAdded +
  //                           '/' +
  //                           numberOfCategories +
  //                           ' cats, tot ' +
  //                           gl +
  //                           ' of ' +
  //                           city +
  //                           ' ' +
  //                           dbg +
  //                           ' "' +
  //                           name +
  //                           '" ' +
  //                           r.length
  //                       );
  //                     }
  //                     for (const img of gallery.value) {
  //                       const imMetaDat = img.metadata;
  //                       if (null == imMetaDat && 'wm' == img.t) {
  //                         lzAtt += i + ',';
  //                         l.info(
  //                           'controller.js byId lazy getImageInfo: ' +
  //                             city +
  //                             ' ' +
  //                             i +
  //                             '/' +
  //                             gl +
  //                             ' "' +
  //                             img.pgTit +
  //                             '" "' +
  //                             name +
  //                             '" ' +
  //                             dbg
  //                         );
  //                         imgMetaPromises.push(
  //                           getImageInfo(
  //                             img,
  //                             i + '/' + gl + ' ' + dbg + ' ' + name + ' ' + city,
  //                             showDetails,
  //                             props
  //                           ).catch(giiErr => {
  //                             //TODO @ralfhauser, dbgIdWd does not exist
  //                             const dbgIdWd = undefined;
  //                             l.info(
  //                               'wikimedia.service.js: fillGallery getImageInfo failed for "' +
  //                                 img.pgTit +
  //                                 '" ' +
  //                                 dbg +
  //                                 ' ' +
  //                                 city +
  //                                 ' ' +
  //                                 dbgIdWd +
  //                                 ' "' +
  //                                 name +
  //                                 '"' +
  //                                 '\n' +
  //                                 giiErr.stack
  //                             );
  //                           })
  //                         );
  //                         lazyAdded++;
  //                       } else {
  //                         //  							  l.info('controller.js byId: of '+cityS+' found imMetaDat '+i+' in gal of size '+gl+' "'+name+'" '+dbg);
  //                       }
  //                       getImgClaims(singleRefresh, img, imgMetaPromises, i + ': ' + dbg);
  //                       i++;
  //                     }
  //                     if (0 < lazyAdded) {
  //                       l.info(
  //                         'controller.js byId lazy img metadata loading: attempted ' +
  //                           lazyAdded +
  //                           '/' +
  //                           gl +
  //                           ' (' +
  //                           lzAtt +
  //                           ') of ' +
  //                           city +
  //                           ' ' +
  //                           dbg +
  //                           ' "' +
  //                           name +
  //                           '"'
  //                       );
  //                     }
  //                     return Promise.all(imgMetaPromises).then(
  //                       r => {
  //                         if (0 < lazyAdded) {
  //                           l.info(
  //                             'controller.js byId lazy img metadata loading after promise: attempted ' +
  //                               lazyAdded +
  //                               ' tot ' +
  //                               gl +
  //                               ' of ' +
  //                               city +
  //                               ' ' +
  //                               dbg +
  //                               ' "' +
  //                               name +
  //                               '" ' +
  //                               r.length
  //                           );
  //                         }
  //                         //TODO @ralfhauser this is a clear smell, we already send the response before we resolve the promise
  //                         // it would be better if we return the fountain in a then once the promise completes
  //                         sendJson(res, fountain, 'byId ' + dbg); //  res.json(fountain);
  //                         l.info('controller.js byId: of ' + city + ' res.json ' + dbg + ' "' + name + '"');
  //                         return fountain;
  //                       },
  //                       err => {
  //                         l.error(
  //                           `controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '" ' + city
  //                         );
  //                         return undefined;
  //                       }
  //                     );
  //                   },
  //                   err => {
  //                     l.error(
  //                       `controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '" ' + city
  //                     );
  //                     return undefined;
  //                   }
  //                 );
  //               } else {
  //                 l.info('controller.js byId: of ' + city + ' gl < 1  ' + dbg);
  //                 return Promise.all(imgMetaPromises).then(
  //                   r => {
  //                     if (0 < lazyAdded) {
  //                       l.info(
  //                         'controller.js byId lazy img metadata loading after promise: attempted ' +
  //                           lazyAdded +
  //                           ' tot ' +
  //                           gl +
  //                           ' of ' +
  //                           city +
  //                           ' ' +
  //                           dbg +
  //                           ' "' +
  //                           name +
  //                           '" ' +
  //                           r.length
  //                       );
  //                     }
  //                     //TODO @ralfhauser this is a clear smell, we already send the response before we resovle the promise
  //                     sendJson(res, fountain, 'byId ' + dbg); //  res.json(fountain);
  //                     l.info('controller.js byId: of ' + city + ' res.json ' + dbg + ' "' + name + '"');
  //                     return fountain;
  //                   },
  //                   err => {
  //                     l.error(
  //                       `controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '" ' + city
  //                     );
  //                     return undefined;
  //                   }
  //                 );
  //               }
  //             } else {
  //               l.info('controller.js byId: of ' + city + ' gallery null || null == gal.value  ' + dbg);
  //               return undefined;
  //             }
  //           } else {
  //             l.info('controller.js byId: of ' + city + ' no props ' + dbg);
  //             return undefined;
  //           }
  //         }
  //       } else {
  //         return undefined;
  //       }
  //       //      l.info('controller.js byId: end of '+cityS+' '+dbg);
  //     },
  //     err => {
  //       l.error(`controller.js byId: Failed on genLocPrms: ${err.stack} .` + dbg + ' ' + city);
  //       return undefined;
  //     }
  //   )
  //   .catch(e => {
  //     //TODO @ralfhauser, this error will never occurr because we already defined an error case two lines above
  //     l.error(`controller.js byId: Error finding fountain in preprocessed data: ${e} , city: ` + city + ' ' + dbg);
  //     l.error(e.stack);
  //     return undefined;
  //   });
}
