/*
 * @license
 * (c) Copyright 2020 | MY-D Foundation | Created by Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

export function isBlackListed(catName) {
  if (null == catName) {
     return true;
  }
  const categoT = catName.trim();
  if (0 < categoT.length) {
    const categoTlc = categoT.toLowerCase();
    if (-1 == categoTlc.indexOf('needing')) {
      if (-1 == categoTlc.indexOf('self-published work')) {
        if (-1 == categoTlc.indexOf('pages with')) {
          return false;
        }
      }
    }
  }
  return true;
}