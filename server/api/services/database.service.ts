/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import { essenceOf } from './processing.service';
//TODO @ralfhauser, CACHE_FOR_HRS_i45db is not defined in constants, please adjust this number
// import {CACHE_FOR_HRS_i45db} from "../../common/constants";
const CACHE_FOR_HRS_i45db = 1;
import l from '../../common/logger';
import { generateLocationDataAndCache } from '../controllers/controller';
import _ from 'lodash';
import haversine from 'haversine';
import NodeCache from 'node-cache';
import {} from 'geojson';
import { Fountain, FountainCollection } from '../../common/typealias';

export function updateCacheWithFountain(cache: NodeCache, fountain: Fountain, cityName: string): Fountain {
  // updates cache and returns fountain with datablue id
  // get city data from cache
  let fountains = cache.get<FountainCollection>(cityName);
  const cacheTimeInSecs = 60 * 60 * CACHE_FOR_HRS_i45db;
  if (!fountains && !cityName.includes('_essential') && !cityName.includes('_errors')) {
    l.info(
      `updateCacheWithFountain server-side city data disappeared (server restart?) - cache recreation for ${cityName}`
    );
    generateLocationDataAndCache(cityName, cache);
    fountains = cache.get(cityName);
  }
  if (fountains) {
    // replace fountain
    [fountains, fountain] = replaceFountain(fountains, fountain, cityName);
    // send to cache
    //TODO consider whether really to fully extend the cache-time for the whole city just because one fountain was refreshed
    // a remaining city-cache-time could be calculated with getTtl(cityname)
    cache.set(cityName, fountains, cacheTimeInSecs);
    // create a reduced version of the data as well
    const r_essential = essenceOf(fountains);
    cache.set(cityName + '_essential', r_essential, cacheTimeInSecs);
    return fountain;
  }
  l.info(
    'database.services.js updateCacheWithFountain: no fountains were in cache of city ' +
      cityName +
      ' tried to work on ' +
      fountain
  );
  return fountain;
}

function replaceFountain(
  fountains: FountainCollection,
  fountain: Fountain,
  cityName: string
): [FountainCollection, Fountain] {
  //    update cache with fountain and assign correct datablue id

  const distances: [number, Fountain, number][] = [];

  for (let i = 0; i < fountains.features.length; i++) {
    if (isMatch(fountains.features[i], fountain)) {
      //replace fountain
      fountain.properties.id = fountains.features[i].properties.id;
      fountains.features[i] = fountain;
      l.info('database.services.js replaceFountain: ismatch ftn ' + i + ',  city ' + cityName + ' , ftn ' + fountain);
      return [fountains, fountain];
    } else {
      // compute distance otherwise
      distances.push([
        i,
        fountains.features[i],
        haversine(fountains.features[i].geometry.coordinates, fountain.geometry.coordinates, {
          unit: 'meter',
          format: '[lon,lat]',
        }),
      ]);
    }
  }

  const triple = _.minBy(distances, p => p[2]);
  if (triple !== undefined && triple[2] < 15) {
    //TODO @ralf.hauser `f` did not exist here. I assumed that the fountain should be replaced by the fountain which is nearest. Please verify this change is correct
    const [index, nearestFountain, distance] = triple;
    //replace fountain
    // fountain.properties.id = f.properties.id;
    l.info(
      'database.services.js replaceFountain: replaced with distance ' +
        distance +
        ',  city ' +
        cityName +
        ' , ftn ' +
        fountain
    );
    fountain.properties.id = nearestFountain.properties.id;
    fountains.features[index] = fountain;
    return [fountains, fountain];
  } else {
    // fountain was not found; just add it to the list
    fountain.properties.id = _.max(fountains.features.map(f => f.properties.id)) + 1;
    fountains.features.push(fountain);
    l.info(
      'database.services.js replaceFountain: added with distance ' +
        triple?.[2] +
        ',  city ' +
        cityName +
        ' , ftn ' +
        fountain
    );
    return [fountains, fountain];
  }
}

function isMatch(f1: Fountain, f2: Fountain): boolean {
  // returns true if match, otherwise returns distance
  const ids = ['id_wikidata', 'id_operator', 'id_osm'];
  for (const id_name of ids) {
    if (f1.properties && f2.properties && f1.properties[id_name].value === f2.properties[id_name].value) {
      return true;
    }
  }
  return false;
}
