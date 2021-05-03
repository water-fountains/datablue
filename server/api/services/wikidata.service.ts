/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import axios, { AxiosPromise } from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import * as _ from 'lodash';
import wdk from 'wikidata-sdk';
import sharedConstants from '../../common/shared-constants';
import { Fountain } from '../../common/typealias';
import { MediaWikiEntityCollection, MediaWikiEntity, MediaWikiSimplifiedEntity } from '../../common/wikimedia-types';

// Set up caching of http requests
const http = axios.create({
  headers: { 'Cache-Control': 'no-cache' },
  // cache enabled by default, we always have an adapter, hence
  adapter: cacheAdapterEnhancer(
    axios.defaults.adapter ??
      (() => {
        throw new Error('illegal state, axios.defaults has not defined an adapter');
      })()
  ),
});

class WikidataService {
  idsByCenter(lat: number, lng: number, radius = 10, locationName: string): Promise<string[]> {
    // fetch fountain from OSM by coordinates, within radius in meters
    const sparql = `
        SELECT ?place
        WHERE
        {
          SERVICE wikibase:around {
            # this service allows points around a center point to be queried (https://en.wikibooks.org/wiki/SPARQL/SERVICE_-_around_and_box) 
            ?place wdt:P625 ?location .
            bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral.
            bd:serviceParam wikibase:radius "${radius / 1000}".
          }.

          
          # The results of the spatial query are limited to instances or subclasses of water well (Q43483) or fountain (Q483453)
          FILTER (EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q483453 }).

          # the wikibase:label service allows the label to be returned easily. The list of languages provided are fallbacks: if no English label is available, use German etc.
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "en,de,fr,it,tr" .
          }
        }`;
    const res = doSparqlRequest(sparql, locationName, 'idsByCenter');
    return res;
  }

  idsByBoundingBox(
    latMin: number,
    lngMin: number,
    latMax: number,
    lngMax: number,
    locationName: string
  ): Promise<string[]> {
    const sparql = `
        SELECT ?place
        WHERE
        {
          SERVICE wikibase:box {
            # this service allows points within a box to be queried (https://en.wikibooks.org/wiki/SPARQL/SERVICE_-_around_and_box) 
            ?place wdt:P625 ?location .
            bd:serviceParam wikibase:cornerWest "Point(${lngMin} ${latMin})"^^geo:wktLiteral.
            bd:serviceParam wikibase:cornerEast "Point(${lngMax} ${latMax})"^^geo:wktLiteral.
          } .
          
          # The results of the spatial query are limited to instances or subclasses of water well (Q43483) or fountain (Q483453)
          FILTER (EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q483453 }).
          
          # the wikibase:label service allows the label to be returned easily. The list of languages provided are fallbacks: if no English label is available, use German etc.
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "en,de,fr,it,tr" .
          }
        }`;
    const res = doSparqlRequest(sparql, locationName, 'idsByBoundingBox');
    return res;
  }

  byIds(qids: string[], locationName: string): Promise<MediaWikiSimplifiedEntity[]> {
    // fetch fountains by their QIDs
    const chunkSize = 50; // how many fountains should be fetched at a time (so as to not overload the server)
    return new Promise((resolve, reject) => {
      const httpPromises: AxiosPromise<MediaWikiEntityCollection>[] = [];
      let chunkCount = 0;
      try {
        chunk(qids, chunkSize).forEach(qidChunk => {
          chunkCount++;
          if (chunkSize * chunkCount > qids.length) {
            l.info('wikidata.service.js byIds: chunk ' + chunkCount + ' for ' + locationName);
          }
          // create sparql url
          const url = wdk.getEntities({
            ids: qidChunk,
            format: 'json',
            props: [],
          });
          // get data
          httpPromises.push(http.get<MediaWikiEntityCollection>(url));
        });
        // wait for http requests for all chunks to resolve
        Promise.all(httpPromises)
          .then(responses => {
            l.info(
              'wikidata.service.js byIds: ' +
                chunkCount +
                ' chunks of ' +
                chunkSize +
                ' prepared for loc "' +
                locationName +
                '"'
            );
            // holder for data of all fountains
            let dataAll: MediaWikiSimplifiedEntity[] = [];
            responses.forEach(r => {
              // holder for data from each chunk
              //TODO should be typed as soon as we update wikidata-sdk to the latest version
              const data: MediaWikiSimplifiedEntity[] = [];
              for (const key in r.data.entities) {
                // simplify object structure of each wikidata entity and add it to 'data'
                const entity: MediaWikiSimplifiedEntity = wdk.simplify.entity(r.data.entities[key], {
                  // keep qualifiers when simplifying (qualifiers are needed for the operator id)
                  keepQualifiers: true,
                });
                data.push(entity);
              }
              // concatenate the fountains from each chunk into "dataAll"
              dataAll = dataAll.concat(data);
            });
            if (1 == chunkCount) {
              let dataAllSize = -1;
              if (null != dataAll) {
                dataAllSize = dataAll.length;
              }
              l.info('wikidata.service.js byIds: dataAll ' + dataAllSize + ' for loc "' + locationName + '"');
            }
            // return dataAll to
            //TODO @ralfhauser that's a smell, we should not use the resolve of an outer promise
            resolve(dataAll);
          })
          .catch(e => {
            l.error('wikidata.service.js byIds: catch e ' + e.stack + ' for loc "' + locationName + '"');
            //TODO that's a smell, we should not use the reject of an outer promise
            reject(e);
          });
      } catch (error: any) {
        l.error('wikidata.service.js byIds: catch error ' + error.stack + ' for loc "' + locationName + '"');
        reject(error);
      }

      // return data
    });
  }

