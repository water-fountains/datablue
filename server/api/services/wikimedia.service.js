/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import {getStaticStreetView} from "./google.service";


const _ = require ('lodash');
const axios = require ('axios');
const { ConcurrencyManager } = require("axios-concurrency");
import l from '../../common/logger';
import {PROP_STATUS_ERROR, PROP_STATUS_INFO, PROP_STATUS_OK, PROP_STATUS_WARNING,
	MAX_IMG_SHOWN_IN_GALLERY//, LANGS
	} from "../../common/constants";
	import {locations} from '../../../config/locations';
        
const sharedConstants = require('./../../common/shared-constants');


let api = axios.create({});

// a concurrency parameter of 1 makes all api requests sequential
const MAX_CONCURRENT_REQUESTS = 200;

// init your manager.
const manager = ConcurrencyManager(api, MAX_CONCURRENT_REQUESTS);


class WikimediaService {

  
  getName(f) {
	  const props = f.properties;
    if(props.name.value === null){
      for(let lang of sharedConstants.LANGS){
    	  const pL= props[`name_${lang}`];
        if(null != pL && pL.value !== null){
        	return pL.value;
        }
      }
    } 
    return props.name.value;
  }
    
  getImgsFromCats(fProps, dbg,city,dbgIdWd,name,imgNoInfoPomises, imgUrlSet, imgUrls,debugAll) {
	  let catNames = fProps.wiki_commons_name.value;
	  if (1 < catNames.length) {
		  if (debugAll || 2 < catNames.length) {
			  l.info('wikimedia.service.js: '+catNames.length+' commons categories defined "'+dbg+' '
					  +city+' '+dbgIdWd+' "'+name+'" '+new Date().toISOString());
		  }
	  }
	  let catName = 'unkCatNam';
	  for(let i = 0;i < catNames.length; i++) {
		  const cat = catNames[i];
		  catName = cat.c;
		  if (65 == i) {
			  l.info('wikimedia.service.js: '+catNames.length+' commons categories defined "'+dbg+' '
					  +city+' '+dbgIdWd+' "'+name+'" '+new Date().toISOString());
		  }
//		  lastCatName = catName;
		  const imgNoInfoPomise = getImgsOfCat(cat, dbg, city, imgUrlSet, imgUrls, dbgIdWd, fProps,debugAll);
		  //TODO we might prioritize categories with small number of images to have greater variety of images?
		  imgNoInfoPomises.push(imgNoInfoPomise);
	  }
  }
    
