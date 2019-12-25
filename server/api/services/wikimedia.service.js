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
  fillGallery(fountain, dbg, city){
    let dbgIdWd = null;
    if (null != fountain.properties.id_wikidata && null != fountain.properties.id_wikidata.value) {
      dbgIdWd = fountain.properties.id_wikidata.value;
    }
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
      
      // initiate with empty promises
      let gallery_image_promise = null;
      let main_image_promise = null;
      
      let hasMain = false;
      // if a main image is defined, get that
      if(!_.isNull(fountain.properties.featured_image_name.value)){
        hasMain = true; //under the assumption that main image will not fail
        // fetch info for just the one image
        main_image_promise = this.getImageInfo('File:'+fountain.properties.featured_image_name.value, dbg+' '+city+' '+dbgIdWd,null);
      }else{
        // If there is no main image, resolve with false
        main_image_promise = new Promise((resolve, reject)=>resolve(false));
      }
      let url = null;  
      if(_.isNull(fountain.properties.wiki_commons_name.value)) {
        // TODO check whether there 'wiki_commons' in OSM and 'wetap:photo' (Q76938390) and 'flickr' (Q983774)
      }
      // check if fountain has a Wikimedia category and create gallery
      if(_.isNull(fountain.properties.wiki_commons_name.value)) {
        // if not, resolve with empty
        gallery_image_promise = new Promise((resolve, reject)=>resolve([]));
      }else{
        let catName = fountain.properties.wiki_commons_name.value;
        // if there is a gallery, then fetch all images in category
        url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=20&cmtitle=Category:${this.sanitizeTitle(encodeURIComponent(catName))}&prop=imageinfo&format=json`;
        // make array of image promises
        let gallery_image_promises = [];
  
        gallery_image_promise = api.get(url, {timeout: 2000})
          .then(r => {
            let category_members = r.data.query['categorymembers'];
            let cI = 0;
            let cTot = category_members.length;
            if (hasMain) {
              _.forEach(category_members, page => {
                if(page.title.endsWith(':'+fountain.properties.featured_image_name.value)) {
                  //since the duplicates get removed later, this would lead to a jump in the numbering
                  hasMain = false;
                }
              });
            }
            if (hasMain) {
              cTot++;
              cI++;
            }
            // fetch information for each image
            _.forEach(category_members, page => {
              cI = cI + 1;
              let dbgImg = "f-"+dbg+"_i-"+cI+"/"+cTot;  
              let pTit = page.title.toLowerCase();
              let dotPos = pTit.lastIndexOf(".");
              // only use photo media, not videos
              let ext = pTit.substring(dotPos+1);
              if( ['jpg','jpeg', 'png', 'gif','tif','tiff','svg','ogv', 'webm'].indexOf(ext)>=0){
                gallery_image_promises.push(this.getImageInfo(page.title,dbgImg + dbgIdWd,cI+"/"+cTot));
              } else {
                l.info(ext+': skipping "'+page.title+'" '+dbgImg+' '+dbgIdWd+' '+city);
              }
            });
            
            // when all images are resolved, resolve gallery
            return Promise.all(gallery_image_promises)
          })
          .catch(err => {
            // If there is an error getting the category members, then reject with error
            l.error('fillGallery.gallery_image_promise = api.get:\n'+
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
            // return empty gallery so that the gallery creation can continue (the gallery might
            // then just consist in the main image
            return [];
          })
      }
      
      
      // When all promises are resolved
      Promise.all([main_image_promise, gallery_image_promise])
        .then(r => {
          let main_image = r[0];
          let gallery = r[1];
          
          // if neither gallery nor image, then use google street view
          if(!main_image && (gallery.length === 0)){
            //now done in browser
            resolve(fountain)            
          }else{
            // if there is a main image, combine it with the gallery
            if(main_image){
              //  check if image already in gallery
              let idx = _.map(gallery, 'big').indexOf(main_image.big);
              if(idx >=0){
                // remove image from gallery (so we can add it at beginning)
                gallery.splice(idx, 1)
              }
              // add image at beginning of gallery
              gallery = [main_image].concat(gallery);
              
            }else{
              // if there is no main image, just use the gallery
            }
  
            // add gallery as value of fountain gallery property
            fountain.properties.gallery.value = gallery;
            fountain.properties.gallery.status = PROP_STATUS_OK;
            fountain.properties.gallery.comments = '';
            fountain.properties.gallery.source = 'wikimedia commons';
  
            // resolve fountain with gallery
            resolve(fountain)
          }
          
        
        })
  
        .catch(err => {
          l.error(`Failed to create gallery for fountain `+dbgIdWd+' '+city+' '+dbg);
          reject(err)
        })
      
    });
  }
  
  getImageInfo(pageTitle, dbg,iOfTot){
    return new Promise((resolve, reject) =>{
      let newImage = {};
      newImage.s = 'wd';
      newImage.pgTit = pageTitle.replace('File:','').replace(/ /g, '_');
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`;
      let timeout = 2000;
      api.get(url, {timeout: timeout})
        .then(response => {
        let data = response.data.query.pages[Object.keys(response.data.query.pages)[0]];
        if(data.hasOwnProperty('imageinfo')){
          newImage.metadata = makeMetadata(data.imageinfo[0]);
          // if image doesn't have a license url, just use plain text
          let license = newImage.metadata.license_short;
          if(newImage.metadata.license_url === null){
            license = license?(license+' '):"";
          }else{
            license = `<a href='${newImage.metadata.license_url}' target='_blank'>${newImage.metadata.license_short}</a>`
          }
          // if artist name is a link, then it usually isn't set to open in a new page. Change that
          let artist = newImage.metadata.artist;
          artist = artist?artist.replace('href', 'target="_blank" href'):"";
          // save description
          let imgUrl = `https://commons.wikimedia.org/wiki/${pageTitle}`;
          let imgDesc = `${license}&nbsp;${artist}`;
          let counterTitle=' title="See image in a new tab" '; //TODO NLS
          if (null != iOfTot) {
            //counter RFE https://github.com/lukasz-galka/ngx-gallery/issues/252
            imgDesc += '&nbsp;<a href="'+imgUrl+'" target="_blank" '+counterTitle+' >'+iOfTot+'</a>';
          } else {
            let ptLc = pageTitle.toLowerCase();
            let specFmt = null;
            if (ptLc.endsWith('.svg')) { //e.g. Q3076321 https://github.com/lukasz-galka/ngx-gallery/issues/296
              specFmt = 'svg';
            } else if (ptLc.endsWith('.ogv')) { //e.g. Q29685311 https://github.com/lukasz-galka/ngx-gallery/issues/296
              specFmt = 'ogv';
            } else if (ptLc.endsWith('.webm')) { //e.g. category "Fountains" https://commons.wikimedia.org/wiki/File:DJI_0111.webm
              specFmt = 'webm';
            }
            if (null != specFmt) {
              imgDesc += '&nbsp;<a href="'+imgUrl+'" target="_blank" '
               + counterTitle +' >'+specFmt+'</a>';
            }
          }
          newImage.description = imgDesc;
          newImage.url = imgUrl;
          resolve(newImage);
        }
        else{
          l.warn(`wikimedia.service.js getImageInfo: http request when getting metadata for "${pageTitle}" ${dbg} ${iOfTot} did not return useful data. Url: ${url}`);
          newImage.description = `Error processing image metadata from Wikimedia Commons. Request did not return relevant information. Url: ${url}`;
          newImage.url = `https://commons.wikimedia.org/wiki/${pageTitle}`;
          resolve(newImage);
        }
      }).catch(error=>{
        l.warn(`wikimedia.service.js getImageInfo: http req when getting metadata for "${pageTitle}" ${dbg} ${iOfTot} timed out or failed. Error message: ${error}. Url: ${url}`);
        newImage.description = `http request when getting metadata for ${pageTitle} timed out after 2 seconds or failed. Error message: ${error}. Url: ${url}`;
        newImage.url = `https://commons.wikimedia.org/wiki/${pageTitle}`;
        resolve(newImage);
      });
    });
    
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
  
  //deprecated should go to browser
  getImageUrl(pageTitle, imageSize=640){
    // construct url of thumbnail
    // let imgName = pageTitle.replace('File:','');
    let imgName = this.sanitizeTitle(pageTitle.replace('File:',''));
    
    let h = md5(pageTitle.replace('File:','').replace(/ /g, '_'));
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.substring(0,2)}/${imgName}/${imageSize}px-${imgName}`;
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

export default new WikimediaService();