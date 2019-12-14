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
  fillGallery(fountain, dbg){
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
      
      
      // if a main image is defined, get that
      if(!_.isNull(fountain.properties.featured_image_name.value)){
        // fetch info for just the one image
        main_image_promise = this.getImageInfo('File:'+fountain.properties.featured_image_name.value, dbg)
      }else{
        // If there is no main image, resolve with false
        main_image_promise = new Promise((resolve, reject)=>resolve(false));
      }
  
      
      // check if fountain has a Wikimedia category and create gallery
      if(_.isNull(fountain.properties.wiki_commons_name.value)) {
        // if not, resolve with empty
        gallery_image_promise = new Promise((resolve, reject)=>resolve([]));
      }else{
        // if there is a gallery, then fetch all images in category
        let url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=20&cmtitle=Category:${this.sanitizeTitle(encodeURIComponent(fountain.properties.wiki_commons_name.value))}&prop=imageinfo&format=json`;
        // make array of image promises
        let gallery_image_promises = [];
  
        gallery_image_promise = api.get(url, {timeout: 5000})
          .then(r => {
            let category_members = r.data.query['categorymembers'];
            let cI = 0;
            let cTot = category_members.length;
            // fetch information for each image
            _.forEach(category_members, page => {
              cI = cI + 1;
              // only use photo media, not videos
              let ext = page.title.slice(-3).toLowerCase();
              if( ['jpg', 'png', 'gif'].indexOf(ext)>=0){
                gallery_image_promises.push(this.getImageInfo(page.title,"f-"+dbg+"_i-"+cI+"/"+cTot));
              }
            });
            
            // when all images are resolved, resolve gallery
            return Promise.all(gallery_image_promises)
            
            
          })
          .catch(err => {
            // If there is an error getting the category members, then reject with error
            l.error(`Failed to fetch category members. Url: ${url}`);
            // add gallery as value of fountain gallery property
            fountain.properties.gallery.issues.push({
              data: err,
              context: {
                fountain_name: fountain.properties.name.value,
                property_id: 'gallery',
                id_osm: fountain.properties.id_osm.value,
                id_wikidata: fountain.properties.id_wikidata.value
              },
              type: 'data_processing',
              level: 'error',
              message: `Failed to fetch category members from Wikimedia Commons. Url: ${url}`,
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
            fountain.properties.featured_image_name.source = 'Google Street View';
            getStaticStreetView(fountain)
              .then(image=>{
                fountain.properties.gallery.value = [image].concat(fountain.properties.gallery.value);
                fountain.properties.gallery.comments = 'Image obtained from Google Street View Service because no Wikimedia Commons image is associated with the fountain.';
                fountain.properties.gallery.status = PROP_STATUS_INFO;
                fountain.properties.gallery.source = 'google';
      
                resolve(fountain);
              })
            
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
          l.error(`Failed to create gallery for fountain.`);
          reject(err)
        })
      
    });
  }
  
  getImageInfo(pageTitle, dbg){
    return new Promise((resolve, reject) =>{
      let newImage = {};
      newImage.big = this.getImageUrl(pageTitle, 1200);
      newImage.medium = this.getImageUrl(pageTitle, 512);
      newImage.small = this.getImageUrl(pageTitle, 120);
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`;
      api.get(url, {timeout: 2000})
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
          newImage.description = `${license}${artist}`;
          newImage.url = `https://commons.wikimedia.org/wiki/${pageTitle}`;
          resolve(newImage);
        }
        else{
          l.warn(`http request when getting metadata for ${pageTitle} ${dbg} did not return useful data. Url: ${url}`);
          newImage.description = `Error processing image metadata from Wikimedia Commons. Request did not return relevant information. Url: ${url}`;
          newImage.url = `https://commons.wikimedia.org/wiki/${pageTitle}`;
          resolve(newImage);
        }
      }).catch(error=>{
        l.warn(`http request when getting metadata for ${pageTitle} ${dbg} timed out or failed. Error message: ${error}. Url: ${url}`);
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