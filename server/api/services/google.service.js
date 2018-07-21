export function getStaticStreetView(fountain){
  return new Promise((resolve, reject)=>{
    let main_image = {};
    main_image.value = `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
    main_image.source_name =  'Google Street View';
    main_image.source_url = '//google.com';
    fountain.properties.main_image = main_image;
    resolve(fountain);
  })
}