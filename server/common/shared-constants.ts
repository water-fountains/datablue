/*
 * @license
 * (c) Copyright 2020 - 2020 | MY-D Foundation | Created by Miroslav Stankovic, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 *
 * Each time you change this file, you need to run
 *
 *   ~/git/proximap $ npm run sync_datablue for=constants
 *
 * to have proximap aligned with it
 *
 */
export default {
  //TODO proximap#394 reactivate serbian again, see also TODO in proximap
  LANGS: ['en', 'de', 'fr', 'it', 'tr' /* 'sr' */],
  CACHE_FOR_HRS_i45db: 48,
  gak: `${process.env.GOOGLE_API_KEY}`,
};
