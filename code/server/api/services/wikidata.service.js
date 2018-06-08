import l from '../../common/logger';
import {FUNCTION_NOT_AVAILABLE, NO_FOUNTAIN_AT_LOCATION} from "./constants";
const https = require('https');
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

  byId(qid) {
    // fetch fountain by its QID
      return new Promise((resolve, reject)=>{
        // create sparql url
        const url = wdk.getEntities({
            ids: [qid],
            format: 'json',
            props:[]
        });
        l.debug(url);
        // get data
        https.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                // consume response data to free up memory
                res.resume();
                reject(error);
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    const data = wdk.simplify.entity(parsedData.entities[qid]);
                    l.info(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            });
        })

      })
  }
}

export default new WikidataService();
