/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "./constants";
const https = require('https');
const axios = require('axios');
import { cacheAdapterEnhancer } from 'axios-extensions';
const _ = require ('lodash');
const wdk = require('wikidata-sdk');

// Set up caching of http requests
const http = axios.create({
  headers: { 'Cache-Control': 'no-cache' },
  // cache enabled by default
  adapter: cacheAdapterEnhancer(axios.defaults.adapter)
});

class WikidataService {
  idsByCenter(lat, lng, radius=10,locationName) {
    // fetch fountain from OSM by coordinates, within radius in meters
    const sparql = `
        SELECT ?place
        WHERE
        {
          SERVICE wikibase:around {
            # this service allows points around a center point to be queried (https://en.wikibooks.org/wiki/SPARQL/SERVICE_-_around_and_box) 
            ?place wdt:P625 ?location .
            bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral.
            bd:serviceParam wikibase:radius "${radius/1000}".
          }.

          
          # The results of the spatial query are limited to instances or subclasses of water well (Q43483) or fountain (Q483453)
          FILTER (EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place p:P31/ps:P31/wdt:P279* wd:Q483453 }).

          # the wikibase:label service allows the label to be returned easily. The list of languages provided are fallbacks: if no English label is available, use German etc.
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "en,de,fr,it,tr" .
          }
        }`;
    return doSparqlRequest(sparql,locationName);
  }
  
  idsByBoundingBox(latMin, lngMin, latMax, lngMax, locationName){
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
    return doSparqlRequest(sparql,locationName);
  }
  
  
  byIds(qids,locationName) {
    // fetch fountains by their QIDs
    const chunkSize = 50;  // how many fountains should be fetched at a time (so as to not overload the server)
    return new Promise((resolve, reject)=>{
      let allFountainData = [];
      let httpPromises = [];
	  let chkCnt = 0;
      try{
        chunk(qids, chunkSize).forEach(qidChunk=> {
        	chkCnt++;
        	if ((chunkSize*chkCnt)> qids.length) {
        		l.info('wikidata.service.js byIds: chunk '+chkCnt+' for '+locationName+' '+new Date().toISOString());	
        	}
          // create sparql url
          const url = wdk.getEntities({
            ids: qidChunk,
            format: 'json',
            props: []
          });
          // get data
          httpPromises.push(http.get(url));
        });
        // wait for http requests for all chunks to resolve
        Promise.all(httpPromises)
          .then(responses => {
            l.info('wikidata.service.js byIds: '+chkCnt+' chunks of '+chunkSize+' prepared for '+locationName+' '+new Date().toISOString());
            // holder for data of all fountains
            let dataAll = [];
            responses.forEach(r => {
              // holder for data from each chunk
              let data = [];
              for (let key in r.data.entities) {
                // simplify object structure of each wikidata entity and add it to 'data'
                data.push(wdk.simplify.entity(
                  r.data.entities[key],
                  {
                    // keep qualifiers when simplifying (qualifiers are needed for the operator id)
                    keepQualifiers: true
                  }));
              }
              // concatenate the fountains from each chunk into "dataAll"
              dataAll = dataAll.concat(data);
            });
            // return dataAll to 
            resolve(dataAll);
          })
          .catch(e=>{
            reject(e)
          });
      }catch (error){
        reject(error);
      }
      
      // return data
      
    })
  }
  
