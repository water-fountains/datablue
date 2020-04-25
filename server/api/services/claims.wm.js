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

let api = axios.create({});

// a concurrency parameter of 1 makes all api requests sequential
const MAX_CONCURRENT_REQUESTS = 200;

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
    let encCat = encodeURIComponent(catName);
    let sanTit = sanitizeTitle(encCat);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=Category:${sanTit}&prop=extracts&format=json&explaintext`;
    const timeoutSecs = 1;
      let timeout = timeoutSecs*1000; 
//      l.info('claims.wm.js: getCatExtract '+dbg+' '+url+' '+new Date().toISOString());
    let extractPomise = api.get(url, {timeout: timeout})
      .then(r => {
        let keys = Object.keys(r.data.query.pages);
        let key = keys[0];
        let pags =r.data.query.pages;
        let data = pags[key];
        if (null != data) {
           const extract = data.extract;
           if (null != extract) {
              const extTr = extract.trim();
              const extTrLgth = extTr.length;
              if (0 < extTrLgth) {
                 if (1500 < extTrLgth) {
                     l.info('claims.wm.js getCatExtract: category "'+catName+'" very long extract '+extTrLgth+' should we shorten ? '+dbg+' '+new Date().toISOString());
                 }
                 cat.e = extTr;
                 l.info('claims.wm.js getCatExtract: category "'+catName+'" added '+extTrLgth+' '+dbg+' '+new Date().toISOString());
              }
           }
        }
        return extractPomise;
    }).catch(err=> {
        // If there is an error getting the category members, then reject with error
        l.error('claims.wm.js getCatExtract.categorymembers = api.get:\n'+
          `Failed to fetch category members. Cat "`+catName+'" ' +dbg + + ' url '+url+' '+new Date().toISOString()+'\n'+err.stack);
    });
    promises.push(extractPomise);
    return extractPomise;
}
