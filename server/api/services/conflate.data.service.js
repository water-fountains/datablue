/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import {fountain_property_metadata, get_prop} from "../../../config/fountain.properties";
import {
  PROP_STATUS_ERROR, PROP_STATUS_FOUNTAIN_NOT_EXIST,
  PROP_STATUS_INFO,
  PROP_STATUS_NOT_AVAILABLE,
  PROP_STATUS_NOT_DEFINED,
  PROP_STATUS_OK
} from "../../common/constants";

const _ = require('lodash');
const haversine = require('haversine');
const md5 = require('js-md5');


// wikidata property paths: path for accessing the wikidata QID of a fountain, either in the query result of wikidata or the query result from OSM
const idwd_path_wd = fountain_property_metadata.id_wikidata.src_config.wikidata.src_path;
const idwd_path_osm = fountain_property_metadata.id_wikidata.src_config.osm.src_path;

// This service finds matching fountains from osm and wikidata
// and merges their properties

export function conflate(ftns, dbg,debugAll) {
  return new Promise((resolve, reject)=>{
    
    let conflated = {
      wikidata: [],
      coord: []
    };
    
    // Only try to find matching fountains if both lists contain fountains
    // (sometimes one of the lists is empty)
    if(_.min([ftns.osm.length, ftns.wikidata.length])>0) {

      // first conflate by wikidata identifiers (QID)
      conflated.wikidata = conflateByWikidata(ftns,dbg,debugAll);

      // then conflate by coordinates
      conflated.coord = conflateByCoordinates(ftns,dbg, debugAll);
    }
    
    // process remaining fountains that were not matched by either QID or coordinates
    let unmatched = {};
    unmatched.osm = _.map(ftns.osm, f_osm =>{
      return mergeFountainProperties({osm:f_osm, wikidata:false}, 'unmatched.osm', null,debugAll,dbg)});
    unmatched.wikidata = _.map(ftns.wikidata, f_wd =>{
      return mergeFountainProperties({osm:false, wikidata:f_wd}, 'unmatched.wikidata',null, debugAll,dbg)});
    
    // append the matched (conflated) and unmatched fountains to the list "conflated_fountains_all"
    let conflated_fountains_all = _.concat(
      conflated.coord,
      conflated.wikidata,
      unmatched.osm,
      unmatched.wikidata
    );
    
    // return fountains (first turn list of fountains into geojson)
    resolve(properties2GeoJson(conflated_fountains_all));
  })
}

/**
 * This function finds matching pairs of fountains between osm and wikidata. It returns the list of matches and removes the matched fountains from the 'ftns' argument
 * @param {Object} ftns - Object (passed by reference) with two properties: 'osm' is a list of fountains returned from OSM and 'wikidata' is list from wikidata
 */
function conflateByWikidata(ftns,dbg, debugAll) {
  // Holder for conflated (matched) fountains
  let conflated_fountains = [];
  // Holders for matched fountain indexes
  let matched_idx_osm = [];
  let matched_idx_wd = [];
  if (debugAll) {
	  l.info('conflate.data.service.js conflateByWikidata: '+ftns+' ftns '+dbg+' '+new Date().toISOString());
  }
  // loop through OSM fountains
  for(const [idx_osm, f_osm] of ftns.osm.entries()){
    
    // find the index of the fountain in the wikidata list with a wikidata QID that matches the wikidata id referenced in OSM
    let idx_wd =  _.findIndex(ftns.wikidata, (f_wd) => {
      return _.get(f_osm, idwd_path_osm, 0) === _.get(f_wd, idwd_path_wd, 1); // check for match. Use default values 0 and 1 to ensure no match if no data is found
    });
    // if a match was found
    if (idx_wd >= 0) {
      // compute distance between the two fountains
      let d = null;
      try{
        d = haversine(
          get_prop(ftns.osm[idx_osm], 'osm', 'coords'),
          get_prop(ftns.wikidata[idx_wd], 'wikidata', 'coords'), {
            unit: 'meter',
            format: '[lon,lat]'
          });
      }catch (e) {
        // some wikidata fountains have no coordinates, so distance cannot be calculated. That is ok.
      }
      // merge the two fountains' properties and add to "conflated_fountains" list
      conflated_fountains.push(
        mergeFountainProperties(
          {
            osm: ftns.osm[idx_osm],
            wikidata: ftns.wikidata[idx_wd]
          }, 'merged by wikidata id', d, debugAll,dbg));
      // document the indexes of the matched fountains so the fountains can be removed from the lists
      matched_idx_osm.push(idx_osm);
      matched_idx_wd.push(idx_wd);
    }
  }
  
  // remove matched fountains from lists
  cleanFountainCollections(ftns, matched_idx_osm, matched_idx_wd, debugAll, dbg);
  
  return conflated_fountains;
}

/**
 * remove matched fountains from 'ftns' (remove in reverse order to not mess up indexes)
 * @param {Object} ftns - Object (passed by reference) with two properties: 'osm' is a list of fountains returned from OSM and 'wikidata' is list from wikidata
 * @param {[number]} matched_idx_osm - List of matched OSM IDs
 * @param {[number]} matched_idx_wd - List of matched wikidata IDs
 */
