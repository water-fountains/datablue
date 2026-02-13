/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import { fountain_property_metadata, get_prop } from '../../../config/fountain.properties';
import {
  PROP_STATUS_ERROR,
  PROP_STATUS_FOUNTAIN_NOT_EXIST,
  PROP_STATUS_NOT_AVAILABLE,
  PROP_STATUS_NOT_DEFINED,
  PROP_STATUS_OK,
} from '../../common/constants';

import _ from 'lodash';
import haversine from 'haversine';
import {
  Fountain,
  FountainConfig,
  FountainConfigCollection,
  FountainConfigProperties,
  FountainConfigProperty,
  NamedSources,
  Source,
  SourceConfig,
} from '../../common/typealias';
import { MediaWikiSimplifiedEntity } from '../../common/wikimedia-types';

// wikidata property paths: path for accessing the wikidata QID of a fountain, either in the query result of wikidata or the query result from OSM
const idwd_path_wd = fountain_property_metadata.id_wikidata.src_config.wikidata.src_path;
const idwd_path_osm = fountain_property_metadata.id_wikidata.src_config.osm.src_path;

// This service finds matching fountains from osm and wikidata
// and merges their properties

export function conflate(fountains: FountainConfigCollection, dbg: string, debugAll: boolean): Promise<Fountain[]> {
  return new Promise(resolve => {
    const conflated = {
      wikidata: new Array<FountainConfigProperties>(),
      coord: new Array<FountainConfigProperties>(),
    };

    // Only try to find matching fountains if both lists contain fountains
    // (sometimes one of the lists is empty)
    if (fountains.osm.length > 0 && fountains.wikidata.length > 0) {
      // first conflate by wikidata identifiers (QID)
      conflated.wikidata = conflateByWikidata(fountains, dbg, debugAll);

      // then conflate by coordinates
      conflated.coord = conflateByCoordinates(fountains, dbg, debugAll);
    }

    // process remaining fountains that were not matched by either QID or coordinates
    const unmatched = {
      osm: Array<FountainConfigProperties>(),
      wikidata: Array<FountainConfigProperties>(),
    };
    unmatched.osm = _.map(fountains.osm, f_osm => {
      return mergeFountainProperties({ osm: f_osm, wikidata: null }, 'unmatched.osm', null, debugAll, dbg);
    });
    unmatched.wikidata = _.map(fountains.wikidata, f_wd => {
      return mergeFountainProperties({ osm: null, wikidata: f_wd }, 'unmatched.wikidata', null, debugAll, dbg);
    });

    // append the matched (conflated) and unmatched fountains to the list "conflated_fountains_all"
    const conflated_fountains_all = _.concat(conflated.coord, conflated.wikidata, unmatched.osm, unmatched.wikidata);

    // return fountains (first turn list of fountains into geojson)
    resolve(properties2GeoJson(conflated_fountains_all));
  });
}

/**
 * This function finds matching pairs of fountains between osm and wikidata. It returns the list of matches and removes the matched fountains from the 'ftns' argument
 * @param {Object} fountains - Object (passed by reference) with two properties: 'osm' is a list of fountains returned from OSM and 'wikidata' is list from wikidata
 */
