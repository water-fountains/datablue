/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import {getStaticStreetView} from "./google.service";


const _ = require ('lodash');
const axios = require ('axios');
const { ConcurrencyManager } = require("axios-concurrency");
const md5 = require('js-md5');
import l from '../../common/logger';
import {PROP_STATUS_ERROR, PROP_STATUS_INFO, PROP_STATUS_OK, PROP_STATUS_WARNING} from "../../common/constants";

let api = axios.create({});

// a concurrency parameter of 1 makes all api requests sequential
const MAX_CONCURRENT_REQUESTS = 200;

// init your manager.
const manager = ConcurrencyManager(api, MAX_CONCURRENT_REQUESTS);


class WikimediaService {

  addToImgList(imgListWithSource, imgUrlSet, imgUrls, dbg, debugAll) {
    let i = -1;
    if (null != imgListWithSource && null != imgListWithSource.imgs) {
      i++;
      let duplicateCount = 0;
      for(let foFeaImg of imgListWithSource.imgs) {
        let imgNam = foFeaImg.value;
        let pTit = imgNam.toLowerCase();
        let dotPos = pTit.lastIndexOf(".");
        // only use photo media, not videos
        let ext = pTit.substring(dotPos+1);
        if(['jpg','jpeg', 'png', 'gif','tif','tiff','svg','ogv', 'webm'].indexOf(ext)<0){
          l.info(ext+': skipping "'+page.title+'" '+dbgImg+' '+dbgIdWd+' '+city);
          //https://github.com/lukasz-galka/ngx-gallery/issues/296 to handle svg, ogv, webm
          continue;
        }
        if ('wd'==imgListWithSource.src) {
          if (!imgUrlSet.has(imgNam)) {
            imgUrlSet.add(imgNam);
            let img = {
              src: imgListWithSource.src,
              val: foFeaImg.value
            }
            imgUrls.push(img);
            i++;
          } else {
        	  if (debugAll) {
        		  l.info('fillGallery.foFeaImgs: duplicate  "'+imgNam+'" ' +i + '/' +imgListWithSource.imgs.length + ' - ' +dbg + ' '+new Date().toISOString());
        	  }
        	  duplicateCount++;
          }
        } else {
            l.info('fillGallery.foFeaImgs: unknown src "'+imgListWithSource.src+'" "'+imgNam+'" ' +dbg + ' '+new Date().toISOString());
        }    
      };
      if (0 < duplicateCount //&& debugAll
    		  ) {
		  l.info('fillGallery.foFeaImgs: '+duplicateCount+' duplicates found among ' +imgListWithSource.imgs.length + ' - ' +dbg + ' '+new Date().toISOString());
      }
      if (1 < imgListWithSource.imgs.length && debugAll) {
        if(process.env.NODE_ENV !== 'production') {
          l.info('fillGallery.foFeaImgs: added '+imgListWithSource.imgs.length+' ' +dbg);
        }
      }
    }
    return i;  
  }

