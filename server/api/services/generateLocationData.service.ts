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
  fillWikipediaSummary,
} from '../services/processing.service';
import {
  BoundingBox,
  Database,
  Fountain,
  FountainCollection,
  GalleryValue,
  LngLat,
  positionToLngLat,
} from '../../common/typealias';
import { hasWikiCommonsCategories, MediaWikiSimplifiedEntity } from '../../common/wikimedia-types';
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
  splitInTiles,
  Tile,
  tileToLocationCacheKey,
} from './locationCache';
import { sleep } from '../../common/sleep';
import { LAZY_ARTIST_NAME_LOADING_i41db, MAX_IMG_SHOWN_IN_GALLERY } from '../../common/constants';
import { ImageLike } from '../../../config/text2img';
import { isBlacklisted } from './categories.wm';
import { getImageInfo, getImgsOfCat } from './wikimedia.service';
import { getCatExtract, getImgClaims } from './claims.wm';

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
  const collection = await byTilesFromCacheIfNotForceRefreshOrPopulate(
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
      collection.features.length +
      `) fountains from ${dbg} \nstart: ` +
      start.toISOString() +
      '\nend:   ' +
      end.toISOString()
  );
  return collection;
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
): Promise<FountainCollection> {
  type AccType = [Fountain[], Date] | undefined;

  //TODO @ralf.hauser, we could optimise this a bit in case only bounding boxes at the border are not cached yet
  const maybeArr = forceRefresh
    ? undefined // don't even search in cache in case of forceRefresh
    : tiles.reduce(
        (acc, tile) => {
          if (acc === undefined) {
            // previous was not in cache, no need to search further
            return undefined;
          } else {
            const cacheEntry = essential
              ? getCachedEssentialFountainCollection(tile)
              : getCachedFullFountainCollection(tile);
            if (cacheEntry !== undefined) {
              const [fountains, currentLastScan] = acc;
              const lastScan = cacheEntry.value.last_scan;
              const olderLastScan = lastScan && lastScan < currentLastScan ? lastScan : currentLastScan;
              return [fountains.concat(cacheEntry.value.features), olderLastScan] as AccType;
            } else {
              return undefined;
            }
          }
        },
        /* initial= */ [[], new Date()] as AccType
      );

  if (maybeArr !== undefined) {
    const [fountains, lastScan] = maybeArr;
    l.info('all tiles in cache');
    // all in cache, return immediately
    return Promise.resolve(FountainCollection(fountains, lastScan));
  } else {
    const lastScan = new Date();
    const fountains = await fetchFountainsFromServerAndUpdateCache(
      tiles,
      essential,
      dbg,
      debugAll,
      ttlInHours,
      lastScan
    );
    return FountainCollection(fountains, lastScan);
  }
}

async function fetchFountainsFromServerAndUpdateCache(
  tiles: Tile[],
  essential: boolean,
  dbg: string,
  debugAll: boolean,
  ttlInHours: number | undefined,
  lastScan: Date
): Promise<Fountain[]> {
  const boundingBox = getBoundingBoxOfTiles(tiles);
  const fountains = await fetchFountainsByBoundingBox(boundingBox, dbg, debugAll);

  const groupedByTile = fountains.groupBy(fountain =>
    tileToLocationCacheKey(getTileOfLocation(positionToLngLat(fountain.geometry.coordinates)))
  );

  const collections = tiles.map(tile => {
    const cacheKey = tileToLocationCacheKey(tile);
    const fountains = groupedByTile.get(cacheKey) ?? [];
    let fountainCollection: FountainCollection | undefined = FountainCollection(fountains, lastScan);
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
  const collection = await byTilesFromCacheIfNotForceRefreshOrPopulate(
    forceRefresh,
    [tile],
    /* essential = */ false,
    'database: ' + database + ' idval: ' + idval,
    /* debugAll =*/ false
  );
  const fountain = collection.features.find(f => f.properties['id_' + database]?.value === idval);
  // TODO @ralf.hauser IMO it would make sense to distinguish this also in typing
  const enrichedFountain = fountain ? enrichFountain(fountain, idval) : undefined;
  if (enrichedFountain === undefined) {
    l.info(`byId: loc ${loc.lat},${loc.lng} not in cache after loading, id/loc mismatch?`);
  }
  return enrichedFountain;
}

//TODO @ralf.hauser this function is still very very smelly. I throw now an error instead of not responding at all
function enrichFountain(fountain: Fountain, dbg: string): Promise<Fountain> {
  const imgMetaPromises: Promise<any>[] = [];
  let lazyAdded = 0;
  let gl = -1;
  if (null == fountain) illegalState('enrichFountain: fountain undefined', fountain);
  const props = fountain.properties;
  if (null == props) illegalState('enrichFountain: properties of fountain where undefined', fountain);

  const name = props.name.value;
  if (LAZY_ARTIST_NAME_LOADING_i41db) {
    imgMetaPromises.push(WikidataService.fillArtistName(fountain, dbg));
  }
  imgMetaPromises.push(WikidataService.fillOperatorInfo(fountain, dbg));
  fillWikipediaSummary(fountain, dbg, 1, imgMetaPromises);

  const gallery = props.gallery;
  const galleryArr = gallery?.value;
  if (!Array.isArray(galleryArr)) {
    illegalState('controller.js byId: gallery null || null == gal.value || !isArray ' + dbg);
  }

  gl = galleryArr.length;
  //if (galleryArr.isEmpty()) {
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
        const catPromise = getImgsOfCat(cat, dbg, imgUrlSet, imgUrlsLazyByCategory, 'dbgIdWd', props, true);
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
            'controller.js byId lazy getImageInfo: ' + i + '/' + gl + ' "' + img.pgTit + '" "' + name + '" ' + dbg
          );
          imgMetaPromises.push(
            getImageInfo(img, i + '/' + gl + ' ' + dbg + ' ' + name, showDetails, props).catch(giiErr => {
              //TODO @ralfhauser, dbgIdWd does not exist
              const dbgIdWd = undefined;
              l.info(
                'wikimedia.service.js: fillGallery getImageInfo failed for "' +
                  img.pgTit +
                  '" ' +
                  dbg +
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
            ') ' +
            dbg +
            ' "' +
            name +
            '"'
        );
      }
      return waitForImgMetaPromises(fountain, lazyAdded, imgMetaPromises, gl + ' ' + dbg + ' "' + name + '"');
    },
    err => {
      l.error(`controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg + ' "' + name + '"');
      throw err;
    }
  );
  //  } else {
  //    l.info('controller.js byId: gl > 0 - '+ gl+' ' + dbg);
  //    return waitForImgMetaPromises(fountain, lazyAdded, imgMetaPromises, gl + ' ' + dbg + ' "' + name + '"');
  //  }
}

function waitForImgMetaPromises(
  fountain: Fountain,
  lazyAdded: number,
  imgMetaPromises: Promise<any>[],
  dbg: string
): Promise<Fountain> {
  return Promise.all(imgMetaPromises).then(
    r => {
      if (0 < lazyAdded) {
        l.info(
          'controller.js byId lazy img metadata loading after promise: attempted ' +
            lazyAdded +
            ' tot ' +
            dbg +
            '" ' +
            r.length
        );
      }
      l.info('controller.js byId: res.json ' + dbg);
      return fountain;
    },
    err => {
      l.error(`controller.js: Failed on imgMetaPromises: ${err.stack} .` + dbg);
      throw err;
    }
  );
}
