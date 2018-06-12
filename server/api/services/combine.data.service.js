import l from '../../common/logger';

// This service combines data from osm and wikidata

function combineData(r) {
  return new Promise((resolve, reject) => {
    let wikidata = r[0];
    let osm = r[1];
    
    // copy some properties over to osm
    if(typeof wikidata.pano_url !== 'undefined'){
      osm.properties['pano_url'] = wikidata.pano_url[0];
    }else{
      // use default panorama link
      osm.properties['pano_url'] = `https://www.instantstreetview.com/@${osm.geometry.coordinates[1]},${osm.geometry.coordinates[0]},0h,0p,1z`
    }
    
    // return the translated data
    resolve(osm);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}

export default combineData;