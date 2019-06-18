/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

// Created for proximap#206

import _ from "lodash"
import l from "../../common/logger"

export function extractProcessingErrors(fountainCollection){
  // returns collection of processing errors from collection
  l.info('extracting processing errors');
  
  let errorCollection = [];
  
  // loop through all fountains
  for(let fountain of fountainCollection.features){
    // loop through all properties
    _.forIn(fountain.properties, (p, key)=>{
      if(p.hasOwnProperty('issues') && p.issues.length > 0){
        p.issues.forEach(issue=>{
          // copy all errors/issues
          let error = {
            level: issue.level,
            message: issue.message,
            type: issue.type,
            fountain_name: fountain.properties.name.value,
            property_id: key,
            id_osm: fountain.properties.id_osm.value,
            id_wikidata: fountain.properties.id_wikidata.value
          };
    
          // append error to collection
          errorCollection.push(error);
        });
      }
    });
  }
  
  return errorCollection;
}