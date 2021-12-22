/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */
import { Fountain } from '../../common/typealias';

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface Image {
  big: string;
  medium: string;
  small: string;
  description: string;
  source_name: string;
  source_url: string;
}

export function getStaticStreetView(fountain: Fountain): Promise<Image> {
  return new Promise(resolve => {
    const lat = fountain.geometry.coordinates[1];
    const lng = fountain.geometry.coordinates[0];
    resolve({
      big: `//maps.googleapis.com/maps/api/streetview?size=1200x600&location=${lat},${lng}&fov=120&key=${process.env.GOOGLE_API_KEY}`,
      medium: `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&fov=120&key=${process.env.GOOGLE_API_KEY}`,
      small: `//maps.googleapis.com/maps/api/streetview?size=120x100&location=${lat},${lng}&fov=120&key=${process.env.GOOGLE_API_KEY}`,
      description: 'Google Street View and contributors',
      source_name: 'Google Street View',
      source_url: '//google.com',
    });
  });
}
