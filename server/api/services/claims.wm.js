/*
 * @license
 * (c) Copyright 2020 | MY-D Foundation | Created by Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 *
 * to support https://github.com/water-fountains/proximap/issues/285
 * 
 */
 
import l from '../../common/logger';
const axios = require ('axios');
const { ConcurrencyManager } = require("axios-concurrency");
import {sanitizeTitle} from "./wikimedia.service";
const sharedConstants = require('./../../common/shared-constants');

let api = axios.create({});

// a concurrency parameter of 1 makes all api requests sequential
const MAX_CONCURRENT_REQUESTS = 200;
const lgthWarnSiz = 1500;

// init your manager.
const manager = ConcurrencyManager(api, MAX_CONCURRENT_REQUESTS);

export function getCatExtract(singleRefresh,cat, promises, dbg) {
   if (!singleRefresh) {
      return;
   }
   if (null == cat) {
      l.info('claims.wm.js getCatExtract: null == cat '+dbg+' '+new Date().toISOString());          
      return;
   }
   if (null == promises) {
      l.info('claims.wm.js getCatExtract: null == promises '+dbg+' '+new Date().toISOString());          
      return;
   }
   if (null != cat.e) {
      l.info('claims.wm.js getCatExtract: extract "'+cat.e+'" already exists '+dbg+' '+new Date().toISOString());          
      return;
   }
   let catName = cat.c;
   if (null == catName) {
      l.info('claims.wm.js getCatExtract: null == catName '+dbg+' '+new Date().toISOString());          
      return;
   }
   if (0 == catName.trim().length) {
      l.info('claims.wm.js getCatExtract: blank catName '+dbg+' '+new Date().toISOString());          
      return;
   }
    const encCat = encodeURIComponent(catName);
    const sanTit = sanitizeTitle(encCat);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=Category:${sanTit}&prop=extracts&format=json&explaintext`;
    const timeoutSecs = 1;
      let timeout = timeoutSecs*1000; 
//      l.info('claims.wm.js: getCatExtract '+dbg+' '+url+' '+new Date().toISOString());
    let extractPomise = api.get(url, {timeout: timeout})
      .then(r => {
        const keys = Object.keys(r.data.query.pages);
        const key = keys[0];
        const pags =r.data.query.pages;
        const data = pags[key];
        if (null != data) {
           const extract = data.extract;
           if (null != extract) {
              const extTr = extract.trim();
              const extTrLgth = extTr.length;
              if (0 < extTrLgth) {
                 if (lgthWarnSiz < extTrLgth) {
                     l.info('claims.wm.js getCatExtract: category "'+catName+'" very long extract '+extTrLgth+' should we shorten ? '+dbg+' '+new Date().toISOString());
                 }
                 cat.e = extTr;
                 l.info('claims.wm.js getCatExtract: category "'+catName+'" added '+extTrLgth+' '+dbg+' '+new Date().toISOString());
              }
           }
        }
        return;
    }).catch(err=> {
        l.error('claims.wm.js getCatExtract.categorymembers = api.get:\n'+
          `Failed to fetch category extract. Cat "`+catName+'" ' +dbg + ' url '+url+' '+new Date().toISOString()+'\n'+err.stack);
    });
    extractPomise.cat = cat;
    extractPomise.caller = 'getCatExtract '+dbg;
    promises.push(extractPomise);
    return;
}


export function getImgClaims(singleRefresh,img, promises, dbg) {
   if (!singleRefresh) {
      return;
   }
   if (null == img) {
      l.info('claims.wm.js getImgClaims: null == img '+dbg+' '+new Date().toISOString());          
      return;
   }
   if (null == promises) {
      l.info('claims.wm.js getImgClaims: null == promises '+dbg+' '+new Date().toISOString());          
      return;
   }
   let fn = img.pgTit;
   if (null == fn) {
      l.info('claims.wm.js getImgClaims: null == img.pgTit  '+dbg+' '+new Date().toISOString());          
      return;
   }
   if (0 == fn.trim().length) {
      l.info('claims.wm.js getImgClaims: blank fn '+dbg+' '+new Date().toISOString());          
      return;
   }
    const encFn = encodeURIComponent(fn);
    const sanFn = sanitizeTitle(encFn);
    const url = `https://commons.wikimedia.org/w/api.php?action=wbgetentities&format=json&sites=commonswiki&titles=File%3A${sanFn}`;
    const timeoutSecs = 1;
    const timeout = timeoutSecs*1000; 
    //l.info('claims.wm.js getImgClaims: about to query '+url+' '+dbg+' '+new Date().toISOString());          
    let claimsPromise = api.get(url, {timeout: timeout})
      .then(r => {
        l.info('claims.wm.js getImgClaims: got response for '+url+' '+dbg+' '+new Date().toISOString());          
        const entities = r.data.entities;
        const keys = Object.keys(entities);
        const key = keys[0];
        const data = entities[key];
        if (null != data) {
           const labels = data.labels;
           if (null != labels) {
    		  for(const lang of sharedConstants.LANGS){
    			const label = labels[lang];
    			if(null != label){
    			   const lVal = label.value;
    			   if(null !=lVal){
    			      const lvTr = lVal.trim();
    			      const lvTrLght = lvTr.length;
    			      if (0 < lvTrLght) {
                        if (lgthWarnSiz < lvTrLght) {
                           l.info('claims.wm.js getImgClaims: img "'+fn+'" has a very long claim '+lvTrLght+' should we shorten ? '+dbg+' '+new Date().toISOString());
                        }
                        img[`claim_${lang}`] = lvTr;
                        l.info('claims.wm.js getImgClaims: img "'+fn+'" added claim of length '+lvTrLght+' '+dbg+' '+new Date().toISOString());
    			      }
    			   }
                }
              }
           }
        }
        return;
    }).catch(err=> {
        // If there is an error getting the category members, then reject with error
        l.error('claims.wm.js getImgClaims.claims = api.get:\n'+
          `Failed to fetch image claims. Cat "`+fn+'" ' +dbg + + ' url '+url+' '+new Date().toISOString()+'\n'+err.stack);
    });
    claimsPromise.img = img;
    claimsPromise.caller = 'getImgClaims '+dbg;
    promises.push(claimsPromise);
    return;
}