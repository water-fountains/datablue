/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

export function getStaticStreetView(fountain){
  return new Promise((resolve, reject)=>{
    let image = {};
    image.big = `//maps.googleapis.com/maps/api/streetview?size=1200x600&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
    image.medium = `//maps.googleapis.com/maps/api/streetview?size=600x300&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
    image.small = `//maps.googleapis.com/maps/api/streetview?size=120x100&location=${fountain.geometry.coordinates[1]},${fountain.geometry.coordinates[0]}&fov=120&key=${process.env.GOOGLE_API_KEY}`;
    image.description = 'Google Street View and contributors';
    image.source_name =  'Google Street View';
    image.source_url = '//google.com';
    resolve(image);
  })
}