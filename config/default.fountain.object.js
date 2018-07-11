export const default_fountain = {
  properties: {
    name:{
      value: 'Unnamed fountain',
      rank: 10
  },
    id_osm:{
      value: 'no match found in Open Street Map',
      rank: 10
  },
    id_wikidata:{
      value: 'no match found in Wikidata',
      rank: 10
  },
    construction_date:{
      value: null,
      rank: 10
  },
    availability:{
      value: null,
      rank: 10
  },
    floor_level:{
      value: null,
      rank: 10
  },
    fixme:{
      value: '',
      rank: 10
  },
    directions:{
      value: null,
      rank: 10
  },
    pano_url:{
      value: null,
      rank: 10
  },
    image_url:{
      value: null,
      rank: 10
  },
    coords:{
      value: [],
      rank: 10
    },
    water_type:{
      value: 'no water type defined',
      rank: 10
    }
}
};

export function processImageUrl(fountain) {
  if (true){  //(fountain.image_url.value === null){
    return `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${fountain.coords.value[1]},${fountain.coords.value[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
  }else{
    let imgString = fountain.image_url.value.replace(/ /g, '_');
    return `//upload.wikimedia.org/wikipedia/commons/thumb/5/52/${imgString}/${imgString}`;
  }
}


export function processPanoUrl(fountain) {
  if(fountain.pano_url.value === null){
    return `//instantstreetview.com/@${fountain.coords.value[1]},${fountain.coords.value[0]},0h,0p,1z`;
  }else{
    return fountain.pano_url.value;
  }
}