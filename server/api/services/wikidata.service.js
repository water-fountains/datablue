/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
const axios = require('axios');
import { cacheAdapterEnhancer } from 'axios-extensions';
const _ = require ('lodash');
const wdk = require('wikidata-sdk');
import {locations} from '../../../config/locations';
const sharedConstants = require('./../../common/shared-constants');

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
       let res = doSparqlRequest(sparql,locationName, 'idsByCenter'); 
    return res;
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
      let res = doSparqlRequest(sparql,locationName, 'idsByBoundingBox');
    return res;
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
            l.info('wikidata.service.js byIds: '+chkCnt+' chunks of '+chunkSize+' prepared for loc "'+locationName+'" '+new Date().toISOString());
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
            if (1 == chkCnt) {
               let dataAllSize = -1;
               if (null != dataAll) {
            	   dataAllSize = dataAll.length;
               }
               l.info('wikidata.service.js byIds: dataAll '+dataAllSize+' for loc "'+locationName+'" '+new Date().toISOString());
            }
            // return dataAll to 
            resolve(dataAll);
          })
          .catch(e=>{
            l.error('wikidata.service.js byIds: catch e '+e.stack+' for loc "'+locationName+'" '+new Date().toISOString());
            reject(e)
          });
      }catch (error){
        l.error('wikidata.service.js byIds: catch error '+error.stack+' for loc "'+locationName+'" '+new Date().toISOString());
        reject(error);
      }
      
      // return data
      
    })
  }
  
  fillArtistName(fountain,dbg){
    // created for proximap/#129
    // intialize
    const artNam = fountain.properties.artist_name;
    if (null != artNam.derived && null != artNam.derived.name
      && '' != artNam.derived.name.trim()) {
       l.info('wikidata.service.js fillArtistName: already set "'+artNam.derived.name+'"'+new Date().toISOString());
       return fountain;
    }
    artNam.derived = {
      website: {
        url: null,
        wikidata: null,
        name:null,
      }
    };
    dbg += ' '+fountain.properties.name.value;
	const idWd = fountain.properties.id_wikidata.value;
    // if there is a wikidata entity, then fetch more information with a query
    if(artNam.source === 'wikidata'){
      if (null == idWd) {
    	 l.info('wikidata.service.js fillArtistName: null == idWd ' +new Date().toISOString());
      }
      const qid = artNam.value;
      if (null == qid) {
         l.info('wikidata.service.js fillArtistName: null == qid for "'+idWd+'" '+new Date().toISOString());
         return fountain;
      }
      if (0 == qid.trim().length) {
         l.info('wikidata.service.js fillArtistName: blank qid for "'+idWd+'" '+new Date().toISOString());
         return fountain;
      }
      
      // enter wikidata url
      artNam.derived.website.wikidata = `https://www.wikidata.org/wiki/${qid}`;
      
      // create sparql query url
      const url = wdk.getEntities({
            // make sparql query more precise: https://github.com/water-fountains/proximap/issues/129#issuecomment-597785180
        ids: [qid],
        format: 'json',
        props: ['labels', 'sitelinks', 'claims']
      });
//      l.debug(url+' '+new Date().toISOString());
      // get data
      let data = null;
      return http.get(url)
      // parse into an easier to read format
        .then(r=>{
          data = r.data;
          const entities = data.entities;
          if (null == entities) {
             l.info('wikidata.service.js fillArtistName: null == entities "'+qid+'" for idWd "'+idWd+'" '+new Date().toISOString());
             return fountain;
          }
          l.info('wikidata.service.js fillArtistName: null != entities "'+qid+'" for idWd "'+idWd+'" '+new Date().toISOString());
          const eQid = entities[qid];
          if (null == eQid) {
             l.info('wikidata.service.js fillArtistName: null == eQid "'+qid+'" for idWd "'+idWd+'" '+new Date().toISOString());
             return fountain;
          }
          l.info('wikidata.service.js fillArtistName: about to wdk.simplify.entity eQid "'+eQid+'", qid  "'+qid+'" for idWd "'+idWd+'" '+new Date().toISOString());
          return wdk.simplify.entity(eQid,
            {
              keepQualifiers: true
            })
        })
        // extract useful data for https://github.com/water-fountains/proximap/issues/163
        .then(entity=>{
          // Get label of artist in English
          if (null == entity) {
             l.info('wikidata.service.js fillArtistName: null == entity after wdk.simplify "'+qid+'" for idWd "'+idWd+'" '+new Date().toISOString());
             return fountain;
          }
          const langs = Object.keys(entity.labels);
          let artName = null;
          if(langs.indexOf('en') >= 0) {
            artName = entity.labels.en;
          }else{
            // Or get whatever language shows up first
            artName = entity.labels[langs[0]];
          }
          //artNam.value = artName;
          artNam.derived.name = artName;
          // Try to find a useful link
          // Look for Wikipedia entry in different languages
          for(let lang of sharedConstants.LANGS){
            if(entity.sitelinks.hasOwnProperty(lang+'wiki')){
              artNam.derived.website.url = `https://${lang}.wikipedia.org/wiki/${entity.sitelinks[lang+'wiki']}`;
              return fountain;
            }
          }
          // for https://github.com/water-fountains/proximap/issues/163
          // Official website P856 // described at URL P973 // reference URL P854 // URL P2699
          for (let pid of ['P856', 'P973', 'P854', 'P2699'] ){
            // get the url value if the path exists
            let url = _.get(entity.claims, [pid, 0, 'value'], false);
            if(url){
              artNam.derived.website.url = url;
              return fountain;
            }
          }
          // if no url found, then link to wikidata entry
          return fountain;
        })
        .catch(err=>{
        	// https://github.com/maxlath/wikibase-sdk/issues/64 or rather https://phabricator.wikimedia.org/T243138 creator of https://www.wikidata.org/wiki/Q76901204  ("Europuddle" in ch-zh)
          // report error to log and save to data
          l.error(`wikidata.service.ts fillArtistName: Error collecting artist name and url from wikidata: `+dbg);
          l.info(`stack: ${err.stack}`);
          l.info(`url: ${url}\n`);
          artNam.issues.push({
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
              message: `Failed to fetch Wikidata artist name entity information. Url: ${url} `+dbg,
          });
          return fountain});
    }else{
      return fountain;
    }
  }
  
  
  fillOperatorInfo(fountain, dbg){
    // created for proximap/#149
    const opNam = fountain.properties.operator_name;
    if(opNam.source === 'wikidata'){
      // create sparql url to fetch operator information from QID
      let qid = opNam.value;
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
            opNam.value = entity.labels.en;
          }else{
            // Or get whatever language shows up first
            opNam.value = entity.labels[langs[0]];
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
          opNam.derived = {
            url: url,
            qid: qid
          };
          return fountain;
        })
        .catch(err=>{
          l.error(`wikidata.service.ts fillOperatorInfo: Error collecting operator info name: ${err.stack} `+dbg);
          const errInfo = '(lookup unsuccessful)';
          if (opNam.value && -1 == opNam.value.indexOf(errInfo)) {
             opNam.value = opNam.value + errInfo;
          }
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

function doSparqlRequest(sparql, location, dbg){
  return new Promise((resolve, reject)=> {
    // create url from SPARQL
    const url = wdk.sparqlQuery(sparql);
    
    // get data
    let request = axios.get(url)
        .then(res => {

      if (res.status !== 200) {
        let error = new Error(`wikidata.service.ts doSparqlRequest Request to Wikidata Failed. Status Code: ${res.status}. Status Message: ${res.statusMessage}. Url: ${url}`);
        l.error('wikidata.service.js doSparqlRequest: '+dbg+',  location '+location+' '+error.message+' '+new Date().toISOString());
        // consume response data to free up memory
        res.resume();
        return reject(error);        
      }


      try {
        let simplifiedResults = wdk.simplifySparqlResults(res.data);
        l.info('wikidata.service.js doSparqlRequest: '+dbg+',  location '+location+' '//+simplifiedResults+' '
             +simplifiedResults.length+' ids found for '+location+' '+new Date().toISOString());
        resolve(simplifiedResults);
      } catch (e) {
        l.error('wikidata.service.js doSparqlRequest: Error occurred simplifying wikidata results.'+e.stack+' '+dbg+',  location '+location+' '+new Date().toISOString());
        reject(e);
      }
    })
        .catch(error=>{
            l.error(`'wikidata.service.js doSparqlRequest: Request to Wikidata Failed. Url: ${url}`+' '+dbg+',  location '+location+' '+new Date().toISOString());
          reject(error)
        });

  });
}

export default new WikidataService();