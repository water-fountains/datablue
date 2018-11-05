import l from '../../common/logger';
import wikidata_fountain_config from '../../../config/fountains.sources.wikidata';
import {PROP_STATUS_OK} from "../../common/constants";

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
        source_url: `https://wikidata.org/wiki/${f.id}`,
        comment: '',
        status: PROP_STATUS_OK
      };
      // translate claims
      newFountain = translate(newFountain, f, 'claims');
      
      // translate site links
      newFountain = translate(newFountain, f, 'sitelinks');
      
      // translate labels (names
      newFountain = translate(newFountain, f, 'labels');
      
      
      
      // add fountain to list
      data_translated.push(newFountain);
    });
    // return the translated data
    resolve(data_translated);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

function translate(newFountain, data, pCat) {
  wikidata_fountain_config[pCat].props.forEach(function(p){
    // check if fountain has claim
    if (p.src_p_name in data[pCat]){
      // initialize property
      newFountain[p.dst_p_name] = {
        rank: p.rank,
        source_name: 'Wikidata',
        source_url: `https://wikidata.org/wiki/${newFountain.id_wikidata.value}`,
        comment: '',
        status: PROP_STATUS_OK
      };
      // check if values need to be translated
      if('value_translation' in p){
        newFountain[p.dst_p_name].value = p.value_translation(data[pCat][p.src_p_name]);
      }else{
        let v;
        if (wikidata_fountain_config[pCat].val_in_array) {
          v = data[pCat][p.src_p_name][0];
        }else{
          v = data[pCat][p.src_p_name];
        }
        if(wikidata_fountain_config[pCat].val_is_obj){
          newFountain[p.dst_p_name].value = v.value;
        }else{
          newFountain[p.dst_p_name].value = v
        }
      }
    }
  });
  
  return newFountain;
}


export default translateWikidata;