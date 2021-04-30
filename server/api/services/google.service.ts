/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */
import { Fountain } from '../../common/typealias';

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
    resolve({
      big: `//maps.googleapis.com/maps/api/streetview?size=1200x600&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`,
      medium: `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`,
      small: `//maps.googleapis.com/maps/api/streetview?size=120x100&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`,
      description: 'Google Street View and contributors',
      source_name: 'Google Street View',
      source_url: '//google.com',
    });
  });
}
