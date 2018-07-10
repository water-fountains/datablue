import l from '../../common/logger';
import osm_fountain_config from '../../../config/fountains.sources.osm';

// This service translates data read from a data source into the servers standardized terminology.
// For this, the config files are used

function applyImpliedPropertiesOsm(fountains) {
  return new Promise((resolve, reject) => {
    // for each fountain in data, remap the properties
    fountains.forEach(f=> {
      // apply implied properties
      osm_fountain_config.sub_sources.forEach(function (sub_source) {
        let tag_name = sub_source.tag.name;
        let tag_value = sub_source.tag.value;
        // check if our fountain has the tag
        if ((tag_name in f.properties) &&
          (f.properties[tag_name] === tag_value)) {
          sub_source.implies.forEach(implication => {
            // apply implied property values
            f.properties[implication.key] = implication.value;
          })
        }
      });
    });
    // return the fountains with added properties
    resolve(fountains);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

export default applyImpliedPropertiesOsm;