  fillArtistName(fountain,dbg){
    // created for proximap/#129
    let dbgHere = dbg + ' '+fountain.properties.id_wikidata.value;
    // intialize
    fountain.properties.artist_name.derived = {
      website: {
        url: null,
        wikidata: null,
      }
    };
    
    // if there is a wikidata entity, then fetch more information with a query
    if(fountain.properties.artist_name.source === 'wikidata'){
  
      let qid = fountain.properties.artist_name.value;
      
      // enter wikidata url
      fountain.properties.artist_name.derived.website.wikidata = `https://www.wikidata.org/wiki/${qid}`;
      
      // create sparql query url
      const url = wdk.getEntities({
        ids: [qid],
        format: 'json',
        props: ['labels', 'sitelinks', 'claims']
      });
      // l.debug(url);
      // get data
      return http.get(url)
      // parse into an easier to read format
        .then(r=>{
          return wdk.simplify.entity(
            r.data.entities[qid],
            {
              keepQualifiers: true
            })
        })
        // extract useful data for https://github.com/water-fountains/proximap/issues/163
        .then(entity=>{
          // Get label of artist in English
          let langs = Object.keys(entity.labels);
          if(langs.indexOf('en') >= 0){
            fountain.properties.artist_name.value = entity.labels.en;
          }else{
            // Or get whatever language shows up first
            fountain.properties.artist_name.value = entity.labels[langs[0]];
          }
          // Try to find a useful link
          // Look for Wikipedia entry in different languages
          for(let lang of ['en', 'fr', 'de', 'it', 'tr']){
            if(entity.sitelinks.hasOwnProperty(lang+'wiki')){
              fountain.properties.artist_name.derived.website.url = `https://${lang}.wikipedia.org/wiki/${entity.sitelinks[lang+'wiki']}`;
              return fountain;
            }
          }
          // for https://github.com/water-fountains/proximap/issues/163
          // Official website P856 // described at URL P973 // reference URL P854 // URL P2699
          for (let pid of ['P856', 'P973', 'P854', 'P2699'] ){
            // get the url value if the path exists
            let url = _.get(entity.claims, [pid, 0, 'value'], false);
            if(url){
              fountain.properties.artist_name.derived.website.url = url;
              return fountain;
            }
          }
          // if no url found, then link to wikidata entry
          return fountain;
        })
        .catch(err=>{
          // report error to log and save to data
          l.error(`wikidata.service.ts fillArtistName: Error collecting artist name and url from wikidata: `+dbgHere);
          l.info(`stack: ${err.stack}`);
          fountain.properties.artist_name.issues.push({
            data: err,
              context: {
              fountain_name: fountain.properties.name.value,
                property_id: 'artist_name',
                id_osm: fountain.properties.id_osm.value,
                id_wikidata: fountain.properties.id_wikidata.value
            },
            timeStamp: new Date(),
            type: 'data_processing',
              level: 'error',
              message: `Failed to fetch Wikidata entity information. Url: ${url} `+dbg,
          });
          return fountain});
    }else{
      return fountain;
    }
  }
  
  
  fillOperatorInfo(fountain, dbg){
    // created for proximap/#149
    if(fountain.properties.operator_name.source === 'wikidata'){
      // create sparql url to fetch operator information from QID
      let qid = fountain.properties.operator_name.value;
      const url = wdk.getEntities({
        ids: [qid],
        format: 'json',
        props: ['labels', 'sitelinks', 'claims']
      });
      // l.debug(url);
      // get data
      return http.get(url)
        // parse into an easier to read format
        .then(r=>{
          return wdk.simplify.entity(
          r.data.entities[qid],
          {
            keepQualifiers: true
          })
        })
        // extract useful data
        .then(entity=>{
          // Get label of operator in English
          let langs = Object.keys(entity.labels);
          if(langs.indexOf('en') >= 0){
            fountain.properties.operator_name.value = entity.labels.en;
          }else{
            // Or get whatever language shows up first
            fountain.properties.operator_name.value = entity.labels[langs[0]];
          }
          // Try to find a useful link
          // Official website P856 // described at URL P973 // reference URL P854 // URL P2699
          let url = null;
          for (let pid of ['P856', 'P973', 'P854', 'P2699'] ){
            // get the url value if the path exists
            url = _.get(entity.claims, [pid, 0, 'value'], false);
            if(url){
              break;
            }
          }
          fountain.properties.operator_name.derived = {
            url: url,
            qid: qid
          };
          return fountain;
        })
        .catch(err=>{
          l.error(`Error collecting operator info name: ${err} `+dbg);
          fountain.properties.operator_name.value = fountain.properties.operator_name.value + '(lookup unsuccessful)';
          return fountain});
    }else{
      return fountain;
    }
  }
}


function chunk (arr, len) {
  
  let chunks = [],
    i = 0,
    n = arr.length;
  
  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }
  
  return chunks;
}

function doSparqlRequest(sparql, location){
  return new Promise((resolve, reject)=> {
    // create url from SPARQL
    const url = wdk.sparqlQuery(sparql);
    
    // get data
    let request = axios.get(url)
        .then(res => {

      if (res.status !== 200) {
        let error = new Error(`Request to Wikidata Failed. Status Code: ${res.status}. Status Message: ${res.statusMessage}. Url: ${url}`);
        l.error(error.message+' '+new Date().toISOString());
        // consume response data to free up memory
        res.resume();
        return reject(error);
        
      }


      try {
        let simplifiedResults = wdk.simplifySparqlResults(res.data);
        l.info('wikidata.service.js doSparqlRequest: '//+simplifiedResults+' '
             +simplifiedResults.length+' ids found for '+location+' '+new Date().toISOString());
        resolve(simplifiedResults);
      } catch (e) {
        l.error('Error occurred simplifying wikidata results.'+e+' '+new Date().toISOString());
        reject(e);
      }

    })
        .catch(error=>{
            l.error(`Request to Wikidata Failed. Url: ${url}`+' '+new Date().toISOString());
          reject(error)
        });

  });
}

export default new WikidataService();
