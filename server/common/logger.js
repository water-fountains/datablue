/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 * 
 */
import pino from 'pino';
import { Timber } from "@timberio/node";

let logger;
// Use timber if information is provided
if(process.env.TIMBER_KEY && process.env.TIMBER_SOURCE_ID){
    //	https://github.com/timberio/timber-js/issues/74 RFE for file name and line numbers
    logger = new Timber(process.env.TIMBER_KEY, process.env.TIMBER_SOURCE_ID);
    logger.info('logger.js: Timber logger ' +new Date().toISOString());
}else{
  // https://github.com/pinojs/pino/issues/687  RFE for file name and line numbers
  logger = pino({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL,
  });
  logger.info('logger.js: pino logger '+new Date().toISOString());
}
const l = logger;
export default l;