function conflateByWikidata(
  fountains: FountainConfigCollection,
  dbg: string,
  debugAll: boolean
): FountainConfigProperties[] {
  // Holder for conflated (matched) fountains
  const conflated_fountains: FountainConfigProperties[] = [];
  // Holders for matched fountain indexes
  const matched_idx_osm: number[] = [];
  const matched_idx_wd: number[] = [];
  if (debugAll) {
    l.info('conflate.data.service.js conflateByWikidata: ' + fountains + ' ftns ' + dbg);
  }
  // loop through OSM fountains
  for (const [idx_osm, f_osm] of fountains.osm.entries()) {
    // find the index of the fountain in the wikidata list with a wikidata QID that matches the wikidata id referenced in OSM
    const idx_wd = _.findIndex(fountains.wikidata, f_wd => {
      return _.get(f_osm, idwd_path_osm, 0) === _.get(f_wd, idwd_path_wd, 1); // check for match. Use default values 0 and 1 to ensure no match if no data is found
    });
    // if a match was found
    if (idx_wd >= 0) {
      // compute distance between the two fountains
      let mergeDistance: number | null = null;
      try {
        mergeDistance = haversine(
          get_prop(fountains.osm[idx_osm], 'osm', 'coords'),
          get_prop(fountains.wikidata[idx_wd], 'wikidata', 'coords'),
          {
            unit: 'meter',
            format: '[lon,lat]',
          }
        );
      } catch (e: unknown) {
        // some wikidata fountains have no coordinates, so distance cannot be calculated. That is ok.
      }
      // merge the two fountains' properties and add to "conflated_fountains" list
      conflated_fountains.push(
        mergeFountainProperties(
          {
            osm: fountains.osm[idx_osm],
            wikidata: fountains.wikidata[idx_wd],
          },
          'merged by wikidata id',
          mergeDistance,
          debugAll,
          dbg
        )
      );
      // document the indexes of the matched fountains so the fountains can be removed from the lists
      matched_idx_osm.push(idx_osm);
      matched_idx_wd.push(idx_wd);
    }
  }

  // remove matched fountains from lists
  cleanFountainCollections(fountains, matched_idx_osm, matched_idx_wd, debugAll, dbg);

  return conflated_fountains;
}

/**
 * remove matched fountains from 'ftns' (remove in reverse order to not mess up indexes)
 * @param {Object} fountains - Object (passed by reference) with two properties: 'osm' is a list of fountains returned from OSM and 'wikidata' is list from wikidata
 * @param {[number]} matched_idx_osm - List of matched OSM IDs
 * @param {[number]} matched_idx_wd - List of matched wikidata IDs
 */
function cleanFountainCollections(
  fountains: FountainConfigCollection,
  matched_idx_osm: number[],
  matched_idx_wd: number[],
  debugAll: boolean,
  dbg: string
): void {
  if (debugAll) {
    l.info('conflate.data.service.js cleanFountainCollections: ' + fountains + ' ftns ' + dbg);
  }
  matched_idx_osm = _.orderBy(matched_idx_osm);
  for (let i = matched_idx_osm.length - 1; i >= 0; i--) fountains.osm.splice(matched_idx_osm[i], 1);

  matched_idx_wd = _.orderBy(matched_idx_wd);
  for (let i = matched_idx_wd.length - 1; i >= 0; i--) fountains.wikidata.splice(matched_idx_wd[i], 1);
  // console.log(r.osm.length);
}

/**
 * Find matching fountains based on coordinates alone
 * @param {Object} foutains - Object (passed by reference) with two properties: 'osm' is a list of fountains returned from OSM and 'wikidata' is list from wikidata
 */
function conflateByCoordinates(
  foutains: FountainConfigCollection,
  dbg: string,
  debugAll: boolean
): FountainConfigProperties[] {
  if (debugAll) {
    l.info('conflate.data.service.js conflateByCoordinates: ' + foutains + ' ftns ' + dbg);
  }
  // Holder for conflated fountains
  const conflated_fountains: FountainConfigProperties[] = [];
  // Temporary holders for matched fountain indexes
  const matched_idx_osm: number[] = [];
  const matched_idx_wd: number[] = [];

  // make ordered list of coordinates from all Wikidata fountains
  const coords_all_wd = _.map(foutains.wikidata, f_wd => {
    return get_prop(f_wd, 'wikidata', 'coords');
  });
  l.info(foutains.wikidata.length + ' fountains conflateByCoordinates ' + dbg);
  // Loop through OSM fountains
  // todo: loop through wikidata fountains instead, since this is the more incomplete list the matching will go much faster
  for (const [idx_osm, f_osm] of foutains.osm.entries()) {
    // compute distance array between OSM fountain and all wikidata fountains
    const coords_osm = get_prop(f_osm, 'osm', 'coords');
    const distances: number[] = _.map(coords_all_wd, c_wd => {
      return haversine(c_wd, coords_osm, {
        unit: 'meter',
        format: '[lon,lat]',
      });
    });
    // find the value and index of the smallest distance
    const dMin = _.min(distances) ?? Number.MAX_VALUE;
    const idx_wd = _.indexOf(distances, dMin);
    // selection criteria: dMin smaller than 10 meters
    if (dMin < 10) {
      // conflate the two fountains
      conflated_fountains.push(
        mergeFountainProperties(
          {
            osm: foutains.osm[idx_osm],
            wikidata: foutains.wikidata[idx_wd],
          },
          `merged by location`,
          dMin,
          debugAll,
          dbg
        )
      );
      // document the indexes for removal
      matched_idx_osm.push(idx_osm);
      matched_idx_wd.push(idx_wd);
      //todo: if matching is ambiguous, add a note for community
    }
  }
  // remove matched fountains from lists
  cleanFountainCollections(foutains, matched_idx_osm, matched_idx_wd, debugAll, dbg);

  return conflated_fountains;
}

