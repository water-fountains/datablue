import l from '../../common/logger';
import NodeCache from 'node-cache';
import sharedConstants from '../../common/shared-constants';
import { BoundingBox, FountainCollection, LngLat, parseLngLat } from '../../common/typealias';
import { ProcessingError } from '../controllers/processing-errors.controller';
import { getByBoundingBoxFromCacheIfNotForceRefreshOrPopulate } from './generateLocationData.service';
import { illegalState } from '../../common/illegalState';

interface CacheEntry<T> {
  value: T;
  ttl: number;
}

// Configuration of Cache after https://www.npmjs.com/package/node-cache
const locationCache = new NodeCache({
  stdTTL: 60 * 60 * sharedConstants.BOUNDING_BOX_TTL_IN_HOURS, // time till cache expires, in seconds
  checkperiod: 60 * 15, // how often to check for expiration, in seconds - default: 600
  deleteOnExpire: false, // on expire, we want the cache to be recreated not deleted
  useClones: false, // do not create a clone of the data when fetching from cache (because we modify the data I guess)
});

export function getCachedFullFountainCollection(tile: Tile): CacheEntry<FountainCollection> | undefined {
  return getCachedFountainCollection(tile, '');
}
export function getCachedEssentialFountainCollection(tile: Tile): CacheEntry<FountainCollection> | undefined {
  return getCachedFountainCollection(tile, ESSENTIAL_SUFFIX);
}
function getCachedFountainCollection(tile: Tile, suffix: string): CacheEntry<FountainCollection> | undefined {
  return locationCache.get<CacheEntry<FountainCollection>>(tileToLocationCacheKey(tile) + suffix);
}

export function getCachedProcessingErrors(tile: Tile): CacheEntry<ProcessingError> | undefined {
  return locationCache.get<CacheEntry<ProcessingError>>(tileToLocationCacheKey(tile) + PROCESSING_ERRORS_SUFFIX);
}

export function cacheFullFountainCollection(tile: Tile, fountainCollection: FountainCollection, ttl: number): void {
  cacheEntry(tile, '', fountainCollection, ttl);
}
export function cacheEssentialFountainCollection(
  tile: Tile,
  fountainCollection: FountainCollection,
  ttl: number
): void {
  cacheEntry(tile, ESSENTIAL_SUFFIX, fountainCollection, ttl);
}

export function cacheProcessingErrors(tile: Tile, errors: ProcessingError[], ttl: number): void {
  cacheEntry(tile, PROCESSING_ERRORS_SUFFIX, errors, ttl);
}

function cacheEntry<T>(tile: Tile, suffix: string, entry: T, ttl: number): void {
  locationCache.set<CacheEntry<T>>(tileToLocationCacheKey(tile) + suffix, {
    value: entry,
    ttl: ttl,
  });
}

//TODO @ralf.hauser, check if it is realy worth it to store essential data
/*
 * For each bounding box, 3 JSON objects are created. Example for Zurich:
 * - "minLat,minLng:maxLat,maxLng": contains the full data for all fountains within the bounding box
 * - "minLat,minLng:maxLat,maxLng_essential": contains the essential data for all fountains within the bounding box. This is the data loaded for display on the map. It is derived from the full data and cached additionally to speed up time
 * - "minLat,minLng:maxLat,maxLng_errors": contains a list of errors encountered when processing the fountains within the bounding box
 */
// when cached data expires, regenerate full data (ignore expiration of essential and error data)
locationCache.on('expired', (key: string, cacheEntry: CacheEntry<unknown>) => {
  // check if cache item key is neither the summary nor the list of errors. These will be updated automatically when the detailed city data are updated.
  if (isFullDataKey(key)) {
    l.info(`controller locationCache.on('expired',...): Automatic cache refresh of ${key}`);
    const tile = locationCacheKeyToTile(key);
    getByBoundingBoxFromCacheIfNotForceRefreshOrPopulate(
      /*forceRefresh= */ true,
      tile,
      /* essential= */ false,
      'cache expired',
      /* debugAll= */ false,
      cacheEntry.ttl
    );
  }
});

const ESSENTIAL_SUFFIX = '_essential';
const PROCESSING_ERRORS_SUFFIX = '_errors';
function isFullDataKey(key: string) {
  return !key.endsWith(ESSENTIAL_SUFFIX) && !key.endsWith(PROCESSING_ERRORS_SUFFIX);
}

export function locationCacheKeyToTile(key: string): Tile {
  const minMax = key.split(':');
  return BoundingBox(parseLngLat(minMax[0]), parseLngLat(minMax[1]));
}

export function tileToLocationCacheKey(tile: Tile): string {
  return (
    `${tile.min.lat.toFixed(LNG_LAT_STRING_PRECISION)},${tile.min.lng.toFixed(LNG_LAT_STRING_PRECISION)}` +
    ':' +
    `${tile.max.lat.toFixed(LNG_LAT_STRING_PRECISION)},${tile.max.lng.toFixed(LNG_LAT_STRING_PRECISION)}`
  );
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
// 0.05 lat is ~5km
const TILE_SIZE = 0.05;
const ROUND_FACTOR = 20; // 1/0.05;
export const LNG_LAT_STRING_PRECISION = 2;
function roundToTilePrecision(n: number): number {
  return Math.floor(n * ROUND_FACTOR) / ROUND_FACTOR;
}

export function getTileOfLocation(lngLat: LngLat): Tile {
  // for simplicity reasons we don't take the earth shape into account and
  // act as if lng have everywhere the same distance (on all lat)
  //
  // one tile is 0.1 lat x 0.1 lng
  // so the first tile is kind of at 0 - 0.1 lat and 0 - 0.1 lng
  const lng = roundToTilePrecision(lngLat.lng);
  const lat = roundToTilePrecision(lngLat.lat);
  return Tile(lng, lat);
}

export type Tile = BoundingBox;
export function Tile(lngMin: number, latMin: number): BoundingBox {
  const maxLng = lngMin + TILE_SIZE;
  const maxLat = latMin + TILE_SIZE;
  return BoundingBox(LngLat(lngMin, latMin), LngLat(maxLng, maxLat));
}

export function splitInTiles(boundingBox: BoundingBox): Tile[] {
  const startTile = getTileOfLocation(boundingBox.min);
  const tiles = new Array<BoundingBox>();

  for (let lng = startTile.min.lng; lng <= boundingBox.max.lng; lng += TILE_SIZE) {
    for (let lat = startTile.min.lat; lat <= boundingBox.max.lat; lat += TILE_SIZE) {
      tiles.push(Tile(lng, lat));
    }
  }
  return tiles;
}

export function getBoundingBoxOfTiles(tiles: Tile[]): BoundingBox {
  if (tiles.length === 0) illegalState('tiles was empty');
  else if (tiles.length === 1) {
    return tiles[0];
  } else {
    const lngs = tiles.map(x => x.min.lng).sort((a, b) => a - b);
    const lats = tiles.map(x => x.min.lat).sort((a, b) => a - b);
    const minLng = lngs[0];
    const minLat = lats[0];
    const maxLng = lngs[lngs.length - 1] + TILE_SIZE;
    const maxLat = lats[lats.length - 1] + TILE_SIZE;
    const boundingBox = BoundingBox(LngLat(minLng, minLat), LngLat(maxLng, maxLat));
    return boundingBox;
  }
}
