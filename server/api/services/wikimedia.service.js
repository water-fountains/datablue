import {getStaticStreetView} from "./google.service";

const utf8 = require('utf8');
const _ = require ('lodash');
const axios = require ('axios');
const https = require('https');
const md5 = require('js-md5');
import l from '../../common/logger';


class WikimediaService {
  fillGallery(fountain){
    // fills gallery with images from wikidata, wikimedia commons,
    // todo: add osm as a possible source (although images shouldn't really be linked there.
    return new Promise((resolve, reject) => {
      // initialize default gallery
      fountain.properties.gallery = {
        value: [{
          big: './assets/gallery_placeholder_lg.png',
          medium: './assets/gallery_placeholder_med.png',
          small: './assets/gallery_placeholder_small.png',
          description: 'add an image'
        }]
      };
      // if no image is entered, use a google street view image
      if(_.isNull(fountain.properties.image_url.value)){
        fountain.properties.image_url.source_name = 'Google Street View';
        getStaticStreetView(fountain)
          .then(image=>{
            fountain.properties.gallery.value = [image].concat(fountain.properties.gallery.value);
            resolve(fountain);
          })
      }
      // check if fountain has a main image but no wikimedia category
      else if(!_.isNull(fountain.properties.image_url.value) &&
        _.isNull(fountain.properties.wiki_commons_name.value)){
        fountain.properties.gallery.source_name = 'Wikimedia Commons';
        fountain.properties.gallery.source_url = `//commons.wikimedia.org/wiki/${fountain.properties.image_url.value}`;
        // fetch info for just the one image
        this.getImageInfo('File:'+fountain.properties.image_url.value)
          .then(r=>{
            fountain.properties.gallery.value = [r].concat(fountain.properties.gallery.value);
            resolve(fountain);
          })
      }
      // check if fountain also has a Wikimedia category
      else if(!_.isNull(fountain.properties.wiki_commons_name.value)) {
        // if so, update image source
        fountain.properties.gallery.source_url = `//commons.wikimedia.org/wiki/${fountain.properties.wiki_commons_name.value}`;
  
        // fetch all images in category
        let url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=20&cmtitle=${fountain.properties.wiki_commons_name.value}&prop=imageinfo&format=json`;
  
        axios.get(url)
          .then(r => {
            let image_promises = [];
            let category_members = r.data.query.categorymembers;
      
            // make sure main image is at the beginning of the list of images
            let category_members_sorted = _.sortBy(category_members, function (page) {
              return page.title.includes(fountain.properties.image_url.value) ? 0 : 1;
            });
      
            // fill in information for each image
            _.forEach(category_members_sorted, page => {
              image_promises.push(this.getImageInfo(page.title));
            });
            Promise.all(image_promises)
              .then(r => {
                fountain.properties.gallery.value = r.concat(fountain.properties.gallery.value);
                resolve(fountain);
              });
          })
      }
      
    });
  }
  
  getImageInfo(pageTitle){
    return new Promise((resolve, reject) =>{
      let newImage = {};
      newImage.big = this.getImageUrl(pageTitle, 1200);
      newImage.medium = this.getImageUrl(pageTitle, 512);
      newImage.small = this.getImageUrl(pageTitle, 120);
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${this.sanitizeTitle(pageTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`;
      axios.get(url)
        .then(response => {
          try{
            let data = response.data.query.pages[Object.keys(response.data.query.pages)[0]];
            if(data.hasOwnProperty('imageinfo')){
              newImage.metadata = makeMetadata(data.imageinfo[0]);
              newImage.description = `<a href='${newImage.metadata.license_url}' target=blank>${newImage.metadata.license_short}</a> ${newImage.metadata.artist}`;
              newImage.url = `https://commons.wikimedia.org/wiki/${pageTitle}`;
              resolve(newImage);
            }
        }catch (error){
            l.info(error)
          }
    
      }).catch(error=>{
        l.debug(`Error getting metadata for ${pageTitle}`);
        reject(error);
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
    let imgName = this.sanitizeTitle(pageTitle).replace('File:','');
  
    let h = md5(pageTitle.replace('File:','').replace(/ /g, '_'));
    return `//upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.substring(0,2)}/${imgName}/${imageSize}px-${imgName}`;
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