  fillArtistName(fountain: Fountain, dbg: string): Promise<Fountain> {
    // created for proximap/#129
    // intialize
    const artistName = fountain.properties.artist_name;
    if (null != artistName.derived && null != artistName.derived.name && '' != artistName.derived.name.trim()) {
      l.info('wikidata.service.js fillArtistName: already set "' + artistName.derived.name + '"');
      return new Promise(resolve => resolve(fountain));
    }
    artistName.derived = {
      website: {
        url: null,
        wikidata: null,
      },
      name: null,
    };
    dbg += ' ' + fountain.properties.name.value;
    const idWd = fountain.properties.id_wikidata.value;
    // if there is a wikidata entity, then fetch more information with a query
    if (artistName.source === 'wikidata') {
      if (null == idWd) {
        l.info('wikidata.service.js fillArtistName: null == idWd');
      }
      const qid = artistName.value;
      if (null == qid) {
        l.info('wikidata.service.js fillArtistName: null == qid for "' + idWd + '"');
        return new Promise(resolve => resolve(fountain));
      }
      if (0 == qid.trim().length) {
        l.info('wikidata.service.js fillArtistName: blank qid for "' + idWd + '"');
        return new Promise(resolve => resolve(fountain));
      }

      // enter wikidata url
      artistName.derived.website.wikidata = `https://www.wikidata.org/wiki/${qid}`;

      //TODO @ralfhauser the following variables did not exist before but are used below. Maybe the reason why proximap#212 exists?
      const lngMin = undefined;
      const latMin = undefined;
      const lngMax = undefined;
      const latMax = undefined;
      const locationName = 'undefined';

      const newQueryMiro = false;
      if (newQueryMiro) {
        const sparql = `
        SELECT ?place
        WHERE
        {
          SERVICE wikibase:box {
            # this service allows points within a box to be queried (https://en.wikibooks.org/wiki/SPARQL/SERVICE_-_around_and_box) 
            ?place wdt:P625 ?location .
            bd:serviceParam wikibase:cornerWest "Point(${lngMin} ${latMin})"^^geo:wktLiteral.
            bd:serviceParam wikibase:cornerEast "Point(${lngMax} ${latMax})"^^geo:wktLiteral.
          } .
          
          # The results of the spatial query are limited to instances or subclasses of water well (Q43483) or fountain (Q483453)
          FILTER (EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q483453 }).
          
          # the wikibase:label service allows the label to be returned easily. The list of languages provided are fallbacks: if no English label is available, use German etc.
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "en,de,fr,it,tr" .
          }
        }`;
        const res = doSparqlRequest(sparql, locationName, 'fillArtistName');
        l.info('wikidata.service.js fillArtistName: new Miro response ' + res + ' "' + idWd + '"');
      }

      // create sparql query url
      const url = wdk.getEntities({
        // make sparql query more precise: https://github.com/water-fountains/proximap/issues/129#issuecomment-597785180
        ids: [qid],
        format: 'json',
        props: ['labels', 'sitelinks', 'claims'],
      });
      //      l.debug(url);
      // get data
      let eQid: MediaWikiEntity | undefined = undefined;
      return (
        http
          .get<MediaWikiEntityCollection>(url)
          // parse into an easier to read format
          .then(r => {
            const data = r.data;
            const entities = data.entities;
            if (null == entities) {
              l.info('wikidata.service.js fillArtistName: null == entities "' + qid + '" for idWd "' + idWd + '"');
              return fountain;
            }
            l.info('wikidata.service.js fillArtistName: null != entities "' + qid + '" for idWd "' + idWd + '"');
            eQid = entities[qid];
            if (undefined === eQid) {
              l.info('wikidata.service.js fillArtistName: null == eQid "' + qid + '" for idWd "' + idWd + '"');
              return fountain;
            }
            l.info(
              'wikidata.service.js fillArtistName: about to wdk.simplify.entity eQid "' +
                eQid +
                '", qid  "' +
                qid +
                '" for idWd "' +
                idWd +
                '"'
            );
            const simplified = wdk.simplify.entity(eQid, { keepQualifiers: true });
            l.info(
              'wikidata.service.js fillArtistName: after wdk.simplify.entity eQid "' +
                eQid +
                '", qid "' +
                qid +
                '" for idWd "' +
                idWd +
                '"'
            );
            return simplified;
          })
          // extract useful data for https://github.com/water-fountains/proximap/issues/163
          .then(entity => {
            l.info(
              'wikidata.service.js fillArtistName: after2 wdk.simplify.entity eQid "' +
                eQid +
                '", qid "' +
                qid +
                '" for idWd "' +
                idWd +
                '"'
            );
            // Get label of artist in English
            if (null == entity) {
              l.info(
                'wikidata.service.js fillArtistName: null == entity after wdk.simplify "' +
                  qid +
                  '" for idWd "' +
                  idWd +
                  '"  "' +
                  url +
                  '"'
              );
              return fountain;
            }
            const langs = Object.keys(entity.labels);
            let artName = null;
            if (langs.indexOf('en') >= 0) {
              artName = entity.labels.en;
            } else {
              // Or get whatever language shows up first
              artName = entity.labels[langs[0]];
            }
            //artNam.value = artName;
            artistName.derived.name = artName;
            // Try to find a useful link
            // Look for Wikipedia entry in different languages
            for (const lang of sharedConstants.LANGS) {
              if (Object.prototype.hasOwnProperty.call(entity.sitelinks, lang + 'wiki')) {
                artistName.derived.website.url = `https://${lang}.wikipedia.org/wiki/${
                  entity.sitelinks[lang + 'wiki']
                }`;
                l.info(
                  'wikidata.service.js fillArtistName: found url ' +
                    artistName.derived.website.url +
                    ' - eQid "' +
                    eQid +
                    '", qid "' +
                    qid +
                    '" for idWd "' +
                    idWd +
                    '"'
                );
                return fountain;
              }
            }
            // for https://github.com/water-fountains/proximap/issues/163
            // Official website P856 // described at URL P973 // reference URL P854 // URL P2699
            l.info(
              'wikidata.service.js fillArtistName: as no langWiki URLs found, going for P856, P973, P854, P2699 - eQid "' +
                eQid +
                '", qid "' +
                qid +
                '" for idWd "' +
                idWd +
                '"'
            );
            for (const pid of ['P856', 'P973', 'P854', 'P2699']) {
              // get the url value if the path exists
              const url = _.get(entity.claims, [pid, 0, 'value'], false);
              if (url) {
                artistName.derived.website.url = url;
                l.info(
                  'wikidata.service.js fillArtistName: found url ' +
                    artistName.derived.website.url +
                    ' based on pid ' +
                    pid +
                    ' - eQid "' +
                    eQid +
                    '", qid "' +
                    qid +
                    '" for idWd "' +
                    idWd +
                    '"'
                );
                return fountain;
              }
              l.info(
                'wikidata.service.js fillArtistName: url not found for ' +
                  pid +
                  ' - eQid "' +
                  eQid +
                  '", qid "' +
                  qid +
                  '" for idWd "' +
                  idWd +
                  '"'
              );
            }
            // if no url found, then link to wikidata entry
            return fountain;
          })
          .catch(err => {
            // https://github.com/maxlath/wikibase-sdk/issues/64 or rather https://phabricator.wikimedia.org/T243138 creator of https://www.wikidata.org/wiki/Q76901204  ("Europuddle" in ch-zh)
            // report error to log and save to data
            l.error(`wikidata.service.ts fillArtistName: Error collecting artist name and url from wikidata: ` + dbg);
            l.info(`stack: ${err.stack}`);
            l.info(`url: ${url}\n`);
            artistName.issues.push({
              data: err,
              context: {
                fountain_name: fountain.properties.name.value,
                property_id: 'artist_name',
                id_osm: fountain.properties.id_osm.value,
                id_wikidata: fountain.properties.id_wikidata.value,
              },
              timeStamp: new Date(),
              type: 'data_processing',
              level: 'error',
              message: `Failed to fetch Wikidata artist name entity information. Url: ${url} ` + dbg,
            });
            return fountain;
          })
      );
    } else {
      l.info('wikidata.service.js fillArtistName: source ' + artistName.source + ' "' + dbg + '"');
      return new Promise(resolve => resolve(fountain));
    }
  }

