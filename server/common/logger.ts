/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 * 
 */
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
          console.log(new Date().toISOString() + ' | i: ' + str + ' ' + calr);
      } else {
         console.trace(str);
      }
   }
   error (str: string, trace: boolean = false) {
      if (null == trace || !trace) {
         let calr = this.getCaller();
         console.log(new Date().toISOString() + ' | e: '+str+' '+calr);
      } else {
         console.trace(str);
      }
   }
 }
 export const l = new CustomLogger();
 export default l;