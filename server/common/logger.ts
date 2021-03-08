/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 * 
 */
// import pino from "pino";
// import { Timber } from "@timberio/node";


//TODO not used at all as it seems, only for this one log message, so commenting out for the moment
// let logger;
// // Use timber if information is provided
// if(process.env.TIMBER_KEY && process.env.TIMBER_SOURCE_ID){
//     //	https://github.com/timberio/timber-js/issues/74 RFE for file name and line numbers
//     logger = new Timber(process.env.TIMBER_KEY, process.env.TIMBER_SOURCE_ID);
//     logger.info('logger.js: Timber logger ' +new Date().toISOString());
// } else { 
//   // https://github.com/pinojs/pino/issues/687  RFE for file name and line numbers
//   logger = pino({
//     name: process.env.APP_ID,
//     level: process.env.LOG_LEVEL,
//   });
//   logger.info('logger.js: pino logger '+new Date().toISOString());
// }

export class CustomLogger {
   getCaller() {
         let calr = 'callerNotFound';
         const stack = new Error().stack;
         if (null != stack) {
            const stackArr = stack.split('at ');
            if (null != stackArr && 4 <= stackArr.length) {
              const calr0 = stackArr[3];
              if (null != calr0) { 
                  const calArr = calr0.split('webpack:');
                  if (null != calArr && 0 < calArr.length) {
                      calr = calArr[1];   
                      if (null != calr) {
                        const newLgth = calr.trim().length-1;
                        calr = calr.substring(0,newLgth);
                      }                 
                  }
              }
            }
         }
         return calr;
   }
   info (str: string, trace: boolean = false) {
      if (null == trace || !trace) {
         let calr = this.getCaller();
         console.log('i: '+str+' '+calr);
      } else {
         console.trace(str);
      }
   }
   error (str: string, trace: boolean = false) {
      if (null == trace || !trace) {
         let calr = this.getCaller();
         console.log('e: '+str+' '+calr);
      } else {
         console.trace(str);
      }
   }
 }
 export const l = new CustomLogger();