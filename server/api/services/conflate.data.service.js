import l from '../../common/logger';

// This service combines data from osm and wikidata

export function combineData(r) {
  // simple function for combining data from wikidata and osm in a basic way: only panorama url is copied over
  return new Promise((resolve, reject) => {
    let wikidata = r[0];
    let osm = r[1];
    
    // copy some properties over to osm
    if(typeof wikidata.pano_url.value !== 'undefined'){
      osm['pano_url'] = wikidata.pano_url;
    }else{
      // use default panorama link
      osm['pano_url'] = {
        value: `https://www.instantstreetview.com/@${osm.coords.value[1]},${osm.coords.value[0]},0h,0p,1z`
      }
    }
    // format data as a geojson feature
    let data_geojson = {
      geometry:{
        type: 'Point',
        coordinates: osm.coords.value
      },
      properties: {}
    };
    Object.keys(osm).forEach(key=>{
      data_geojson.properties[key] = osm[key].value;
    });
    // return the translated data
    resolve(data_geojson);
    // if there is an issue, reject the promise
    setTimeout(() => reject('woops'), 500);
  })
}
export function conflate(r) {
  return new Promise((resolve, reject)=>{
    // todo: instead of just returning the data, it must be conflated (identify matching fountains and merge)
    resolve(r);
  })
}