/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import pino from 'pino';
import { Timber } from "@timberio/node";

let logger;
// Use timber if information is provided
if(process.env.TIMBER_KEY && process.env.TIMBER_SOURCE_ID){
    logger = new Timber(process.env.TIMBER_KEY, process.env.TIMBER_SOURCE_ID);
  
}else{
  logger = pino({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL,
  });
}
const l = logger;
export default l;