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
  headers: { 'Cache-Control': 'no-cahce' },
  // cache enabled by default
  adapter: cacheAdapterEnhancer(axios.defaults.adapter)
});

class WikidataService {
  idsByCenter(lat, lng, radius=10) {
    // fetch fountain from OSM by coordinates, within radius in meters
    const sparql = `
        SELECT ?place
        WHERE
        {
          SERVICE wikibase:around {
            ?place wdt:P625 ?location .
            bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral.
            bd:serviceParam wikibase:radius "${radius/1000}".
          } .
          # Is a water well or fountain or subclass of fountain
          FILTER (EXISTS { ?place wdt:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place wdt:P31/wdt:P279* wd:Q483453 }).
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de" .
          }
        }`;
    return doSparqlRequest(sparql);
  }
  
  idsByBoundingBox(latMin, lngMin, latMax, lngMax){
    const sparql = `
        SELECT ?place
        WHERE
        {
          SERVICE wikibase:box {
            ?place wdt:P625 ?location .
            bd:serviceParam wikibase:cornerWest "Point(${lngMin} ${latMin})"^^geo:wktLiteral.
            bd:serviceParam wikibase:cornerEast "Point(${lngMax} ${latMax})"^^geo:wktLiteral.
          } .
          # Is a water well or fountain or subclass of fountain
          FILTER (EXISTS { ?place wdt:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place wdt:P31/wdt:P279* wd:Q483453 } || EXISTS { ?place wdt:P31/wdt:P279* wd:Q29592411}).
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de" .
          }
        }`;
    return doSparqlRequest(sparql);
  }
  
  
  byIds(qids) {
    // fetch fountains by their QIDs
    const chunckSize = 50;  // how many fountains should be fetched at a time
    return new Promise((resolve, reject)=>{
      let allFountainData = [];
      let httpPromises = [];
      try{
        chunk(qids, chunckSize).forEach(qidChunk=> {
          // create sparql url
          const url = wdk.getEntities({
            ids: qidChunk,
            format: 'json',
            props: []
          });
          // l.debug(url);
          // get data
          httpPromises.push(http.get(url));
        });
        // wait for all http requests to resolve
        Promise.all(httpPromises)
          .then(responses => {
            let dataAll = [];
            responses.forEach(r => {
              let data = [];
              for (let key in r.data.entities) {
                data.push(wdk.simplify.entity(
                  r.data.entities[key],
                  {
                    keepQualifiers: true
                  }));
              }
              dataAll = dataAll.concat(data);
            });
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
  
  fillArtistName(fountain){
    // created for proximap/#129
    
    // intialize
    fountain.properties.artist_name.derived = {
      website: {
        url: null,
        wikidata: null,
      }
    };
    
    // if there is a wikidata entity, then fetch more information
    if(fountain.properties.artist_name.source === 'wikidata'){
  
      let qid = fountain.properties.artist_name.value;
      
      // enter wikidata url
      fountain.properties.artist_name.derived.website.wikidata = `https://www.wikidata.org/wiki/${qid}`;
      
      // create sparql url
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
          // Look for Wikipedia entry in English, French, or German
          for(let lang of ['en', 'fr', 'de']){
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
          l.error(`Error collecting artist name and url from wikidata: ${err}`);
          fountain.properties.artist_name.issues.push({
            type: 'data_processing',
            level: 'error',
            message: `Failed to fetch Wikidata entity information. Url: ${url}`,
            error_data: err
          });
          return fountain});
    }else{
      return fountain;
    }
  }
  
  
  fillOperatorInfo(fountain){
    // created for proximap/#149
    if(fountain.properties.operator_name.source === 'wikidata'){
      // create sparql url
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
          fountain.properties.operator_name.derived = {
            url: null,
            qid: qid
          };
          // Official website P856 // described at URL P973 // reference URL P854 // URL P2699
          for (let pid of ['P856', 'P973', 'P854', 'P2699'] ){
            // get the url value if the path exists
            let url = _.get(entity.claims, [pid, 0, 'value'], false);
            if(url){
              fountain.properties.operator_name.derived.url = url;
              break;
            }
          }
          return fountain;
        })
        .catch(err=>{
          l.error(`Error collecting operator info name: ${err}`);
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

function doSparqlRequest(sparql){
  return new Promise((resolve, reject)=> {
    // create url from SPARQL
    const url = wdk.sparqlQuery(sparql);
    
    // get data
    let request = https.get(url, (res) => {
      const {statusCode} = res;
      const contentType = res.headers['content-type'];
      
      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
          `Status Code: ${statusCode}`);
      }
      if (error) {
        // consume response data to free up memory
        res.resume();
        reject(error);
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          let simplifiedResults = wdk.simplifySparqlResults(parsedData);
          // l.info(simplifiedResults);
          resolve(simplifiedResults);
        } catch (e) {
          l.error('Error occurred simplifying wikidata results.');
          reject(e);
        }
      });
    });
    
    request.on('error', e=>{
      l.error(`Error occurred with wikidata query: ${e}`);
      l.info(url);
      reject(e);
    })
  });
}

export default new WikidataService();
