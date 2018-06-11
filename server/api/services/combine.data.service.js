import l from '../../common/logger';

// This service combines data from osm and wikidata

function combineData(r) {
  return new Promise((resolve, reject) => {
    let wikidata = r[0];
    let osm = r[1];
    
    // copy some properties over to osm
    osm.properties['pano_url'] = wikidata.pano_url[0];
    
    // return the translated data
    resolve(osm);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

export default combineData;