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
      // copy wikidata id
      newFountain['id_wikidata'] = {
        value: f.id,
        rank: 1,
        source_name: 'Wikidata',
        source_url: `//wikidata.org/wiki/${f.id}`
      };
      // translate claims
      newFountain = translate(newFountain, f.claims, wikidata_fountain_config.claims, 'claim', true);
      
      // translate site links
      newFountain = translate(newFountain, f.sitelinks, wikidata_fountain_config.sitelinks, 'sitelink');
      
      
      
      // add fountain to list
      data_translated.push(newFountain);
    });
    // return the translated data
    resolve(data_translated);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

function translate(newFountain, data, defaults, propertyName, selectFirst=false) {
  defaults.forEach(function(p){
    // check if fountain has claim
    if (p[propertyName] in data){
      // initialize property
      newFountain[p.property] = {
        rank: p.rank,
        source_name: 'Wikidata',
        source_url: `//wikidata.org/wiki/${newFountain.id_wikidata.value}`
      };
      // check if values need to be translated
      let v;
      if (selectFirst) {
        v = data[p[propertyName]][0];
      }else{
        v = data[p[propertyName]];
      }
      if('value_translation' in p){
        newFountain[p.property].value = p.value_translation(v);
      }else{
        newFountain[p.property].value = v;
      }
    }
  });
  
  return newFountain;
}


export default translateWikidata;