  fillOperatorInfo(fountain: Fountain, dbg: string): Promise<Fountain> {
    // created for proximap/#149
    const opNam = fountain.properties.operator_name;
    if (null != opNam && null != opNam.derived && null != opNam.derived.name && 0 < opNam.derived.name.trim().length) {
      l.info('wikidata.service.js fillOperatorInfo: already set "' + opNam.derived.name + '"');
      return new Promise(resolve => resolve(fountain));
    }
    if (opNam.source === 'wikidata') {
      // create sparql url to fetch operator information from QID
      const qid = opNam.value;
      const url = wdk.getEntities({
        ids: [qid],
        format: 'json',
        props: ['labels', 'sitelinks', 'claims'],
      });
      // l.debug(url);
      // get data
      return (
        http
          .get(url)
          // parse into an easier to read format
          .then(r => {
            if (null == r || null == r.data || null == r.data.entities) {
              l.info(
                'wikidata.service.js fillOperatorInfo: null == r || null == r.data  || null == r.data.entities for "' +
                  url +
                  '"'
              );
              return fountain;
            }
            const eQid = r.data.entities[qid];
            if (null == eQid) {
              l.info('wikidata.service.js fillOperatorInfo: null == eQid "' + qid + '" for "' + dbg + '"');
              return fountain;
            }
            return wdk.simplify.entity(eQid, { keepQualifiers: true });
          })
          // extract useful data
          .then(entity => {
            if (null == entity) {
              l.info(
                'wikidata.service.js fillOperatorInfo: null == entity after wdk.simplify "' +
                  qid +
                  '" for dbg "' +
                  dbg +
                  '"'
              );
              return fountain;
            }
            // Get label of operator in English
            const langs = Object.keys(entity.labels);
            opNam.derived = {
              name: '',
              url: '',
              qid: qid,
            };
            if (langs.indexOf('en') >= 0) {
              opNam.derived.name = entity.labels.en;
            } else {
              // Or get whatever language shows up first
              opNam.derived.name = entity.labels[langs[0]];
            }
            // Try to find a useful link
            // Official website P856 // described at URL P973 // reference URL P854 // URL P2699
            let url = null;
            for (const pid of ['P856', 'P973', 'P854', 'P2699']) {
              // get the url value if the path exists
              url = _.get(entity.claims, [pid, 0, 'value'], false);
              if (url) {
                break;
              }
            }
            opNam.derived.url = url;
            return fountain;
          })
          .catch(err => {
            l.error(`wikidata.service.ts fillOperatorInfo: Error collecting operator info name: ${err.stack} ` + dbg);
            const errInfo = '(lookup unsuccessful)';
            if (opNam.value && -1 == opNam.value.indexOf(errInfo)) {
              opNam.value = opNam.value + errInfo;
            }
            return fountain;
          })
      );
    } else {
      return new Promise(resolve => resolve(fountain));
    }
  }
}

