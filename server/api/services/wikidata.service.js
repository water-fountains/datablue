import l from '../../common/logger';
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "./constants";
const https = require('https');
const axios = require('axios');
const wdk = require('wikidata-sdk');

class WikidataService {
  byCoords(lat, lng) {
    // fetch fountain from OSM by coordinates
    return new Promise((resolve, reject)=>{
        const sparql = `
      SELECT ?fountainLabel ?coord ?img_url ?date ?fountain 
      WHERE {
        ?fountain wdt:P31 wd:Q43483;  
                  wdt:P625 ?coord.
        OPTIONAL {?fountain wdt:P571 ?date.}
        OPTIONAL {?fountain wdt:P18 ?img_url.}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE]". }
      }`;
      reject(new Error(FUNCTION_NOT_AVAILABLE))
    })
  }
  
  IdsByBoundingBox(latMin, lngMin, latMax, lngMax){
    return new Promise((resolve, reject)=> {
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
          FILTER (EXISTS { ?place wdt:P31/wdt:P279* wd:Q43483 } || EXISTS { ?place wdt:P31/wdt:P279* wd:Q483453 }).
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de" .
          }
        }`;
      const url = wdk.sparqlQuery(sparql);
      // l.debug(url);
  
      // get data
      https.get(url, (res) => {
        const {statusCode} = res;
        const contentType = res.headers['content-type'];
    
        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' +
            `Status Code: ${statusCode}`);
        }
        // else if (!/^application\/json/.test(contentType)) {
        //   error = new Error('Invalid content-type.\n' +
        //     `Expected application/json but received ${contentType}`);
        // }
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
            const simplifiedResults = wdk.simplifySparqlResults(parsedData);
            // l.info(simplifiedResults);
            resolve(simplifiedResults);
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  }
  

  byIds(qids) {
    // fetch fountains by their QIDs
    const chunckSize = 10;  // how many fountains should be fetched at a time
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
                  data.push(wdk.simplify.entity(r.data.entities[key]));
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

export default new WikidataService();