  fillGallery(fountain, dbg, city, debugAll, allMap){
    let dbgIdWd = null;
//    if (debugAll) {
//       l.info('wikimedia.service.js starting fillGallery: '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
//    }
    if (null != fountain.properties.id_wikidata && null != fountain.properties.id_wikidata.value) {
      dbgIdWd = fountain.properties.id_wikidata.value;
    }
    let url = 'unkUrl';
    let lastCatName = 'undefCatNam';
    let lastCatUrl =  'undefCatUrl';
    let name = this.getName(fountain);
    // fills gallery with images from wikidata, wikimedia commons,
    // todo: add osm as a possible source (although images shouldn't really be linked there.
    let fProps = fountain.properties;
    return new Promise((resolve, reject) => {
      // initialize default gallery
      // setTimeout(()=>{
      //   l.info(`fountain ran out of time getting information. Osm ID: ${fountain.properties.id_osm.value}`);
      //   reject('ran out of time')
      // }, 1000);
      fProps.gallery = {
        value: [],
        issues: [],
        status: PROP_STATUS_WARNING,
        type: 'object',
        // name: 'gallery',  // don't give it a name so it doesn't appear in the list
        comments: ''
      };

      let galVal = fProps.gallery.value;
      let imgUrls = [];
      let imgUrlSet = new Set();
      let foFeaImgs = fProps.featured_image_name;
      let foFeaImgsV = foFeaImgs.value;
      let added = addToImgList(foFeaImgsV, imgUrlSet, imgUrls, dbg + ' '+ dbgIdWd, debugAll,{n:'wd:p18'});
      let imgNoInfoPomises = [];
      let noCats = _.isNull(fProps.wiki_commons_name.value) || 0 == fProps.wiki_commons_name.value.length; 
      if(noCats) {
        // if not, resolve with empty
        if(process.env.NODE_ENV !== 'production' && debugAll) {
          l.info('wikimedia.service.js: no commons category defined "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
        }
        imgNoInfoPomises.push(new Promise((resolve, reject)=>resolve(false)));
      } else {
    	  if (0 < imgUrls.length) {
    		  if(process.env.NODE_ENV !== 'production' && debugAll) {
    			  l.info('wikimedia.service.js: lazyLoad no need to analyze commons category now (already '+imgUrls.length+' featured img) "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
    		  }
    		  imgNoInfoPomises.push(new Promise((resolve, reject)=>resolve(false)));
    	  } else {
    		  this.getImgsFromCats(fProps, dbg,city,dbgIdWd,name,imgNoInfoPomises, imgUrlSet, imgUrls,debugAll); 
    	  }
      }
      Promise.all(imgNoInfoPomises)
      .then(cr => {
    	  let totImgFound = imgUrlSet.size; 
      if (0 < totImgFound) {
    	if (debugAll) {
    		l.info('wikimedia.service.js: fillGallery imgUrlSet.size '+totImgFound+' "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
    	}
    	if (MAX_IMG_SHOWN_IN_GALLERY < totImgFound) {
    		l.info('wikimedia.service.js: fillGallery only showing first '+MAX_IMG_SHOWN_IN_GALLERY+' out of imgUrlSet.size '+totImgFound+' "'+dbg+'" '+city+' '+dbgIdWd+' '+new Date().toISOString());
    	}
        let galValPromises = [];
        let k = 0;
        const imgL = imgUrls.length;
        const maxImgPreFetched = 0; //as long as we don't filter for pre-fetched info, why prefetch ? https://github.com/water-fountains/datablue/issues/41
        for(;k < maxImgPreFetched && k < imgL;k++) { //only 5 imgs are on the gallery-preview
        	const img = imgUrls[k];
        	const imgFromMap = allMap.get(img.typ+'_'+img.val);
        	if (null != imgFromMap) {
        		galValPromises.push(imgFromMap.i);
        		let callers = imgFromMap.c;
        		l.info('wikimedia.service.js: fillGallery img "'+img.val+'" already in other fountain(s) "'+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
        		for(let clr of callers) {
            		l.info('wikimedia.service.js: fillGallery img also in  "'+clr+'" '+new Date().toISOString());
        		}
        		callers.push(dbg);
        	} else {
        		let nImg = {s: img.src,pgTit: img.val,c: img.cat,t:img.typ};
        		galValPromises.push(getImageInfo(nImg, k+'/'+imgL+' '+dbg+' '+city+' '+dbgIdWd, false).catch(giiErr=>{
        			l.info('wikimedia.service.js: fillGallery getImageInfo failed for "'+img.val+'" '+dbg+' '+city+' '+dbgIdWd+' cat "'+img.cat+'" '+new Date().toISOString()
        					+ '\n'+giiErr.stack);
                     	     }
        		        )
        		   );
        	}
        }
        for(;maxImgPreFetched <= k && k < imgL && k < MAX_IMG_SHOWN_IN_GALLERY;k++) { //between 6 && 50 imgs are on the gallery-preview
        	const img = imgUrls[k];
    		let nImg = {s: img.src,pgTit: img.val,c: img.cat,t:img.typ};
        	galValPromises.push(nImg);
        }        
        if (debugAll) {
        	l.info('wikimedia.service.js: fillGallery galValPromises.length '+galValPromises.length+' '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
        }
        Promise.all(galValPromises).then(r => {
          if (debugAll) {
        		l.info('wikimedia.service.js: fillGallery galValPromises.r.length '+r.length+' '+dbg+' '+city+' '+dbgIdWd+' '+new Date().toISOString());
          }
          galVal = galVal.concat(r);
          try {
        	  if (null != galVal && 0 < galVal.length) {
        		  for(let i=0; i < galVal.length && i < maxImgPreFetched;i++) {
        			  let img = galVal[i];
        			  if (null != img) {
        				  let imMetaDat = img.metadata; 
        				  if (null != imMetaDat) {
        					  const fromMap = allMap.get(img.typ+'_'+img.pgTit);
        					  if (null == fromMap) {
        						  let callers = new Set();
        						  callers.add(dbg);
        						  allMap.set(img.typ+'_'+img.pgTit,{i:img,
        							              clrs:callers});
        					  }
        				  }
        			  }
        		  }
        	  }
          } catch (err) {
        	  l.info('wikimedia.service.js fillGallery: map operation failed '+err.stack);
          }
          fountain.properties.gallery.value = galVal;
          fountain.properties.gallery.status = PROP_STATUS_OK;
          fountain.properties.gallery.comments = '';
          fountain.properties.gallery.source = 'wiCommns';
          fountain.properties.gallery.totImgs = totImgFound; //TODO display in GUI if > MAX_IMG_SHOWN_IN_GALLERY
          resolve(fountain);      
        });
      } else {
         //could check the qualifiers as per https://github.com/water-fountains/proximap/issues/294
    	if (debugAll) {
    		l.info("wikimedia.service.js: fillGallery "+dbgIdWd+" has no img "+city+ 
    				' '+dbg+' '+new Date().toISOString());
    	}
        resolve(fountain);      
      }
      });     
    }).catch(err => {
      // If there is an error getting the category members, then reject with error
      l.error('fillGallery.gallery_image_promise = api.get:\n'+
           `Failed to fetch category members. Cat "`+lastCatName+'" ' +dbg + ' '+ dbgIdWd 
             + ' url '+lastCatUrl+'\n'+err.stack);
        // add gallery as value of fountain gallery property
        fountain.properties.gallery.issues.push({
        data: err,
              context: {
                fountain_name: fountain.properties.name.value,
                property_id: 'gallery',
                id_osm: fountain.properties.id_osm.value,
                id_wikidata: fountain.properties.id_wikidata.value
              },
              timeStamp: new Date(),
              type: 'data_processing',
              level: 'error',
              message: `Failed to fetch category members from Wikimedia Commons. Url: ${url} `+dbg,
            });
            // return empty gallery so that the gallery creation can continue (the gallery might
            // then just consist in the main image
            return [];
          })
    ;
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
      sourceName: 'LicenseUrl',
      outputName: 'license_url'
    },
  ];
  let metadata = {};
  _.forEach(template, pair=>{
    if(data.extmetadata.hasOwnProperty(pair.sourceName)){
      metadata[pair.outputName] = data.extmetadata[pair.sourceName].value;
    }else{
      metadata[pair.outputName] = null;
    }
  });
  
  return metadata;
}

function sanitizeTitle(title){
    // this doesn't cover all situations, but the following doesn't work either
    // return encodeURI(title.replace(/ /g, '_'));
    return title
      .replace(/ /g, '_')
      .replace(/,/g, '%2C')
      // .replace(/ü/g, '%C3%BC')
      .replace(/&/g, '%26');
  }

function addToImgList(imgListWithSource, imgUrlSet, imgUrls, dbg, debugAll, cat) {
    let i = -1;
    if (null != imgListWithSource && null != imgListWithSource.imgs) {
      i++;
      let duplicateCount = 0;
      for(let foFeaImg of imgListWithSource.imgs) {
        let imgNam = foFeaImg.value;
        if (null == foFeaImg.typ) {
        	foFeaImg.typ = imgListWithSource.type;
        }
        let pTit = imgNam.toLowerCase();
        let dotPos = pTit.lastIndexOf(".");
        // only use photo media, not videos
        let ext = pTit.substring(dotPos+1);
        if(['jpg','jpeg', 'png', 'gif','tif','tiff','svg','ogv', 'webm'].indexOf(ext)<0
        		&& !foFeaImg.typ.startsWith('ext-')){
          l.info('wikimedia.service.js addToImgList '+ext+': skipping "'+page.title+'" '+dbgImg+' '+dbgIdWd+' '+city);
          //https://github.com/lukasz-galka/ngx-gallery/issues/296 to handle svg, ogv, webm
          continue;
        }
        if ('wm'==foFeaImg.typ) {
        //if ('wd'==imgListWithSource.src ||'osm'==imgListWithSource.src) {
          if (!imgUrlSet.has(imgNam)) {
            imgUrlSet.add(imgNam);
            let img = {
              src: imgListWithSource.src,
              val: foFeaImg.value,
              typ:'wm',
              cat: cat
            }
            imgUrls.push(img);
            i++;
          } else {
        	  if (debugAll) {
        		  l.info('wikimedia.service.js addToImgList foFeaImg: duplicate  "'+imgNam+'" ' +i + '/' +imgListWithSource.imgs.length + ' - ' +dbg + ' '+new Date().toISOString());
        	  }
        	  duplicateCount++;
          }
        } else if ('flickr'==foFeaImg.typ || foFeaImg.typ.startsWith('ext-')) {
            if (!imgUrlSet.has(imgNam)) {
              imgUrlSet.add(imgNam);
              let srce = foFeaImg.src;
              if (null == srce) {
            	  srce = imgListWithSource.src;
              }
              let img = {
                src: srce,
                val: foFeaImg.value,
                typ:foFeaImg.typ,
                cat: cat
              }
              imgUrls.push(img);
              i++;
            } else {
          	  if (debugAll) {
          		  l.info('wikimedia.service.js addToImgList foFeaImg: duplicate  "'+imgNam+'" ' +i + '/' +imgListWithSource.imgs.length + ' - ' +dbg + ' '+new Date().toISOString());
          	  }
          	  duplicateCount++;
            }
          } else {
            l.info('wikimedia.service.js addToImgList foFeaImg: unknown src "'+imgListWithSource.src+'" "'+imgNam+'" ' +dbg + ' '+new Date().toISOString());
        }    
      };
      if (0 < duplicateCount && debugAll
    		  ) {
		  l.info('wikimedia.service.js addToImgList foFeaImg: '+duplicateCount+' duplicates found among ' +imgListWithSource.imgs.length + ' - ' +dbg + ' '+new Date().toISOString());
      }
      if (1 < imgListWithSource.imgs.length && debugAll) {
        if(process.env.NODE_ENV !== 'production') {
          l.info('wikimedia.service.js addToImgList foFeaImg: added '+imgListWithSource.imgs.length+' ' +dbg);
        }
      }
    }
    return i;  
  }


export function getImageInfo(img, dbg, showDetails){
	let pageTitle = img.pgTit;
    return new Promise((resolve, reject) =>{
      //TODO: could also say which category it was
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:'+pageTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`;
      const timeoutSecs = 1;
      let timeout = timeoutSecs*1000; 
//      l.info('wikimedia.service.js: getImageInfo '+dbg+' '+url+' '+new Date().toISOString());
      api.get(url, {timeout: timeout})
        .then(response => {
        let keys = Object.keys(response.data.query.pages);
        let key = keys[0];
        let pags =response.data.query.pages;
        let data = pags[key];
        if(data.hasOwnProperty('imageinfo')){
          img.metadata = makeMetadata(data.imageinfo[0]);
          if (showDetails) {
        	  l.info('wikimedia.service.js getImageInfo: done '+dbg+' "'+url+'" cat "'+img.c+'" '+new Date().toISOString());
          }
          resolve(img);
        } else{
          l.warn(`wikimedia.service.js getImageInfo: http request when getting metadata for "${pageTitle}" ${dbg} did not return useful data in ${timeoutSecs} secs. Url: ${url}`
        		  + '\n cat "'+img.c+'"');
          img.description = `Error processing image metadata from Wikimedia Commons. Request did not return relevant information. Url: ${url}`;
          resolve(img);
        }
      }).catch(error=>{
        l.warn(`wikimedia.service.js getImageInfo: http req when getting metadata for "${pageTitle}" ${dbg} timed out or failed.\nError message: ${error.stack}.\nUrl: ${url}`+
        		'\ncat "'+img.c+'"');
        img.description = `http request when getting metadata for ${pageTitle} timed out after ${timeoutSecs} seconds or failed. Error message: ${error}. Url: ${url}`;
        resolve(img);
      });
    });
    
  }

export function getImgsOfCat(cat, dbg, city, imgUrlSet, imgUrls, dbgIdWd, fProps, debugAll) {
	  let catName = cat.c;
    // if there is a gallery, then fetch all images in category
    const imgsPerCat = 20;
    let encCat = encodeURIComponent(catName);
    let sanTit = sanitizeTitle(encCat);
    let url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=${imgsPerCat}&cmtitle=Category:${sanTit}&prop=imageinfo&format=json`;
    // make array of image promises
    let imgValsCumul = [];
    let imgNoInfoPomise = api.get(url, {timeout: 1000})
      .then(r => {
        const rDat = r.data;
        if (null == rDat.error) {
          const category_members = rDat.query['categorymembers'];
          let cI = 0;
          cat.l = category_members.length;
          if(process.env.NODE_ENV !== 'production' && debugAll) {
            l.info('wikimedia.service.js getImgsOfCat: category "'+catName+'" has '+cat.l+' (limit '+imgsPerCat+') images '+dbg+' '+city+' '+
        		  dbgIdWd+' '+new Date().toISOString());
          }
          // fetch information for each image, max 50
          for(; cI < cat.l && cI < 50;cI++) {
            const page = category_members[cI];
            const dbgImg = "f-"+dbg+"_i-"+cI+"/"+cat.l;  
            const imgLikeFromWikiMedia = {
                  value: page.title.replace('File:',''),
                  typ:'wm'
                }
            const imgVals = [];
            imgVals.push(imgLikeFromWikiMedia);
            imgValsCumul.push(imgLikeFromWikiMedia);
            const imgs = { src: 'wd',
              imgs: imgVals,
              type:'wm' };
            const addedC = addToImgList(imgs, imgUrlSet, imgUrls, dbg + ' '+ dbgIdWd+' cat "'+catName+'"',
        		  debugAll,{n:catName,l:cat.l});
          };
        } else {
            const rdErr = rDat.error;
            l.info('wikimedia.service.js getImgsOfCat: category "'+catName+'" error "'+rdErr.info+'" ('+rdErr.code+
                    ') has '+cat.l+' (limit '+imgsPerCat+') images '+dbg+' '+city+' '+
        		    dbgIdWd+' '+new Date().toISOString());          
            l.info(rdErr.*);
        }
        return Promise.all(imgValsCumul);
    }).catch(err=> {
        // If there is an error getting the category members, then reject with error
        l.error('getImgsOfCat.categorymembers = api.get:\n'+
          `Failed to fetch category members. Cat "`+catName+'" ' +dbg + ' '+ dbgIdWd 
           + ' url '+url+' '+new Date().toISOString()+'\n'+err.stack);
        // add gallery as value of fountain gallery property
        fProps.gallery.issues.push({
          data: err,
          context: {
            fountain_name: fProps.name.value,
            property_id: 'gallery',
            id_osm: fProps.id_osm.value,
            id_wikidata: fProps.id_wikidata.value
          },
          timeStamp: new Date(),
          type: 'data_processing',
          level: 'error',
          message: `Failed to fetch category members from Wikimedia Commons. Url: ${url} `+dbg,  
        });
    });
    return imgNoInfoPomise;
}

export default new WikimediaService();