function cleanFountainCollections(ftns, matched_idx_osm, matched_idx_wd, debugAll, dbg) {
  if (debugAll) {
		  l.info('conflate.data.service.js cleanFountainCollections: '+ftns+' ftns '+dbg+' '+new Date().toISOString());
  }
  matched_idx_osm = _.orderBy(matched_idx_osm);
  for (let i = matched_idx_osm.length -1; i >= 0; i--)
    ftns.osm.splice(matched_idx_osm[i],1);
    
  matched_idx_wd = _.orderBy(matched_idx_wd);
  for (let i = matched_idx_wd.length -1; i >= 0; i--)
    ftns.wikidata.splice(matched_idx_wd[i],1);
  // console.log(r.osm.length);
  
}

/**
 * Find matching fountains based on coordinates alone
 * @param {Object} ftns - Object (passed by reference) with two properties: 'osm' is a list of fountains returned from OSM and 'wikidata' is list from wikidata
 */
function conflateByCoordinates(ftns,dbg, debugAll) {
	if (debugAll) {
		  l.info('conflate.data.service.js conflateByCoordinates: '+ftns+' ftns '+dbg+' '+new Date().toISOString());
	}
  // Holder for conflated fountains
  let conflated_fountains = [];
  // Temporary holders for matched fountain indexes
  let matched_idx_osm = [];
  let matched_idx_wd = [];
  
  // make ordered list of coordinates from all Wikidata fountains
  let coords_all_wd = _.map(ftns.wikidata, f_wd=>{return get_prop(f_wd, 'wikidata', 'coords')});
  l.info(ftns.length+' ftns conflateByCoordinates '+dbg);
  // Loop through OSM fountains
  // todo: loop through wikidata fountains instead, since this is the more incomplete list the matching will go much faster
  for (const [idx_osm, f_osm] of ftns.osm.entries()) {
    // compute distance array between OSM fountain and all wikidata fountains
    let coords_osm = get_prop(f_osm, 'osm', 'coords');
    let distances = _.map(coords_all_wd, c_wd => {
      return haversine( c_wd, coords_osm, {
          unit: 'meter',
          format: '[lon,lat]'
        });
    });
    // find the value and index of the smallest distance
    let dMin = _.min(distances);
    let idx_wd = _.indexOf(distances, dMin);
    // selection criteria: dMin smaller than 10 meters
    if (dMin < 10) {
      // conflate the two fountains
      conflated_fountains.push(mergeFountainProperties(
        {
          osm: ftns.osm[idx_osm],
          wikidata: ftns.wikidata[idx_wd]
        }, `merged by location`, dMin, debugAll,dbg));
      // document the indexes for removal
      matched_idx_osm.push(idx_osm);
      matched_idx_wd.push(idx_wd);
      //todo: if matching is ambiguous, add a note for community
    }
  }
  // remove matched fountains from lists
  cleanFountainCollections(ftns, matched_idx_osm, matched_idx_wd, debugAll, dbg);
  
  
  return conflated_fountains;
}


