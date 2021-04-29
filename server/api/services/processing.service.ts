/*
 * @license
 * (c) Copyright 2019 - 20 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import * as _ from 'lodash';
import WikimediaService from './wikimedia.service';
import WikipediaService from './wikipedia.service';
import WikidataService from './wikidata.service';
import l from '../../common/logger';
import { fountain_property_metadata } from '../../../config/fountain.properties';
import {
  PROP_STATUS_INFO,
  LAZY_ARTIST_NAME_LOADING_i41db, //, LANGS
} from '../../common/constants';
import sharedConstants from '../../common/shared-constants';
import { Fountain, FountainCollection, FountainConfig, FountainConfigCollection } from '../../common/typealias';

export function defaultCollectionEnhancement(
  fountainArr: Fountain[],
  dbg: string,
  debugAll: boolean
): Promise<Fountain[]> {
  l.info('processing.service.js defaultCollectionEnhancement: ' + dbg);
  return fillImageGalleries(fountainArr, dbg, debugAll).then((r) => fillOutNames(r, dbg));
  //      .then(r => fillWikipediaSummaries(r,dbg))
  //      .then(r => fillArtistNames(r,dbg)) as per LAZY_ARTIST_NAME_LOADING_i41db
  //      .then(r => fillOperatorInfo(r,dbg))
}

export function fillImageGalleries(fountainArr: Fountain[], city: string, debugAll: boolean): Promise<Fountain[]> {
  // takes a collection of fountains and returns the same collection,
  // enhanced with image galleries when available or default images
  l.info('processing.service.js starting fillImageGalleries: ' + city + ' debugAll ' + debugAll);
  return new Promise((resolve, reject) => {
    let promises: Promise<Fountain>[] = [];
    let i = 0;
    let tot = fountainArr.length;
    let step = 1;
    if (tot >= 50) {
      step = 10;
      if (tot >= 300) {
        step = 50;
        if (tot >= 600) {
          step = 100;
          if (tot >= 1000) {
            step = 200;
            if (tot >= 2000) {
              step = 500;
            }
          }
        }
      }
    }
    let allMap = new Map();
    let dbgAll = debugAll;
    _.forEach(fountainArr, (fountain) => {
      i = i + 1;
      if (!debugAll) {
        dbgAll = 0 == i % step;
      }
      const dbg = i + '/' + tot;
      promises.push(WikimediaService.fillGallery(fountain, dbg, city, dbgAll, allMap, tot));
    });

    Promise.all(promises)
      .then((r) => resolve(r))
      .catch((err) => reject(err));
  });
}

// created for proximap #129
export function fillArtistNames(fountainArr: Fountain[], dbg: string): Promise<Fountain[]> {
  // takes a collection of fountains and returns the same collection,
  // enhanced with artist names if only QID was given
  l.info('processing.service.js starting fillArtistNames: ' + dbg);
  if (LAZY_ARTIST_NAME_LOADING_i41db) {
    l.info(
      'processing.service.js fillArtistNames LAZY_ARTIST_NAME_LOADING_i41db: ' +
        LAZY_ARTIST_NAME_LOADING_i41db +
        ' - ' +
        dbg
    );
  }
  return new Promise((resolve, reject) => {
    let promises: Promise<Fountain>[] = [];
    let i = 0;
    _.forEach(fountainArr, (fountain) => {
      i++;
      const idWd = fountain.properties.id_wikidata.value;
      let dbgHere = dbg + ' ' + idWd + ' ' + i + '/' + fountainArr.length;
      promises.push(WikidataService.fillArtistName(fountain, dbgHere));
    });

    Promise.all(promises)
      .then((r) => resolve(r))
      .catch((err) => reject(err));
  });
}

// created for proximap #149
export function fillOperatorInfo(fountainArr: Fountain[], dbg: string): Promise<Fountain[]> {
  // takes a collection of fountains and returns the same collection,
  // enhanced with operator information if that information is available in Wikidata
  l.info('processing.service.js starting fillOperatorInfo: ' + dbg);
  return new Promise((resolve, reject) => {
    let promises: Promise<Fountain>[] = [];
    _.forEach(fountainArr, (fountain) => {
      promises.push(WikidataService.fillOperatorInfo(fountain, dbg));
    });

    Promise.all(promises)
      .then((r) => resolve(r))
      .catch((err) => reject(err));
  });
}

export function fillWikipediaSummary(fountain: Fountain, dbg: string, tot: number, promises: Promise<void>[]) {
  // check all languages to see if a wikipedia page is referenced
  let i = 0;
  _.forEach(sharedConstants.LANGS, (lang) => {
    let urlParam = `wikipedia_${lang}_url`;
    i = i + 1;
    const dbgHere = i + '/' + tot + ' ' + dbg;
    const props = fountain.properties;
    const url = props[urlParam];
    if (null != url && null != url.value) {
      // if not Null, get summary and create new property
      let dbgIdWd = null;
      if (null != props.id_wikidata && null != props.id_wikidata.value) {
        dbgIdWd = props.id_wikidata.value;
      }
      promises.push(
        new Promise((resolve, reject) => {
          WikipediaService.getSummary(url.value, dbgHere + ' ' + lang + ' ' + dbgIdWd)
            .then((summary) => {
              // add summary as derived information to url property
              url.derived = {
                summary: summary,
              };
              resolve();
            })
            .catch((error) => {
              l.error(`Error creating Wikipedia summary: ${error}`);
              reject(error);
            });
        })
      );
    }
  });
}

// TODO @ralfhauser, Looks like this function is no longer used, I suggest we remove it and the commented out code in processing.services.ts
export function fillWikipediaSummaries(fountainArr: Fountain[], dbg: string): Promise<Fountain[]> {
  // takes a collection of fountains and returns the same collection, enhanced with wikipedia summaries
  l.info('processing.service.js starting fillWikipediaSummaries: ' + dbg);
  return new Promise((resolve, reject) => {
    let promises = [];
    // loop through fountains
    let tot = fountainArr.length;
    _.forEach(fountainArr, (fountain) => {
      fillWikipediaSummary(fountain, dbg, tot, promises);
    });

    Promise.all(promises)
      .then((_) => resolve(fountainArr))
      .catch((err) => reject(err));
  });
}

export function createUniqueIds(fountainArr: Fountain[]): Promise<Fountain[]> {
  // takes a collection of fountains and returns the same collection, enhanced with unique and as persistent as possible ids
  return new Promise((resolve) => {
    let i_n = 0;
    fountainArr.forEach((f) => {
      f.properties.id = i_n;
      f.properties.id_datablue = {
        value: i_n,
      };
      i_n += 1;
    });
    resolve(fountainArr);
  });
}

export function essenceOf(fountainCollection: FountainCollection) {
  // returns a version of the fountain data with only the essential data
  let newCollection: FountainCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  //TODO @ralfhauser, properties do not exist on the GeoJSON standard for FeatureCollection, in other words, this is a hack.
  (newCollection as any).properties = {
    // Add last scan time info for https://github.com/water-fountains/proximap/issues/188
    last_scan: new Date(),
  };

  // Get list of property names that are marked as essential in the metadata
  let essentialPropNames: string[] = _.map(fountain_property_metadata, (p, p_name) => {
    if (p.essential) {
      return p_name;
    } else return null;
  }).filter((p): p is string => p !== null);
  let withGallery = 0;
  let strVw = 0;
  // Use the list of essential property names to create a compact version of the fountain data
  fountainCollection.features.forEach((f) => {
    let fPrps = f.properties;
    let props = _.pick(fPrps, essentialPropNames);
    props = _.mapValues(props, (obj) => {
      return obj.value;
    });
    // add id manually, since it does not have the standard property structure
    props.id = fPrps.id;
    // add photo if it is not google street view
    let fGal = fPrps.gallery;
    let fGV = fGal.value;
    let fGV0 = fGV[0];
    if (null == fGV0) {
      // l.info(fPrps.id+" null == fGV0 - essenceOf processing.service.js");
    } else {
      if (fGal.comments) {
        //leading to streetview default
        props.ph = '';
        strVw++;
      } else {
        props.ph = { s: fGV0.s, pt: fGV0.pgTit, t: fGV0.t };
        withGallery++;
      }
    }
    props.panCur = fPrps.pano_url.comments ? 'n' : 'y';
    // create feature for fountain
    newCollection.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: f.geometry.coordinates,
      },
      properties: props,
    });
  });
  l.info('processing.service.js essenceOf: withGallery ' + withGallery + ', strVw ' + strVw);
  return newCollection;
}

export function fillOutNames(fountainArr: Fountain[], dbg: string): Promise<Fountain[]> {
  // takes a collection of fountains and returns the same collection, with blanks in fountain names filled from other languages or from 'name' property
  l.info('processing.service.js starting fillOutNames: ' + dbg);
  return new Promise((resolve) => {
    let i = 0;
    for (let f of fountainArr) {
      // if the default name (aka title) if not filled, then fill it from one of the other languages
      const fProps = f.properties;
      if (fProps == null) {
        l.info('processing.service.js fProps == null: ' + dbg + ' ' + i + '/' + fountainArr.length);
        continue;
      }
      if (fProps.name == null) {
        l.info('processing.service.js starting properties.name === null: ' + dbg + ' ' + i + '/' + fountainArr.length);
      }
      i++;
      if (fProps.name.value === null) {
        for (let lang of sharedConstants.LANGS) {
          let fPopLng = fProps[`name_${lang}`];
          if (fPopLng != null && fPopLng.value !== null) {
            // take the first language-specific name that is not null and apply it to the default name
            fProps.name.value = fPopLng.value;
            fProps.name.source_name = fPopLng.source_name;
            fProps.name.source_url = fPopLng.source_url;
            fProps.name.comments = `Value taken from language ${lang}.`;
            fProps.name.status = PROP_STATUS_INFO;
            break;
          }
        }
      }
      // fill lang-specific names if null and if a default name exists
      if (fProps.name.value !== null) {
        for (let lang of sharedConstants.LANGS) {
          let fPopLng = fProps[`name_${lang}`];
          if (fPopLng != null && fPopLng.value === null) {
            fPopLng.value = fProps.name.value;
            fPopLng.source_name = fProps.name.source_name;
            fPopLng.source_url = fProps.name.source_url;
            fPopLng.status = PROP_STATUS_INFO;
            if (fProps.name.comments === '') {
              fPopLng.comments = 'Value taken from default language.';
            } else {
              fPopLng.comments = fProps.name.comments;
            }
          }
        }
      }
    }
    resolve(fountainArr);
  });
}

export function fillInMissingWikidataFountains(
  osm_fountains: FountainConfig[],
  wikidata_fountains: FountainConfig[],
  dbg: string
): Promise<FountainConfigCollection> {
  // Created for #212. This function should run before conflation. It checks if all Wikidata
  // fountains referenced in OSM have been fetched, and fetches any missing wikidata fountains.
  // It returns the original OSM fountain collection and the completed Wikidata fountain collection.

  return new Promise((resolve) => {
    // Get list of all Wikidata fountain qids referenced by OSM
    let qid_from_osm = _.compact(_.map(osm_fountains, (f) => _.get(f, ['properties', 'wikidata'])));
    if (process.env.NODE_ENV !== 'production') {
      l.info(
        'processing.service.js fillInMissingWikidataFountains osm_fountains ' +
          osm_fountains.length +
          ', qid_from_osm ' +
          qid_from_osm.length +
          ' ' +
          dbg
      );
    }
    // Get list of all Wikidata fountain qids collected
    let qid_from_wikidata = _.map(wikidata_fountains, 'id');
    if (process.env.NODE_ENV !== 'production') {
      l.info(
        'processing.service.js fillInMissingWikidataFountains qid_from_wikidata ' + qid_from_wikidata.length + ' ' + dbg
      );
    }

    // Get qids not included in wikidata collection
    let missing_qids = _.difference(qid_from_osm, qid_from_wikidata);
    if (null == missing_qids || 0 == missing_qids.length) {
      l.info('processing.service.js fillInMissingWikidataFountains: none for ' + dbg);
      resolve({
        osm: osm_fountains,
        wikidata: wikidata_fountains,
      });
    }
    l.info(
      'processing.service.js fillInMissingWikidataFountains: ' +
        missing_qids.length +
        ' for ' +
        dbg +
        ' ' +
        missing_qids
    );

    // Fetch fountains with missing qids and add them to the wikidata_fountains collection
    WikidataService.byIds(missing_qids, dbg).then((missing_wikidata_fountains: FountainConfig[]) => {
      resolve({
        osm: osm_fountains,
        wikidata: missing_wikidata_fountains.concat(wikidata_fountains),
      });
    });
  });
}
