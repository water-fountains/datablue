import {getStaticStreetView} from "./google.service";

const _ = require ('lodash');
import WikimediaService from './wikimedia.service';

export function fillWikimediaImageGallery(fountainCollection){
  // takes a collection of fountains and returns the same collection, enhanced with image galleries when available
  return new Promise((resolve, reject) => {
    let promises = [];
    _.forEach(fountainCollection, fountain =>{
      promises.push(WikimediaService.getImagesInCategory(fountain));
    });
    
    Promise.all(promises)
      .then(r =>resolve(r));
    
  })
}


export function getMainImage(fountains){
  return new Promise((resolve, reject) => {
    let fPromises = [];
    _.forEach(fountains, fountain=>{
      if(_.isNull(fountain.properties.image_url.value)){
        // get image from google API
        fPromises.push(getStaticStreetView(fountain));
      }else {
        fPromises.push(WikimediaService.getMainImage(fountain));
      }
    });
    
    Promise.all(fPromises)
      .then(r=>resolve(r))
    
  });
}