function chunk<T>(arr: T[], len: number): T[][] {
  const chunks: T[][] = [];
  const n = arr.length;
  let i = 0;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
}

function doSparqlRequest(sparql: string, location: string, dbg: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // create url from SPARQL
    const url = wdk.sparqlQuery(sparql);

    // get data
    //TODO type with correct wikidata-sdk type
    axios
      .get(url)
      .then(res => {
        if (res.status !== 200) {
          const error = new Error(
            `wikidata.service.ts doSparqlRequest Request to Wikidata Failed. Status Code: ${res.status}. Status Message: ${res.statusText}. Url: ${url}`
          );
          l.error('wikidata.service.js doSparqlRequest: ' + dbg + ',  location ' + location + ' ' + error.message);
          // consume response data to free up memory
          // TODO @ralfhauser, resume does not exist
          // res.resume();
          return reject(error);
        }

        try {
          const simplifiedResults = wdk.simplifySparqlResults(res.data);
          l.info(
            'wikidata.service.js doSparqlRequest: ' +
              dbg +
              ',  location ' +
              location +
              ' ' + //+simplifiedResults+' '
              simplifiedResults.length +
              ' ids found for ' +
              location
          );
          resolve(simplifiedResults);
        } catch (e: any) {
          l.error(
            'wikidata.service.js doSparqlRequest: Error occurred simplifying wikidata results.' +
              e.stack +
              ' ' +
              dbg +
              ',  location ' +
              location
          );
          reject(e);
        }
      })
      .catch(error => {
        l.error(
          `'wikidata.service.js doSparqlRequest: Request to Wikidata Failed. Url: ${url}` +
            ' ' +
            dbg +
            ',  location ' +
            location
        );
        reject(error);
      });
  });
}

export default new WikidataService();