function mergeFountainProperties(ftn, mergeNotes='', mergeDistance=null, debugAll, dbg){
  if (debugAll) {
		  l.info('conflate.data.service.js mergeFountainProperties: '+ftn+' ftns, '+mergeNotes+' '+dbg+' '+new Date().toISOString());
  }
  // combines fountain properties from osm and wikidata
  // For https://github.com/water-fountains/proximap/issues/160 we keep values from both sources when possible
  let mergedProperties = {};
  // loop through each property in the metadata
  _.forEach(fountain_property_metadata, (p)=>{
    // foutnain template with default property values copied in
    let temp = {
      id: p.id,
      value: p.value,
      comments: p.comments,
      status: p.status,
      type: p.type,
      issues: [],
      sources: {
        osm: {
          status: null,
          raw: null,
          extracted: null,
          comments: []
        },
        wikidata: {
          status: null,
          raw: null,
          extracted: null,
          comments: []
        }
      }
    };
    
    // loop through sources (osm and wikidata) and extract values
    for(let src_name of ['wikidata', 'osm']){
      const f = ftn[src_name];
      const tmp = temp.sources[src_name];
      if(p.src_config[src_name] === null){
        // If property not available, define property as not available for source
        tmp.status = PROP_STATUS_NOT_AVAILABLE;
    
      } else if(! f){
        // If fountain doesn't exist for that source (e.g. the fountain is only defined in osm, not wikidata), mark status
        tmp.status = PROP_STATUS_FOUNTAIN_NOT_EXIST;
  
      }else {
        // if property is available (fundamentally) for source, try to get it

        // get extraction information (how to extract property from source)
        const cfg = p.src_config[src_name];
        
        // Get value of property from source
        let value = _.get(f, cfg.src_path, null);
        let useExtra = false;
  
        // If value is null and property has an additional source of data (e.g., wiki commons for #155), use that
        if(value === null && cfg.hasOwnProperty('src_path_extra')){
          value = _.get(f, cfg.src_path_extra, null);
          useExtra = true;
        }
        
        // If a value was obtained, try to process it
        if(value !== null){
          // save raw value
          tmp.raw = value;
          try{
            // use one translation (or the alternative translation if the additional data source was used)
        	  if (useExtra) {
        		  tmp.extracted = cfg.value_translation_extra(value); 
        	  } else {
        		  let v = cfg.value_translation(value);
        		  tmp.extracted = v;
        	      if('wiki_commons_name' == temp.id){
        	        if(cfg.hasOwnProperty('src_path_extra')){
        	    		let valueE = _.get(f, cfg.src_path_extra, null);
        	    		if (null != valueE && null != v && 0 < valueE.trim()) {
        	    			let catSet = new Set();
        	    			for(let c of v) {
        	    				catSet.add(c.c);
        	    			}
        	    			const vE = cfg.value_translation_extra(valueE); 
        	    			if (null != vE && !catSet.has(valueE)) {
        	    				v.push(...vE);
        	    				if (debugAll) {
        	    					l.info(`conflate.data.service.js: got additional category for "${p.id}" from "${src_name}": `
        	    							+new Date().toISOString());
        	    				}
        	    			}
        	    		}
            	     }
        	      }
        	  }
            // if extracted value is not null, change status to ok
            if(tmp.extracted !== null){
              tmp.status = PROP_STATUS_OK;
            }
          }catch(err) {
            tmp.status = PROP_STATUS_ERROR;
            let warning = `conflate.data.service.js: Lost in translation of "${p.id}" from "${src_name}": ${err.stack}`;
            tmp.comments.push(warning);
            l.error(warning);
          }
        }else{
          // If no property data was found, set status to "not defined"
          tmp.status = PROP_STATUS_NOT_DEFINED;
        }
        if ('osm' == src_name && 'featured_image_name' == p.id) {
        	const osmProps = f.properties;
        	if (null != osmProps) {
        		let osmImgs = [];
        		if (null != osmProps.image) {
        			let v = cfg.value_translation(osmProps.image);
        			if (null != v) {
        				osmImgs.push(v);
        			}
        		}
        		if (null != osmProps.wikimedia_commons) {
        			let v = cfg.value_translation(osmProps.wikimedia_commons);
        			if (null != v) {
        				osmImgs.push(v);
        			}
        		}
        		let imgsSoFar = new Set();
        		if (null != tmp.extracted && null != tmp.extracted.imgs) {
        			for(let v of tmp.extracted.imgs) {
        				imgsSoFar.add(v.value);
        			}
        		} else {
        			tmp.extracted = { src: 'osm',
        					imgs: [],
        					type:'unk'} ;
        		}
        		for(let v0 of osmImgs) {
        			for(let v of v0.imgs) {
        				if (!imgsSoFar.has(v.value)) {
        					tmp.extracted.imgs.push(v);
        					l.info('conflate mergeProps added img "'+ v.value+'" typ '+v.typ+' '+new Date().toISOString());
        				}
        			}
        		}
        		if (0 < tmp.extracted.imgs.length) {
        			//test with ch-zh Q27230145 or rather node/1415970706
        			for(let pSrc_name of p.src_pref){
        				// add the osm images to wikidata if that is the preferred source
        				if(temp.sources[pSrc_name].status === PROP_STATUS_OK && pSrc_name!= src_name){
        					let pTmp = temp.sources[pSrc_name].extracted;
        					if (null != pTmp && null != pTmp.imgs && 0 < pTmp.imgs.length) {
        		        		let pImgsSoFar = new Set();
        						for(let pV of pTmp.imgs) {
        							pImgsSoFar.add(pV.value.replace(/ /g, '_'));
        						}
        						for (let vO of tmp.extracted.imgs) {
        							if (!pImgsSoFar.has(vO.value)) {
        								pTmp.imgs.push(vO);
        							}
        						}
        					}
        				}
        			}
        		}
        	}
        }
      }
    }
    
    // Get preferred value to display
    for(let src_name of p.src_pref){
      // check if value is available
      if(temp.sources[src_name].status === PROP_STATUS_OK){
        temp.value = temp.sources[src_name].extracted;
        temp.status = PROP_STATUS_OK;
        temp.source = src_name;
        break;  // stop looking for data
      }
    }
    
    // Add merged property to object
    mergedProperties[p.id] = temp;
    
  });
  // process panorama and image url
//  addDefaultPanoUrls(mergedProperties);
  
  mergedProperties['conflation_info'] = {
    'merge_notes': mergeNotes,
    'merge_distance': mergeDistance,
    // document merge date for datablue/#20
    'merge_date': new Date()
  };
  
  return mergedProperties
}

function properties2GeoJson(collection){
  return _.map(collection, properties=>{
    try{
      return {
        type: 'Feature',
        geometry:{
          type: 'Point',
          coordinates: properties.coords.value
        },
        properties: _.cloneDeep(properties)
      }
    } catch (err) {
      throw err;
    }
    
  })
}