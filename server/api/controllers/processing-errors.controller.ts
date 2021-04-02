/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

// Created for proximap#206

import _ from "lodash"
import { l } from "../../common/logger"
import { FountainCollection } from "../../common/typealias";

//TODO type fountainCollection, then it would be clear that features can be undefined
export function extractProcessingErrors(fountainCollection: FountainCollection | undefined){
  let errorCollection: any[] = [];
  if (fountainCollection !== undefined) {
    // returns collection of processing errors from collection
    if (process.env.NODE_ENV !== 'production') {
      l.info('extractProcessingErrors: start');
    }  
    fountainCollection.features.forEach(fountain =>
      _.forIn(fountain.properties, (p: any) =>{
        if(p.hasOwnProperty('issues') && Array.isArray(p.issues)){
          p.issues.forEach(issue => {
            // create copy
            let error = _.cloneDeep(issue);
            // append error to collection
            errorCollection.push(error);
          });
        }
      })
    )
  }
  l.info('extractProcessingErrors: found '+errorCollection.length+' processing errors');  
  return errorCollection;
}