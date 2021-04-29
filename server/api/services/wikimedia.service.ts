/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import * as _ from 'lodash';
import axios from 'axios';
import l from '../../common/logger';
import {PROP_STATUS_OK, PROP_STATUS_WARNING, MAX_IMG_SHOWN_IN_GALLERY } from "../../common/constants";
import {isBlacklisted} from './categories.wm';
import sharedConstants from '../../common/shared-constants';
import { Fountain, FountainPropertyCollection, ImageInfoMetadataCollection, GalleryValue } from '../../common/typealias';
import { ImageLike, ImageLikeCollection } from '../../../config/text2img';
import { Category, hasWikiCommonsCategories, ImageInfoExtMetadataCollection, MediaWikiImageInfoCollection, MediaWikiQuery, WikiCommonsCategoryCollection } from '../../common/wikimedia-types';


let api = axios.create({});

class WikimediaService {
  
  private getName(fountain: Fountain) {
	  const props = fountain.properties;
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
    
  //TODO @ralfhauser
  private getImgsFromCats(fProps: FountainPropertyCollection<WikiCommonsCategoryCollection>, dbg: string,city: string,dbgIdWd: string,name: string,imgNoInfoPomises: Promise<ImageLike[]>[], imgUrlSet: Set<string>, imgUrls: ImageLike[], debugAll: boolean): void {
	  let catNames = fProps.wiki_commons_name.value;
	  if (1 < catNames.length) {
		  if (debugAll || 2 < catNames.length) {
			  l.info('wikimedia.service.js: '+catNames.length+' commons categories defined "'+dbg+' ' +city+' '+dbgIdWd+' "'+name+'"');
		  }
	  }
	  let catName = 'unkCatNam';
	  for(let i = 0;i < catNames.length; i++) {
		  const cat = catNames[i];
      // TODO @ralfhauser, 
		  catName = cat.c;
		  if (isBlacklisted(catName)) {
			  l.info('wikimedia.service.js: '+catNames.length+' commons category blacklisted  "'+catName+'" "'+dbg+' ' +city+' '+dbgIdWd+' "'+name+'"');
		      continue;
		  }
		  if (65 == i) {
			  l.info('wikimedia.service.js: '+catNames.length+' commons categories defined "'+dbg+' ' +city+' '+dbgIdWd+' "'+name+'"');
		  }
//		  lastCatName = catName;
		  const imgNoInfoPomise = getImgsOfCat(cat, dbg, city, imgUrlSet, imgUrls, dbgIdWd, fProps,debugAll);
		  //TODO we might prioritize categories with small number of images to have greater variety of images?
		  imgNoInfoPomises.push(imgNoInfoPomise);
	  }
  }
    
  fillGallery(fountain: Fountain, dbg: string, city: string, debugAll: boolean, 
    //TODO @ralfhauser, please improve the typing of  c and clrs
    allMap: Map<String, { i: GalleryValue, c?: any, clrs: Set<string> }>, 
    numbOfFntsInCollection: number
  ): Promise<Fountain> {
    //TODO @ralfhauser, change from null to '' to satisfy the type string
    let dbgIdWd = '';
//    if (debugAll) {
//       l.info('wikimedia.service.js starting fillGallery: '+dbg+' '+city+' '+dbgIdWd);
//    }
    if (null != fountain.properties.id_wikidata && null != fountain.properties.id_wikidata.value) {
      dbgIdWd = fountain.properties.id_wikidata.value;
    }
    //TODO @ralfhauser, those variables are all not used, I guess they can be removed
    let url = 'unkUrl';
    let lastCatName = 'undefCatNam';
    let lastCatUrl =  'undefCatUrl';


    let name = this.getName(fountain);
    // fills gallery with images from wikidata, wikimedia commons,
    // todo: add osm as a possible source (although images shouldn't really be linked there.
    let fProps = fountain.properties;
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

    let galVal : GalleryValue[] = fProps.gallery.value;
    let imgUrls: ImageLike[] = [];
    let imgUrlSet = new Set<string>();
    let foFeaImgs = fProps.featured_image_name;
    let foFeaImgsV = foFeaImgs.value;
    
    addToImgList(
      foFeaImgsV, imgUrlSet, imgUrls, dbg + ' '+ dbgIdWd, debugAll,
      //TODO @ralfhauser, c and l where not specified are they not mandatory?
      {n:'wd:p18', c: 'wd:p18', l: 1 }
    );
    let imgNoInfoPomises : Promise<ImageLike[]>[] = [];
    if(hasWikiCommonsCategories(fProps) && fProps.wiki_commons_name.value.length > 0) {
      if (0 < imgUrls.length && 1 < numbOfFntsInCollection) {
        if(process.env.NODE_ENV !== 'production' && debugAll) {
          l.info('wikimedia.service.js: lazyLoad no need to analyze commons category now (already '+imgUrls.length+' featured img) "'+dbg+' '+city+' '+dbgIdWd);
        }
        //TODO @ralfhauser, changed it from boolean to empty array to satisfy types, In the end the array of imgNoInfoPomises is ignored anways, so I guess it does not matter
        imgNoInfoPomises.push(new Promise(resolve => resolve([])));
      } else {
        this.getImgsFromCats(fProps, dbg,city,dbgIdWd,name,imgNoInfoPomises, imgUrlSet, imgUrls,debugAll); 
      }
    } else {
      // if not, resolve with empty
      if(process.env.NODE_ENV !== 'production' && debugAll) {
        l.info('wikimedia.service.js: no commons category defined "'+dbg+' '+city+' '+dbgIdWd);
      }
      //TODO @ralfhauser, changed it from boolean to empty array to satisfy types, In the end the array of imgNoInfoPomises is ignored anways, so I guess it does not matter
      imgNoInfoPomises.push(new Promise(resolve=> resolve([])));
    }
    return Promise.all(imgNoInfoPomises).then( /* TODO @ralfhauser cr was ignored (hence renamed it to _cr so that typer is still happy), IMO we should turn imgNoInfoPromises into void */ _cr => {
          let totImgFound = imgUrlSet.size; 
          if (0 < totImgFound) {
            if (debugAll) {
              l.info('wikimedia.service.js: fillGallery imgUrlSet.size '+totImgFound+' "'+dbg+' '+city+' '+dbgIdWd);
            }
            if (MAX_IMG_SHOWN_IN_GALLERY < totImgFound) {
              l.info('wikimedia.service.js: fillGallery only showing first '+MAX_IMG_SHOWN_IN_GALLERY+' out of imgUrlSet.size '+totImgFound+' "'+dbg+'" '+city+' '+dbgIdWd);
            }
            let galValPromises: Promise<GalleryValue>[] = [];
            let k = 0;
            const imgL = imgUrls.length;
            const showDetails = false;
            const maxImgPreFetched = 0; //as long as we don't filter for pre-fetched info, why prefetch ? https://github.com/water-fountains/datablue/issues/41
            for(;k < maxImgPreFetched && k < imgL;k++) { //only 5 imgs are on the gallery-preview
              const img = imgUrls[k];
              //TODO @ralfhauser, img.val does not exist, changed it to img.value, please check if this is correct
              const imgFromMap = allMap.get(img.typ+'_'+img.value);
              if (imgFromMap !== undefined) {
                galValPromises.push(new Promise(resolve => resolve(imgFromMap.i)));
                // TODO  @ralfhauser, here it is named c, in line 202 it is named clrs. Are those the same things?
                let callers = imgFromMap.c;
                //TODO @ralfhauser, img.val does not exist, changed it to img.value, please check if this is correct
                l.info('wikimedia.service.js: fillGallery img "'+img.value+'" already in other fountain(s) "'+dbg+' '+city+' '+dbgIdWd);
                for(let clr of callers) {
                    l.info('wikimedia.service.js: fillGallery img also in  "'+clr+'"');
                }
                callers.push(dbg);
              } else {
                //TODO @ralfhauser, img.val does not exist, changed it to img.value, please check if this is correct
                //TODO @ralfhauser, are description and metadata optional values? They are not defined here. Moreover, not every ImageLike has a Category which means this needs to be optional for SCTPT as well
                let nImg: GalleryValue = {s: img.src,pgTit: img.value, c: img.cat,t:img.typ};
                galValPromises.push(
                  //TODO @ralfhauser getImageInfo returns Promise<void> this statement most likely does not make sense
                  // My guess, galValPromises should have nImg instead, hence I added the `then` after the catch, please check if this fix is correct
                  getImageInfo(nImg, k+'/'+imgL+' "'+dbg+'" '+city+' '+dbgIdWd, showDetails,fProps)
                    .catch(giiErr=>{
                      //TODO @ralfhauser, img.val does not exist, changed it to img.value, please check if this is correct
                      l.info('wikimedia.service.js: fillGallery getImageInfo failed for "'+img.value+'" '+dbg+' '+city+' '+dbgIdWd+' cat "'+img.cat+'"' + '\n'+giiErr.stack);
                      return
                    }).then(_ => nImg)
                  );
              }
            }
            for(;maxImgPreFetched <= k && k < imgL && k < MAX_IMG_SHOWN_IN_GALLERY;k++) { //between 6 && 50 imgs are on the gallery-preview
              const img = imgUrls[k];
              //TODO @ralfhauser, img.val does not exist, changed it to img.value, please check if this is correct
                //TODO @ralfhauser, are description and metadata optional values? They are not defined here. Moreover, not every ImageLike has a Category which means this needs to be optional for SCTPT as well
              let nImg : GalleryValue = {s: img.src,pgTit: img.value,c: img.cat,t:img.typ};
              //TODO @ralfhauser, this does not make sense at all with the current typings. is galValPromises really supposed to have both promises and 
              galValPromises.push(new Promise(resolve=> resolve(nImg)));
            }        
            if (debugAll) {
              l.info('wikimedia.service.js: fillGallery galValPromises.length '+galValPromises.length+' '+dbg+' '+city+' '+dbgIdWd);
            }
            return Promise.all(galValPromises).then(r => {
              if (debugAll) {
                l.info('wikimedia.service.js: fillGallery galValPromises.r.length '+r.length+' '+dbg+' '+city+' '+dbgIdWd);
              }
              const allGalVal = galVal.concat(r);
              try {
                if (null != allGalVal && 0 < allGalVal.length) {
                  for(let i=0; i < allGalVal.length && i < maxImgPreFetched;i++) {
                    let img = allGalVal[i];
                    if (null != img) {
                        let imMetaDat = img.metadata; 
                      if (null != imMetaDat) {
                        //TODO @ralfhauser, I am not sure if GalleryValue has this attribute, please check
                        const fromMap = allMap.get(img.typ+'_'+img.pgTit);
                        if (null == fromMap) {
                          let callers = new Set<string>();
                          callers.add(dbg);
                          allMap.set(img.typ+'_'+img.pgTit,{ i:img, clrs:callers});
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
              return fountain;      
            });
          } else {
              //could check the qualifiers as per https://github.com/water-fountains/proximap/issues/294
            if (debugAll) {
              l.info("wikimedia.service.js: fillGallery "+dbgIdWd+" has no img "+city+ 
                  ' '+dbg);
            }
            return fountain;      
          }
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
        return fountain;
      })
  }
}

function makeMetadata(data: ImageInfoExtMetadataCollection ): ImageInfoMetadataCollection {
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
    },{
      sourceName: 'Categories',
      outputName: 'wikimedia_categories'
    },
  ];
  let metadata = {};
  _.forEach(template, pair => {
    if (data.extmetadata.hasOwnProperty(pair.sourceName)) {
      metadata[pair.outputName] = data.extmetadata[pair.sourceName].value;
    } else {
      metadata[pair.outputName] = null;
    }
  });
  
  return metadata;
}

export function sanitizeTitle(title: string): string {
    // this doesn't cover all situations, but the following doesn't work either
    // return encodeURI(title.replace(/ /g, '_'));
    return title
      .replace(/ /g, '_')
      .replace(/,/g, '%2C')
      // .replace(/ü/g, '%C3%BC')
      .replace(/&/g, '%26');
  }

function addToImgList(imageLikeCollection: ImageLikeCollection, imgUrlSet: Set<string>, imgUrls: ImageLike[], dbg: string, debugAll: boolean, cat: Category): number {
    let i = -1;
    if (null != imageLikeCollection && null != imageLikeCollection.imgs) {
      i++;
      let duplicateCount = 0;
      for(let imageLike of imageLikeCollection.imgs) {
        let imageName = imageLike.value;
        if (null == imageLike.typ) {
          imageLike.typ = imageLikeCollection.type;
        }
        let pageTitle = imageName.toLowerCase();
        let dotPos = pageTitle.lastIndexOf(".");
        // only use photo media, not videos
        let ext = pageTitle.substring(dotPos+1);
        if(['jpg','jpeg', 'png', 'gif','tif','tiff','svg','ogv', 'webm'].indexOf(ext)<0
            && !imageLike.typ.startsWith('ext-')){
              //TODO @ralfhauser page is not defined here, neither are the other variables, replaced the log message therefore
          // l.info('wikimedia.service.js addToImgList '+ext+': skipping "'+page.title+'" '+dbgImg+' '+dbgIdWd+' '+city);
          l.info('wikimedia.service.js addToImgList '+ext)
          //https://github.com/lukasz-galka/ngx-gallery/issues/296 to handle svg, ogv, webm
          continue;
        }
        if ('wm'==imageLike.typ) {
        //if ('wd'==imgListWithSource.src ||'osm'==imgListWithSource.src) {
          const imgNamS = sanitizeTitle(imageName);
          if (!imgUrlSet.has(imageName) && !imgUrlSet.has(imgNamS)) {
            imgUrlSet.add(imageName);
            imgUrls.push({
              src: imageLikeCollection.src,
              //TODO @ralfhauser, ImageLike expects value and not val, I changed this to value, please check if this is correct
              value: imageLike.value,
              typ: 'wm',
              cat: cat
            });
            i++;
          } else {
            if (debugAll) {
              l.info('wikimedia.service.js addToImgList foFeaImg: duplicate  "'+imageName+'" ' +i + '/' +imageLikeCollection.imgs.length + ' - ' +dbg + ' ');
            }
            duplicateCount++;
          }
        } else if ('flickr'==imageLike.typ || imageLike.typ.startsWith('ext-')) {
            if (!imgUrlSet.has(imageName)) {
              imgUrlSet.add(imageName);
              let src = imageLike.src;
              if (null == src) {
                src = imageLikeCollection.src;
              }
              imgUrls.push({
                src: src,
                 //TODO @ralfhauser, ImageLike expects value and not val, I changed this to value, please check if this is correct
                value: imageLike.value,
                typ: imageLike.typ,
                cat: cat
              });
              i++;
            } else {
              if (debugAll) {
                l.info('wikimedia.service.js addToImgList foFeaImg: duplicate  "'+imageName+'" ' +i + '/' +imageLikeCollection.imgs.length + ' - ' +dbg + ' ');
              }
              duplicateCount++;
            }
          } else {
            l.info('wikimedia.service.js addToImgList foFeaImg: unknown src "'+imageLikeCollection.src+'" "'+imageName+'" ' +dbg + ' ');
        }    
      };
      if (0 < duplicateCount && debugAll
          ) {
      l.info('wikimedia.service.js addToImgList foFeaImg: '+duplicateCount+' duplicates found among ' +imageLikeCollection.imgs.length + ' - ' +dbg + ' ');
      }
      if (1 < imageLikeCollection.imgs.length && debugAll) {
        if(process.env.NODE_ENV !== 'production') {
          l.info('wikimedia.service.js addToImgList foFeaImg: added '+imageLikeCollection.imgs.length+' ' +dbg);
        }
      }
    }
    return i;  
}


export function getImageInfo(img: GalleryValue, dbg : string, showDetails : boolean, fProps: FountainPropertyCollection<{}>): Promise<void>{
	let pageTitle = img.pgTit;
      //TODO: could also say which category it was
      let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:'+pageTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`;
      const timeoutSecs = 1;
      let timeout = timeoutSecs*1000; 
//      l.info('wikimedia.service.js: getImageInfo '+dbg+' '+url);
     const iiPr =  api.get<MediaWikiQuery<MediaWikiImageInfoCollection<ImageInfoExtMetadataCollection>>>(url, {timeout: timeout}).then(response => {
        let keys = Object.keys(response.data.query.pages);
        let key = keys[0];
        let pages = response.data.query.pages;
        let data = pages[key];
        let i = 0;
        let n = 0;
        if(data.hasOwnProperty('imageinfo')){
          img.metadata = makeMetadata(data.imageinfo[0]);
          const imgMeta = img.metadata; 
          if (imgMeta && imgMeta.wikimedia_categories && 0 < imgMeta.wikimedia_categories.trim().length) {
             const categories = imgMeta.wikimedia_categories.trim().split('|');
             if (null != categories && (null == img.c||null == img.c.n||0 == img.c.n.trim().length||'wd:p18'==img.c.n)) {
                let catSet = new Set<string>();
                for(; i < categories.length;i++) {  
                   const category = categories[i];
                   if (null != category) {
                     if (!isBlacklisted(category)) {
                        catSet.add(category.trim());
                     }
                   }
                }
                
                const catArr = Array.from(catSet);
                if (null != catArr && 0 < catArr.length) {
                  //TODO @ralfhauser, why only the first one? Note that this is random if there are more since we populate the array from a Set
                   const ca = catArr[0];
                   //TODO @ralfahuser is c and l optional?
                   img.c = { n:ca, c:ca, l: 1};
        	       l.info('wikimedia.service.js getImageInfo: found category "'+img.c?.n+'" '+dbg+' "'+url+'" #ofCats "'+catArr.length+'"');
        	       if (null == fProps.wiki_commons_name) { 
        	          fProps.wiki_commons_name = {value: []}
        	       } else if (null == fProps.wiki_commons_name.value) { 
        			     fProps.wiki_commons_name.value = [];
        	       } 
        	       const fPrCats = fProps.wiki_commons_name.value;
        	       let catsSoFar = new Set();
        	       for(let j=0;j<fPrCats.length;j++){
        	          const cat = fPrCats[j];
        	          if (null != cat && null != cat.c) {
        	              const catTr = cat.c.trim();
        	              if (0 < catTr.length) {
        	                catsSoFar.add(catTr);
        	              }
        	          }
        	       }
        	       if (null == fProps.wiki_commons_name.fromImgs) { 
        			       fProps.wiki_commons_name.fromImgs = []; //otherwise, with each single fountain refresh adds more, possibly only weakly related images from other categories
        	       } 
        	       for(let k=0;k<catArr.length;k++){
        	          const cat = catArr[k];
        	          if (null != cat && 0 < cat.trim().length) {
        	              const catTr = cat.trim();
        	              if (!catsSoFar.has(catTr)) {
        	                 l.info('wikimedia.service.js getImageInfo: adding cat to fromImgs '+dbg+' "'+url+'" cat "'+img.c.n+'" "'+catTr+'"');
        		             fProps.wiki_commons_name.fromImgs.push({s:'wd',
        		                   c:catTr,l:-1});
        		                   n++;
        		          }
        	          }
        	       }
                }
             }
          }
          if (showDetails) {
        	  l.info('wikimedia.service.js getImageInfo: done '+dbg+' "'+url+'" cat "'+img.c?.n+'" '+n+'/'+i+' added');
          }
          return;
        } else{
          l.error(`wikimedia.service.js getImageInfo: http request when getting metadata for "${pageTitle}" ${dbg} did not return useful data in ${timeoutSecs} secs. Url: ${url}`
        		  + '\n cat "'+img.c+'"');
          img.description = `Error processing image metadata from Wikimedia Commons. Request did not return relevant information. Url: ${url}`;
          return;
        }
      }).catch(error=>{
        l.error(`wikimedia.service.js getImageInfo: http req when getting metadata for "${pageTitle}" "${dbg}" timed out or failed.\nError message: ${error.stack}.\nUrl: ${url}`+
        		'\ncat "'+img.c+'"');
        img.description = `http request when getting metadata for ${pageTitle} timed out after ${timeoutSecs} seconds or failed. Error message: ${error}. Url: ${url}`;
        return;
      });

    //TODO @ralfhauser this looks very smelly: adding a property img and caller to a Promise, also using the name caller could lead to problems in the future
    const p : { [key: string]: any } = iiPr
    p.img = img;
    p.caller = 'getImageInfo '+dbg; //20200506 seems not to be visible
    return iiPr;
  }

export function getImgsOfCat(cat: Category, dbg: string, city: string, imgUrlSet: Set<string>, imgUrls: ImageLike[], dbgIdWd: string, fProps, debugAll: boolean): Promise<ImageLike[]> {
    // TODO @ralfhauser, I don't get the naming schema yet, I figured n is the name of the category
	  let catName = cat.c;
    // if there is a gallery, then fetch all images in category
    const imgsPerCat = 20;
    let encCat = encodeURIComponent(catName);
    let sanTit = sanitizeTitle(encCat);
    let url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmlimit=${imgsPerCat}&cmtitle=Category:${sanTit}&prop=imageinfo&format=json`;
    // make array of image promises
    let imgValsCumul: ImageLike[] = [];
    let imgNoInfoPomise = api.get(url, {timeout: 1000})
      .then(r => {
        const rDat = r.data;
        if (null == rDat.error) {
          const category_members = rDat.query['categorymembers'];
          let cI = 0;
          cat.l = category_members.length;
          if(process.env.NODE_ENV !== 'production' && debugAll) {
            l.info('wikimedia.service.js getImgsOfCat: category "'+catName+'" has '+cat.l+' (limit '+imgsPerCat+') images '+dbg+' '+city+' '+ dbgIdWd);
          }
          // fetch information for each image, max 50
          for(; cI < cat.l && cI < 50;cI++) {
            const page: { title: string } = category_members[cI];
            const imgLikeFromWikiMedia: ImageLike = {
                  value: page.title.replace('File:',''),
                  typ: 'wm',
                  //TODO @ralfhauser, added src myself as it was missing. Correct like this?
                  src: 'wm'
                }
            const imgVals: ImageLike[] = [];
            imgVals.push(imgLikeFromWikiMedia);
            imgValsCumul.push(imgLikeFromWikiMedia);
            const imgs: ImageLikeCollection = { 
              //TODO @ralfhauser is wd maybe a typo and should be wm as well?, remove from legal values in ImageLikeCollection if this is the case
              src: 'wd',
              type:'wm',
              imgs: imgVals,
            };
            addToImgList(
              imgs, imgUrlSet, imgUrls, dbg + ' '+ dbgIdWd+' cat "'+catName+'"', debugAll,
              //TODO @ralfhauser, c is missing in this case. Is c not mandatory? See also TODO in line 455, here we assing catName to n in contrast to 455 where we extract it from c
             {n:catName, l:cat.l, c: catName }
             );
          };
        } else {
            const rdErr = rDat.error;
            l.info('wikimedia.service.js getImgsOfCat: category "'+catName+'" error \''+rdErr.info+'\' (code "'+rdErr.code+
                    '") has '+cat.l+' (limit '+imgsPerCat+') images '+dbg+' '+city+' '+
        		    dbgIdWd);          
            l.info(rdErr['*']);
        }
        return Promise.all(imgValsCumul);
    }).catch(err=> {
        // If there is an error getting the category members, then reject with error
        l.error('getImgsOfCat.categorymembers = api.get:\n'+
          `Failed to fetch category members. Cat "`+catName+'" ' +dbg + ' '+ dbgIdWd 
           + ' url '+url+'\n'+err.stack);
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
        //TODO @ralfhauser, before we did not return anything, I guess an empty array is ok but I don't know it for sure.
        return [];
    });
    return imgNoInfoPomise;
}

export default new WikimediaService();