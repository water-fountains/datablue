import {getStaticStreetView} from "./google.service";

const _ = require ('lodash');
import WikimediaService from './wikimedia.service';

export function fillImageGalleries(fountainCollection){
  // takes a collection of fountains and returns the same collection, enhanced with image galleries when available
  return new Promise((resolve, reject) => {
    let promises = [];
    _.forEach(fountainCollection, fountain =>{
      promises.push(WikimediaService.fillGallery(fountain));
    });
    
    Promise.all(promises)
      .then(r =>resolve(r));
    
  })
}