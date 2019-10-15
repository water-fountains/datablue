/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import './common/env'; //read environment files
import Server from './common/server'; // import Server definition
import routes from './routes'; // import routes to be used by server
import l from './common/logger';

// Unhandled errors are handled here
// todo: put this in another file
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  l.error('unhandled Rejection', error.message);
  l.error('unhandled Rejection trace', error.stack);
});

export default new Server()
  .router(routes)
  .listen(process.env.PORT);
