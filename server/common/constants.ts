/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry, Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

export const PROP_STATUS_OK = 'PROP_STATUS_OK';
export const PROP_STATUS_INFO = 'PROP_STATUS_INFO';
export const PROP_STATUS_WARNING = 'PROP_STATUS_WARNING';
export const PROP_STATUS_ERROR = 'PROP_STATUS_ERROR';
export const PROP_STATUS_FOUNTAIN_NOT_EXIST = 'PROP_STATUS_FOUNTAIN_NOT_EXIST';
export const PROP_STATUS_NOT_DEFINED = 'PROP_STATUS_NOT_DEFINED';
export const PROP_STATUS_NOT_AVAILABLE = 'PROP_STATUS_NOT_AVAILABLE';
export const MAX_IMG_SHOWN_IN_GALLERY = 50;
export const LAZY_ARTIST_NAME_LOADING_i41db = true;

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export type PropStatus =
  | 'PROP_STATUS_OK'
  | 'PROP_STATUS_INFO'
  | 'PROP_STATUS_WARNING'
  | 'PROP_STATUS_ERROR'
  | 'PROP_STATUS_FOUNTAIN_NOT_EXIST'
  | 'PROP_STATUS_NOT_DEFINED'
  | 'PROP_STATUS_NOT_AVAILABLE';
