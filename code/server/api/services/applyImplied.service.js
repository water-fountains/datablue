import l from '../../common/logger';
import osm_fountain_config from '../../../config/fountains.sources';

// This service translates data read from a data source into the servers standardized terminology.
// For this, the config files are used

function applyImpliedPropertiesOsm(data) {
  return new Promise((resolve, reject) => {
    // create a deep copy
    let data_translated = JSON.parse(JSON.stringify(data));
    // delete all properties
    data_translated.properties = {};
    // remap the properties
    osm_fountain_config.keys.forEach(function(key){
      if('separable' in key){
        // if values can be broken up into array
        data_translated['properties'][key.property] =
          data.properties[key.key]
            .split(key.separable.separator)
            .map((val)=>{
              let a = {};
              a[key.separable.map_to_subproperty] = val;
              return a;
            });
        
      }else if('value_translation' in key){
        // values need to be translated
        data_translated['properties'][key.property] =
          key.value_translation[data.properties[key.key]];
        
      }else{
        data_translated['properties'][key.property] = data.properties[key.key];
      }
    });
    // return the translated data
    resolve(data_translated);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

export default applyImpliedPropertiesOsm;