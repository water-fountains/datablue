/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import osm_fountain_config from '../../../config/fountains.sources.osm';
import { FountainConfig } from '../../common/typealias';

// This service translates data read from OpenStreetMap into the server's standardized property terms for fountains. 
// For example, the tag man_made=drinking_fountain implies that drinking_water=yes.
// For this, the config files are used
function applyImpliedPropertiesOsm(fountainConfigArr: FountainConfig[]): Promise<FountainConfig[]> {
  return new Promise((resolve, reject) => {
    // for each fountain in the collection, remap the properties
    fountainConfigArr.forEach(fountainConfig=> {
      // for each implied property, extract the tag name-value pair
      osm_fountain_config.sub_sources.forEach(sub_source => {
        let tag_name = sub_source.tag.name;
        let tag_value = sub_source.tag.value;
        // check if our fountain has the tag and if that tag has the right value
        const properties = fountainConfig.properties
        if (properties != null && tag_name in properties && properties[tag_name] === tag_value) {
          sub_source.implies.forEach(implication => {
            // if so, apply implied property values, but only if the property doesn't already have a value defined
            if(!properties.hasOwnProperty(implication.key)){
              properties[implication.key] = implication.value;
            }
          })
        }
      });
    });
    // return the fountain configs with added properties
    resolve(fountainConfigArr);
    // if there is an issue causing a delay, reject the promise
    setTimeout(() => reject('Timed out on applying implied property for fountains'), 500);
  })
}

export default applyImpliedPropertiesOsm;