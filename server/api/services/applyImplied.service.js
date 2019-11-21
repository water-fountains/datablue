/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import l from '../../common/logger';
import osm_fountain_config from '../../../config/fountains.sources.osm';

// This service translates data read from OpenStreetMap into the server's standardized property terms for fountains. 
// For example, the tag man_made=drinking_fountain implies that drinking_water=yes.
// For this, the config files are used

function applyImpliedPropertiesOsm(fountainCollection) {
  return new Promise((resolve, reject) => {
    // for each fountain in the collection, remap the properties
    fountainCollection.forEach(f=> {
      // for each implied property, extract the tag name-value pair
      osm_fountain_config.sub_sources.forEach(function (sub_source) {
        let tag_name = sub_source.tag.name;
        let tag_value = sub_source.tag.value;
        // check if our fountain has the tag and if that tag has the right value
        if ((tag_name in f.properties) &&
          (f.properties[tag_name] === tag_value)) {
          sub_source.implies.forEach(implication => {
            // if so, apply implied property values, but only if the property doesn't already have a value defined
            if(!f.properties.hasOwnProperty(implication.key)){
              f.properties[implication.key] = implication.value;
            }
          })
        }
      });
    });
    // return the fountains with added properties
    resolve(fountainCollection);
    // if there is an issue causing a delay, reject the promise
    setTimeout(() => reject('Timed out on applying implied property for fountains'), 500);
  })
}

export default applyImpliedPropertiesOsm;