  fillGallery(fountain, dbg, city, debugAll){
    let dbgIdWd = null;
//    if (debugAll) {
//       l.info('wikimedia.service.js starting fillGallery: '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
//    }
    if (null != fountain.properties.id_wikidata && null != fountain.properties.id_wikidata.value) {
      dbgIdWd = fountain.properties.id_wikidata.value;
    }
    let url = 'unkUrl';
    let lastCatName = 'undefCatNam';
    let lastCatUrl =  'undefCatUrl';
    let name = fountain.properties.name.value;
    // fills gallery with images from wikidata, wikimedia commons,
    // todo: add osm as a possible source (although images shouldn't really be linked there.
    return new Promise((resolve, reject) => {
      // initialize default gallery
      // setTimeout(()=>{
      //   l.info(`fountain ran out of time getting information. Osm ID: ${fountain.properties.id_osm.value}`);
      //   reject('ran out of time')
      // }, 1000);
      fountain.properties.gallery = {
        value: [],
        issues: [],
        status: PROP_STATUS_WARNING,
        type: 'object',
        // name: 'gallery',  // don't give it a name so it doesn't appear in the list
        comments: ''
      };

      let galVal = fountain.properties.gallery.value;
      let imgUrls = [];
      let imgUrlSet = new Set();
      let fProps = fountain.properties;
      let foFeaImgs = fProps.featured_image_name;
      let foFeaImgsV = foFeaImgs.value;
      let added = this.addToImgList(foFeaImgsV, imgUrlSet, imgUrls, dbg + ' '+ dbgIdWd, debugAll);
      let imgNoInfoPomise = null;
      if(_.isNull(fountain.properties.wiki_commons_name.value) || _.isNull(fountain.properties.wiki_commons_name.value.cats) || 0 == fountain.properties.wiki_commons_name.value.cats.length) {
        // if not, resolve with empty
        if(process.env.NODE_ENV !== 'production' && debugAll) {
          l.info('wikimedia.service.js: no commons category defined "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
        }
        imgNoInfoPomise = new Promise((resolve, reject)=>resolve(false));
      }else{
        let catNames = fountain.properties.wiki_commons_name.value.cats;
        if (1 < catNames.length) {
            l.info('wikimedia.service.js: '+catNames.length+' commons categories defined "'+dbg+' '+city+' '+dbgIdWd+' "'+name+'"'+new Date().toISOString());
        }
        let catName = catNames[0].value;
        lastCatName = catName;
        // if there is a gallery, then fetch all images in category
        url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=20&cmtitle=Category:${this.sanitizeTitle(encodeURIComponent(catName))}&prop=imageinfo&format=json`;
        lastCatUrl = url;
        // make array of image promises
        let imgValsCumul = [];
        imgNoInfoPomise = api.get(url, {timeout: 1000})
          .then(r => {
            let category_members = r.data.query['categorymembers'];
            let cI = 0;
            let cTot = category_members.length;
            if(process.env.NODE_ENV !== 'production' && debugAll) {
              l.info('wikimedia.service.js fillGallery: category "'+catName+'" has '+cTot+' images '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
            }
            // fetch information for each image, max 50
            for(; cI < cTot && cI < 50;cI++) {
              let page = category_members[cI];
              let dbgImg = "f-"+dbg+"_i-"+cI+"/"+cTot;  
              let imgLikeFromWikiMedia = {
                      value: page.title.replace('File:','')
                    }
              let imgVals = [];
              imgVals.push(imgLikeFromWikiMedia);
              imgValsCumul.push(imgLikeFromWikiMedia);
              let imgs = { src: 'wd',
                imgs: imgVals };
              let addedC = this.addToImgList(imgs, imgUrlSet, imgUrls, dbg + ' '+ dbgIdWd+' cat "'+catName+'"', debugAll);
            };
            return Promise.all(imgValsCumul);
        }).catch(err=> {
            // If there is an error getting the category members, then reject with error
            l.error('fillGallery.categorymembers = api.get:\n'+
              `Failed to fetch category members. Cat "`+catName+'" ' +dbg + ' '+ dbgIdWd 
               + ' url '+url+'\n'+err.stack);
            // add gallery as value of fountain gallery property
            fountain.properties.gallery.issues.push({
              data: err,
              context: {
                fountain_name: fountain.properties.name.value,
                property_id: 'gallery',
                id_osm: fountain.properties.id_osm.value,
                id_wikidata: fountain.properties.id_wikidata.value
              },
              timeStamp: new Date(),
              type: 'data_processing',
              level: 'error',
              message: `Failed to fetch category members from Wikimedia Commons. Url: ${url} `+dbg,  
            });
        });
      }
      imgNoInfoPomise
      // Promise.all(imgNoInfoPomise)
      .then(cr => {
    	  let totImgFound = imgUrlSet.size; 
      if (0 < totImgFound) {
    	if (debugAll) {
    		l.info('wikimedia.service.js: fillGallery imgUrlSet.size '+totImgFound+' "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
    	}
    	if (50 < totImgFound) {
    		l.info('wikimedia.service.js: fillGallery only showing first 50 out of imgUrlSet.size '+totImgFound+' "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
    	}
        let galValPromises = [];
        let k = 0;
        const imgL = imgUrls.length;
        for(;k < 6 && k < imgL;k++) { //6 since only 5 imgs are on the gallery-preview
        	const img = imgUrls[k];
        	galValPromises.push(getImageInfo(img.val, k+'/'+imgL+' '+dbg+' '+city+' '+dbgIdWd, false).catch(giiErr=>{
                l.info('wikimedia.service.js: fillGallery getImageInfo failed for "'+img.val+'" '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString()
                + '\n'+giiErr.stack);
            }));
        }
        if (debugAll) {
        	l.info('wikimedia.service.js: fillGallery galValPromises.length '+galValPromises.length+' '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
        }
        Promise.all(galValPromises).then(r => {
          if (debugAll) {
        		l.info('wikimedia.service.js: fillGallery galValPromises.r.length '+r.length+' '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
          }
          galVal = galVal.concat(r);
          fountain.properties.gallery.value = galVal;
          fountain.properties.gallery.status = PROP_STATUS_OK;
          fountain.properties.gallery.comments = '';
          fountain.properties.gallery.source = 'wiCommns';
          fountain.properties.gallery.totImgs = totImgFound; //display in GUI if > 50
          resolve(fountain);      
        });
      } else {
         //could check the qualifiers as per https://github.com/water-fountains/proximap/issues/294
    	if (debugAll) {
    		l.info("wikimedia.service.js: fillGallery "+dbgIdWd+" has no img "+city+ ' '+new Date().toISOString());
    	}
        resolve(fountain);      
      }
      });     
    }).catch(err => {
      // If there is an error getting the category members, then reject with error
      l.error('fillGallery.gallery_image_promise = api.get:\n'+
           `Failed to fetch category members. Cat "`+lastCatName+'" ' +dbg + ' '+ dbgIdWd 
             + ' url '+lastCatUrl+'\n'+err.stack);
        // add gallery as value of fountain gallery property
        fountain.properties.gallery.issues.push({
        data: err,
              context: {
                fountain_name: fountain.properties.name.value,
                property_id: 'gallery',
                id_osm: fountain.properties.id_osm.value,
                id_wikidata: fountain.properties.id_wikidata.value
              },
              timeStamp: new Date(),
              type: 'data_processing',
              level: 'error',
              message: `Failed to fetch category members from Wikimedia Commons. Url: ${url} `+dbg,
            });
            // return empty gallery so that the gallery creation can continue (the gallery might
            // then just consist in the main image
            return [];
          })
    ;
  }
    
  sanitizeTitle(title){
    // this doesn't cover all situations, but the following doesn't work either
    // return encodeURI(title.replace(/ /g, '_'));
    return title
      .replace(/ /g, '_')
      .replace(/,/g, '%2C')
      // .replace(/ü/g, '%C3%BC')
      .replace(/&/g, '%26');
  }
  
}

function makeMetadata(data){
  let template = [
      {
      sourceName: 'ImageDescription',
      outputName: 'description'
    },{
      sourceName: 'DateTimeOriginal',
      outputName: 'date_taken'
    },{
      sourceName: 'Artist',
      outputName: 'artist'
    },{
      sourceName: 'LicenseShortName',
      outputName: "license_short"
    },{
      sourceName: 'UsageTerms',
      outputName: 'license_long'
    },{
      sourceName: 'LicenseUrl',
      outputName: 'license_url'
    },
  ];
  let metadata = {};
  _.forEach(template, pair=>{
    if(data.extmetadata.hasOwnProperty(pair.sourceName)){
      metadata[pair.outputName] = data.extmetadata[pair.sourceName].value;
    }else{
      metadata[pair.outputName] = null;
    }
  });
  
  return metadata;
}

export function getImageInfo(pageTitle, dbg, showDetails){
    return new Promise((resolve, reject) =>{
      let newImage = {};
      newImage.s = 'wd';
      newImage.pgTit = pageTitle;
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:'+pageTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`;
      const timeoutSecs = 1;
      let timeout = timeoutSecs*1000; 
//      l.info('wikimedia.service.js: getImageInfo '+dbg+' '+url+' '+new Date().toISOString());
      api.get(url, {timeout: timeout})
        .then(response => {
        let keys = Object.keys(response.data.query.pages);
        let key = keys[0];
        let pags =response.data.query.pages;
        let data = pags[key];
        if(data.hasOwnProperty('imageinfo')){
          newImage.metadata = makeMetadata(data.imageinfo[0]);
          if (showDetails) {
        	  l.info('wikimedia.service.js getImageInfo: done '+dbg+' '+url+' '+new Date().toISOString());
          }
          resolve(newImage);
        } else{
          l.warn(`wikimedia.service.js getImageInfo: http request when getting metadata for "${pageTitle}" ${dbg} did not return useful data in ${timeoutSecs} secs. Url: ${url}`);
          newImage.description = `Error processing image metadata from Wikimedia Commons. Request did not return relevant information. Url: ${url}`;
          resolve(newImage);
        }
      }).catch(error=>{
        l.warn(`wikimedia.service.js getImageInfo: http req when getting metadata for "${pageTitle}" ${dbg} timed out or failed.\nError message: ${error.stack}.\nUrl: ${url}`);
        newImage.description = `http request when getting metadata for ${pageTitle} timed out after ${timeoutSecs} seconds or failed. Error message: ${error}. Url: ${url}`;
        resolve(newImage);
      });
    });
    
  }


export default new WikimediaService();