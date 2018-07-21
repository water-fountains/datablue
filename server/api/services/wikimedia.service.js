const _ = require ('lodash');
const axios = require ('axios');
const https = require('https');
const md5 = require('js-md5');
import l from '../../common/logger';


class WikimediaService {
  getMainImage(fountain){
    return new Promise((resolve, reject) => {
      let main_image = {};
      main_image.value = this.getImageUrl(fountain.properties.image_url.value, 800);
      main_image.source_name = 'Wikimedia Commons';
      main_image.source_url = `//commons.wikimedi.org/wiki/${fountain.properties.wiki_commons_name.value}`;
      this.getImageInfo(main_image, `File:${fountain.properties.image_url.value}`)
        .then(r => {
          fountain.properties.main_image = main_image;
          resolve(fountain);
        })
    
    })
  }
  getImagesInCategory(fountain){
    let categoryName = fountain.properties.wiki_commons_name.value;
    return new Promise((resolve, reject) =>{
      if(_.isNull(categoryName)){
        resolve(fountain);
      }else{
        let url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=20&cmtitle=${categoryName}&prop=imageinfo&format=json`;
  
        axios.get(url)
          .then(r =>{
            let promises = [];
            _.forEach(r.data.query.categorymembers, page =>{
              let newImage = {};
              newImage.imageUrl = this.getImageUrl(page.title, 800);
              newImage.thumbnailUrl = this.getImageUrl(page.title, 30);
              promises.push(this.getImageInfo(newImage, page.title));
            });
            Promise.all(promises)
              .then(r => {
                fountain.properties.gallery = {
                  value: r,
                  rank: 1,
                  source_name: 'Wikimedia Commons',
                  source_url: `//commons.wikimedia.org/wiki/${fountain.properties.wiki_commons_name.value}`
                };
                resolve(fountain);
              });
          })
      }
      
    });
    
  }
  
  getImageInfo(newImage, pageTitle){
    return new Promise((resolve, reject) =>{
      let metadata = {};
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${pageTitle.replace(/ /g, '_').replace(/&/g, '%26')}&prop=imageinfo&iiprop=extmetadata&format=json`;
      axios.get(url)
        .then(response => {
        let data = response.data.query.pages[Object.keys(response.data.query.pages)[0]].imageinfo[0];
        newImage.metadata = makeMetadata(data);
        resolve(newImage);
    
      }).catch(error=>{
        l.debug(`Error getting metadata for ${pageTitle}`);
        reject(error);
      });
    });
    
  }
  
  getImageUrl(pageTitle, imageSize=640){
    // construct url of thumbnail
    let imgName = pageTitle.replace(/ /g, '_').replace(/&/g, '%26').replace('File:','');
  
    let h = md5(imgName);
    return `//upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.substring(0,2)}/${imgName}/${imageSize}px-${imgName}`;
  }
}

function makeMetadata(data){
  let template = [
      {
      sourceName: 'ImageDescription',
      outputName: 'description'
    },{
      sourceName: 'DateTimeOriginal',
      outputName: 'date_taken'
    },{
      sourceName: 'Artist',
      outputName: 'artist'
    },{
      sourceName: 'LicenseShortName',
      outputName: "license_short"
    },{
      sourceName: 'UsageTerms',
      outputName: 'license_long'
    },{
      sourceName: 'LicenceUrl',
      outputName: 'license_url'
    },
  ];
  let metadata = {};
  _.forEach(template, pair=>{
    if(data.extmetadata.hasOwnProperty('LicenceUrl')){
      metadata[pair.outputName] = data.extmetadata[pair.sourceName].value;
    }else{
      metadata[pair.outputName] = null;
    }
  });
  
  return metadata;
}

export default new WikimediaService();