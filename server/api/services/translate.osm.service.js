import l from '../../common/logger';
import osm_fountain_config from '../../../config/fountains.sources.osm';

// This service translates data read from a data source into the servers standardized terminology.
// For this, the config files are used

function translateOsm(fountains) {
  return new Promise((resolve, reject) => {
    // create a deep copy
    let fountains_translated = [];
  
    // for each fountain in data, remap the properties
    fountains.forEach(f=> {
      let newFountain = {};
      // copy coordinates
      newFountain.coords = {
        value: f.geometry.coordinates,
        rank: 1,
        source_name: 'Open Street Map',
        source_url: `//www.openstreetmap.org/node//${f.properties.id}`
      };
      // translate the properties
      osm_fountain_config.keys.forEach(function (key) {
        // check if fountain has key
        if (key.key in f.properties) {
          // initialize property
          newFountain[key.property] = {
            rank: key.rank,
            source_name: 'Open Street Map',
            source_url: `//www.openstreetmap.org/${f.properties.id}`,
            comment: ''
          };
          if ('separable' in key) {
            // if values can be broken up into array
            newFountain[key.property].value =
              f.properties[key.key]
                .split(key.separable.separator)
                .map((val) => {
                  let a = {};
                  a[key.separable.map_to_subproperty] = val;
                  return a;
                });
        
          } else if ('value_translation' in key) {
            // values need to be translated
            newFountain[key.property].value =
              key.value_translation[f.properties[key.key]];
          }else {
            newFountain[key.property].value = f.properties[key.key];
          }
        }
      });
      fountains_translated.push(newFountain);
    });
    // return the translated data
    resolve(fountains_translated);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 2000);
  })
}

export default translateOsm;