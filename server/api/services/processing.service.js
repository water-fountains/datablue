import {getStaticStreetView} from "./google.service";

const _ = require ('lodash');
import WikimediaService from './wikimedia.service';
import wikidata_fountain_config from "../../../config/fountains.sources.wikidata";
import {default_fountain} from "../../../config/default.fountain.object";

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

export function createUniqueIds(fountainCollection){
  // takes a collection of fountains and returns the same collection, enhanced with unique and as persistent as possible ids
  return new Promise((resolve, reject) => {
    let i_n = 0;
    fountainCollection.forEach(f => {
      f.properties.id = i_n;
      f.properties.id_datablue = {
        value: i_n
      };
      i_n += 1;
    });
    resolve(fountainCollection)
  });
}

export function essenceOf(fountainCollection) {
  // returns a version of the fountain data with only the essential data
  let newCollection = {
    type: 'FeatureCollection',
    features: []
  };
  
  let essentialPropNames = _.map(default_fountain.properties, (p, p_name)=>{if (p.essential) {return p_name} });
  
  fountainCollection.features.forEach(f=>{
    let props = _.pick(f.properties, essentialPropNames);
    props = _.mapValues(props, (obj)=>{
      return obj.value
    });
    // add id manually, since it does not have the standard property structure
    props.id = f.properties.id;
    
    // create feature
    newCollection.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: f.geometry.coordinates
      },
      properties: props
    })
  });
  
  return newCollection;
  
}

export function fillOutNames(fountainCollection) {
  // takes a collection of fountains and returns the same collection, with holes in fountain names filled best possible way
  return new Promise((resolve, reject) => {
    let langs = ['en','de','fr'];
    fountainCollection.forEach(f => {
      // fill default name if not filled
      if(f.properties.name.value === ''){
        for(let lang of langs){
          if(f.properties[`name_${lang}`].value !== ''){
            f.properties.name = f.properties[`name_${lang}`];
            f.properties.name.comment = `Value taken from language ${lang}.`;
            break;
          }
        }
      }
      // fill specific names if not filled and a default name exists
      if(f.properties.name.value !== '') {
        for (let lang of langs) {
          if (f.properties[`name_${lang}`].value === '') {
            f.properties[`name_${lang}`] = _.clone(f.properties.name);
            if(!(f.properties.name.hasOwnProperty('comment')) || f.properties.name.comment === ''){
              f.properties[`name_${lang}`].comment = 'Value taken from default.';
            }
          }
        }
      }
      
    });
    resolve(fountainCollection)
  });
}