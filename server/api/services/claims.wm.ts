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
import axios from 'axios';
import { sanitizeTitle } from './wikimedia.service';
import sharedConstants from './../../common/shared-constants';
import { Category, MediaWikiEntityCollection } from '../../common/wikimedia-types';
import { GalleryValue } from '../../common/typealias';

let api = axios.create({});

// a concurrency parameter of 1 makes all api requests sequential
const lgthWarnSiz = 1500;

export function getCatExtract(
  singleRefresh: boolean,
  category: Category | null,
  promises: Promise<any>[],
  dbg: string
): void {
  if (!singleRefresh) {
    return;
  }
  if (null == category) {
    l.info('claims.wm.js getCatExtract: null == cat ' + dbg);
    return;
  }
  if (null == promises) {
    l.info('claims.wm.js getCatExtract: null == promises ' + dbg);
    return;
  }
  if (category.e !== undefined) {
    l.info('claims.wm.js getCatExtract: extract "' + category.e + '" already exists ' + dbg);
    return;
  }
  // TODO @ralfhauser, also here, why do we use c and not n for catName? search for other
  let catName = category.c;
  if (null == catName) {
    l.info('claims.wm.js getCatExtract: null == catName ' + dbg);
    return;
  }
  if (0 == catName.trim().length) {
    l.info('claims.wm.js getCatExtract: blank catName ' + dbg);
    return;
  }
  const encCat = encodeURIComponent(catName);
  const sanTit = sanitizeTitle(encCat);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=Category:${sanTit}&prop=extracts&format=json&explaintext`;
  const timeoutSecs = 1;
  let timeout = timeoutSecs * 1000;
  //      l.info('claims.wm.js: getCatExtract '+dbg+' '+url);
  let extractPomise = api
    .get(url, { timeout: timeout })
    .then((r) => {
      const keys = Object.keys(r.data.query.pages);
      const key = keys[0];
      const pags = r.data.query.pages;
      const data = pags[key];
      if (null != data) {
        const extract = data.extract;
        if (null != extract) {
          const extTr = extract.trim();
          const extTrLgth = extTr.length;
          if (0 < extTrLgth) {
            if (lgthWarnSiz < extTrLgth) {
              l.info(
                'claims.wm.js getCatExtract: category "' +
                  catName +
                  '" very long extract ' +
                  extTrLgth +
                  ' should we shorten ? ' +
                  dbg
              );
            }
            category.e = extTr;
            l.info('claims.wm.js getCatExtract: category "' + catName + '" added ' + extTrLgth + ' ' + dbg);
          }
        }
      }
      return;
    })
    .catch((err) => {
      l.error(
        'claims.wm.js getCatExtract.categorymembers = api.get:\n' +
          `Failed to fetch category extract. Cat "` +
          catName +
          '" ' +
          dbg +
          ' url ' +
          url +
          '\n' +
          err.stack
      );
    });

  //TODO this looks very smelly: adding a property cat and caller to a Promise
  const p: { [key: string]: any } = extractPomise;
  p.cat = category;
  p.caller = 'getCatExtract ' + dbg;

  promises.push(extractPomise);
  return;
}

export function getImgClaims(
  singleRefresh: boolean,
  img: GalleryValue | undefined,
  promises: Promise<any>[],
  dbg: string
): void {
  if (!singleRefresh) {
    return;
  }
  //TODO @ralfhauser, we should check for === undefined or could it also be null sometimes?
  if (null == img) {
    l.info('claims.wm.js getImgClaims: null == img ' + dbg);
    return;
  }
  if (null == promises) {
    l.info('claims.wm.js getImgClaims: null == promises ' + dbg);
    return;
  }
  //TODO @ralfhauser, we should check for === undefined or could it also be null sometimes?
  let fn = img.pgTit;
  if (null == fn) {
    l.info('claims.wm.js getImgClaims: null == img.pgTit  ' + dbg);
    return;
  }
  if (0 == fn.trim().length) {
    l.info('claims.wm.js getImgClaims: blank fn ' + dbg);
    return;
  }
  const encFn = encodeURIComponent(fn);
  const sanFn = sanitizeTitle(encFn);
  const url = `https://commons.wikimedia.org/w/api.php?action=wbgetentities&format=json&sites=commonswiki&titles=File%3A${sanFn}`;
  const timeoutSecs = 1;
  const timeout = timeoutSecs * 1000;
  //l.info('claims.wm.js getImgClaims: about to query '+url+' '+dbg);
  let claimsPromise = api
    .get<MediaWikiEntityCollection>(url, { timeout: timeout })
    .then((r) => {
      l.info('claims.wm.js getImgClaims: got response for ' + url + ' ' + dbg);
      const entities = r.data.entities;
      const keys = Object.keys(entities);
      const key = keys[0];
      const data = entities[key];
      if (null != data) {
        const labels = data.labels;
        if (null != labels) {
          for (const lang of sharedConstants.LANGS) {
            const label = labels[lang];
            if (null != label) {
              const lVal = label.value;
              if (null != lVal) {
                const lvTr = lVal.trim();
                const lvTrLght = lvTr.length;
                if (0 < lvTrLght) {
                  if (lgthWarnSiz < lvTrLght) {
                    l.info(
                      'claims.wm.js getImgClaims: img "' +
                        fn +
                        '" has a very long claim ' +
                        lvTrLght +
                        ' should we shorten ? ' +
                        dbg
                    );
                  }
                  img[`claim_${lang}`] = lvTr;
                  l.info('claims.wm.js getImgClaims: img "' + fn + '" added claim of length ' + lvTrLght + ' ' + dbg);
                }
              }
            }
          }
        }
      }
      return;
    })
    .catch((err) => {
      // If there is an error getting the category members, then reject with error
      l.error(
        'claims.wm.js getImgClaims.claims = api.get:\n' +
          `Failed to fetch image claims. Cat "` +
          fn +
          '" ' +
          dbg +
          +' url ' +
          url +
          '\n' +
          err.stack
      );
    });
  //TODO @ralfhauser this looks very smelly: adding a property img and caller to a Promise, also using the name caller could lead to problems in the future
  const p: { [key: string]: any } = claimsPromise;
  p.img = img;
  p.caller = 'getImgClaims ' + dbg;

  promises.push(claimsPromise);
  return;
}
