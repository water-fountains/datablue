import l from '../../common/logger';
import wikidata_fountain_config from '../../../config/fountains.sources.wikidata';

// This service translates data read from a data source into the servers standardized terminology.
// For this, the config files are used

function translateWikidata(fountains) {
  // assume a list of fountains
  return new Promise((resolve, reject) => {
    // create a deep copy
    let data_translated = [];
  
    // for each fountain in data, remap the properties
    fountains.forEach(f=>{
      let newFountain = {};
      // translate claims
      wikidata_fountain_config.claims.forEach(function(c){
        // check if fountain has claim
        if (c.claim in f.claims){
          // initialize property
          newFountain[c.property] = {
            rank: c.rank,
            source_name: 'wikidata',
            source_url: `//wikidata.org/wiki/${f.id}`
          };
          // check if values need to be translated
          if('value_translation' in c){
            newFountain[c.property].value =
              c.value_translation(f.claims[c.claim][0]);
          }else{
            newFountain[c.property].value = f.claims[c.claim][0];
          }
        }
      });
      // add fountain to list
      data_translated.push(newFountain);
    });
    // return the translated data
    resolve(data_translated);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}



export default translateWikidata;