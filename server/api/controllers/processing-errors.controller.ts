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

//TODO @ralfhauser, I don't know the type of errorCollection since I was not able to get a real example of an issue, please narrow down accordingly
export type ProcessingError = any

export function hasProcessingIssues(obj: any): obj is { issues: ProcessingError[] } {
  return obj.hasOwnProperty('issues') && Array.isArray(obj.issues)
}

export function extractProcessingErrors(fountainCollection: FountainCollection | undefined): ProcessingError[] {
  let errorCollection: ProcessingError[] = [];
  if (fountainCollection !== undefined) {
    // returns collection of processing errors from collection
    if (process.env.NODE_ENV !== 'production') {
      l.info('extractProcessingErrors: start');
    }  
    fountainCollection.features.forEach(fountain =>
      _.forIn(fountain.properties, p =>{
        if(hasProcessingIssues(p)){
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