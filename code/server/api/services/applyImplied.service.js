import l from '../../common/logger';
import osm_fountain_config from '../../../config/fountains.sources';

// This service translates data read from a data source into the servers standardized terminology.
// For this, the config files are used

function applyImpliedPropertiesOsm(data) {
  return new Promise((resolve, reject) => {
    // remap the properties
    osm_fountain_config.sub_sources.forEach(function(sub_source){
      let tag_name = sub_source.tag.name;
      let tag_value = sub_source.tag.value;
      // check if our fountain has the tag
      if((tag_name in data.properties) &&
        (data.properties[tag_name] === tag_value)){
        sub_source.implies.forEach(implication =>{
          // apply implied property values
          data.properties[implication.key] = implication.value;
        })
      }
    });
    // return the translated data
    resolve(data);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

export default applyImpliedPropertiesOsm;