import l from '../../common/logger';
import wikidata_fountain_config from '../../../config/fountains.sources.wikidata';

// This service translates data read from a data source into the servers standardized terminology.
// For this, the config files are used

function translateWikidata(data) {
  return new Promise((resolve, reject) => {
    // create a deep copy
    let data_translated = {};

    // remap the properties
    wikidata_fountain_config.claims.forEach(function(c){
      if('value_translation' in c){
        // values need to be translated
        data_translated[c.property] =
          c.value_translation[data.claims[c.claim]];
        
      }else{
        
        data_translated[c.property] = data.claims[c.claim];
      }
    });
    // return the translated data
    resolve(data_translated);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

export default translateWikidata;