function mergeFountainProperties(
  namedFountainConfig: NamedSources<MediaWikiSimplifiedEntity | null, FountainConfig | null>,
  mergeNotes = '',
  mergeDistance: number | null = null,
  debugAll: boolean,
  dbg: string
): FountainConfigProperties {
  if (debugAll) {
    l.info(
      'conflate.data.service.js mergeFountainProperties: ' +
        namedFountainConfig +
        ' fountains, ' +
        mergeNotes +
        ' ' +
        dbg
    );
  }
  // combines fountain properties from osm and wikidata
  // For https://github.com/water-fountains/proximap/issues/160 we keep values from both sources when possible
  const mergedProperties = {};
  // loop through each property in the metadata
  _.forEach(fountain_property_metadata, metadata => {
    // fountain template with default property values copied in
    const temp: FountainConfigProperty = {
      id: metadata.id,
      value: metadata.value,
      comments: metadata.comments,
      status: metadata.status,
      source: '',
      type: metadata.type,
      issues: [],
      sources: {
        osm: {
          status: null,
          raw: null,
          extracted: null,
          comments: [],
        },
        wikidata: {
          status: null,
          raw: null,
          extracted: null,
          comments: [],
        },
      },
    };

    // loop through sources (osm and wikidata) and extract values
    for (const src_name of ['wikidata', 'osm']) {
      const fountain: FountainConfig = namedFountainConfig[src_name];
      const tmp: Source = temp.sources[src_name];
      if (metadata.src_config[src_name] === null) {
        // If property not available, define property as not available for source
        tmp.status = PROP_STATUS_NOT_AVAILABLE;
      } else if (!fountain) {
        // If fountain doesn't exist for that source (e.g. the fountain is only defined in osm, not wikidata), mark status
        tmp.status = PROP_STATUS_FOUNTAIN_NOT_EXIST;
      } else {
        // if property is available (fundamentally) for source, try to get it

        // get extraction information (how to extract property from source)
        const cfg: SourceConfig<any, string> = metadata.src_config[src_name];

        // Get value of property from source
        let value = _.get(fountain, cfg.src_path, null);
        if (value === null && cfg.src_path1 !== undefined && Object.prototype.hasOwnProperty.call(cfg, 'src_path1')) {
          value = _.get(fountain, cfg.src_path1, null);
        }
        //TODO @ralfhauser, src_path2 never exists on SourceConfig, old obselete code?
        // if(value === null && cfg.src_path2 !== undefined && cfg.hasOwnProperty('src_path2')){
        //     value = _.get(fountain, cfg.src_path2, null);
        // }
        let useExtra = false;
        // If value is null and property has an additional source of data (e.g., wiki commons for #155), use that
        if (
          value === null &&
          cfg.src_path_extra !== undefined &&
          Object.prototype.hasOwnProperty.call(cfg, 'src_path_extra')
        ) {
          value = _.get(fountain, cfg.src_path_extra, null);
          useExtra = true;
        }

        // If a value was obtained, try to process it
        if (value !== null) {
          // save raw value
          tmp.raw = value;
          try {
            // use one translation (or the alternative translation if the additional data source was used)
            if (useExtra && cfg.value_translation_extra !== undefined) {
              tmp.extracted = cfg.value_translation_extra(value);
            } else {
              const v = cfg.value_translation(value);
              tmp.extracted = v;
              if ('wiki_commons_name' == temp.id) {
                if (cfg.src_path_extra !== undefined && Object.prototype.hasOwnProperty.call(cfg, 'src_path_extra')) {
                  const valueE = _.get(fountain, cfg.src_path_extra, null);
                  if (null != valueE && null != v && 0 < valueE.trim().length) {
                    const catSet = new Set();
                    for (const c of v) {
                      catSet.add(c.c);
                    }
                    let vE: any | null = null;
                    if (cfg.value_translation_extra !== undefined) {
                      vE = cfg.value_translation_extra(valueE);
                    }
                    if (null != vE && 0 < vE.length) {
                      const vE0c = vE[0].c; //TODO if there is more than 1, for-loop
                      if (null != vE && !catSet.has(vE0c)) {
                        v.push(...vE);
                        if (debugAll) {
                          l.info(
                            `conflate.data.service.js: got additional category for "${metadata.id}" from "${src_name}"`
                          );
                        }
                      }
                    }
                  }
                }
              }
            }
            // if extracted value is not null, change status to ok
            if (tmp.extracted !== null) {
              tmp.status = PROP_STATUS_OK;
            }
          } catch (err: any) {
            tmp.status = PROP_STATUS_ERROR;
            const warning = `conflate.data.service.js: Lost in translation of "${metadata.id}" from "${src_name}": ${err.stack}`;
            tmp.comments.push(warning);
            l.error(warning);
          }
        } else {
          // If no property data was found, set status to "not defined"
          tmp.status = PROP_STATUS_NOT_DEFINED;
        }
        if ('osm' == src_name && 'featured_image_name' == metadata.id) {
          const osmProps = fountain.properties;
          if (null != osmProps) {
            const osmImgs: any[] = [];
            if (null != osmProps.image) {
              const v = cfg.value_translation(osmProps.image);
              if (null != v) {
                osmImgs.push(v);
              }
            }
            if (null != osmProps.wikimedia_commons) {
              const v = cfg.value_translation(osmProps.wikimedia_commons);
              if (null != v) {
                osmImgs.push(v);
              }
            }
            const imgsSoFar = new Set();
            if (null != tmp.extracted && null != tmp.extracted.imgs) {
              for (const v of tmp.extracted.imgs) {
                imgsSoFar.add(v.value);
              }
            } else {
              tmp.extracted = { src: 'osm', imgs: [], type: 'unk' };
            }
            for (const v0 of osmImgs) {
              for (const v of v0.imgs) {
                if (!imgsSoFar.has(v.value)) {
                  tmp.extracted.imgs.push(v);
                  tmp.status = PROP_STATUS_OK;
                  l.info('conflate mergeProps added img "' + v.value + '" typ ' + v.typ);
                }
              }
            }
            if (0 < tmp.extracted.imgs.length) {
              //test with ch-zh Q27230145 or rather node/1415970706
              for (const pSrc_name of metadata.src_pref) {
                // add the osm images to wikidata if that is the preferred source
                const tmpSrc = temp.sources[pSrc_name];
                if (tmpSrc.status === PROP_STATUS_OK && pSrc_name != src_name) {
                  const pTmp = tmpSrc.extracted;
                  if (null != pTmp && null != pTmp.imgs && 0 < pTmp.imgs.length) {
                    const pImgsSoFar = new Set();
                    for (const pV of pTmp.imgs) {
                      pImgsSoFar.add(pV.value.replace(/ /g, '_'));
                    }
                    for (const vO of tmp.extracted.imgs) {
                      if (!pImgsSoFar.has(vO.value)) {
                        pTmp.imgs.push(vO);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Get preferred value to display
    for (const src_name of metadata.src_pref) {
      // check if value is available
      if (temp.sources[src_name].status === PROP_STATUS_OK) {
        temp.value = temp.sources[src_name].extracted;
        temp.status = PROP_STATUS_OK;
        temp.source = src_name;
        break; // stop looking for data
      }
    }

    // Add merged property to object
    mergedProperties[metadata.id] = temp;
  });
  // process panorama and image url
  //  addDefaultPanoUrls(mergedProperties);

  mergedProperties['conflation_info'] = {
    merge_notes: mergeNotes,
    merge_distance: mergeDistance,
    // document merge date for datablue/#20
    merge_date: new Date(),
  };

  return mergedProperties;
}

function properties2GeoJson(collection: FountainConfigProperties[]): Fountain[] {
  return _.map(collection, properties => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: properties.coords.value,
      },
      //TODO @ralfhauser most likely not necessary as we don't pass properties to other functions and we immediately resolve the request afterwards
      properties: _.cloneDeep(properties),
    };
  });
}
