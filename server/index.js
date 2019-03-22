/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import './common/env';
import Server from './common/server';
import routes from './routes';

// Unhandled errors are handled here
// todo: put this in another file
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandled Rejection', error.message);
  console.log('unhandled Rejection trace', error.stack);
});

export default new Server()
  .router(routes)
  .listen(process.env.PORT);
