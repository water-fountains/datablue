import l from '../../common/logger';
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "./constants";
const https = require('https');
const axios = require('axios');
const _ = require ('lodash');
const wdk = require('wikidata-sdk');

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
          FILTER (EXISTS { ?place wdt:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place wdt:P31/wdt:P279* wd:Q483453 }) || EXISTS { ?place wdt:P31/wdt:P279* wd:Q29592411 }).
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
            httpPromises.push(axios.get(url));
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
            });
        }catch (error){
          reject(error);
        }
        
        // return data
        
      })
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
    https.get(url, (res) => {
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
          reject(e);
        }
      });
    });
  });
}

export default new WikidataService();
