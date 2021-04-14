/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

// This file dictates which elements should be queried from OSM, and which properties are implied by their tags

const osm_fountain_config = {
    "sub_sources":[
      {
        "tag": {
          "name": "man_made",
          "value": "drinking_fountain"
        },
        "implies":
        [
          {
            "key": "drinking_water",
            "value": "yes"
          }
        ]
      },{
        "tag": {
          "name": "amenity",
          "value": "drinking_water"
        },
        "implies":
          [
            {
              "key": "drinking_water",
              "value": "yes"
            }
          ]
      },{
        "tag": {
          "name": "amenity",
          "value": "water_point"
        },
        "implies":
          [
            {
              "key": "drinking_water",
              "value": "yes"
            },
            {
              "key": "bottle",
              "value": "yes"
            },
          ]
      },{
        "tag": {
          "name": "man_made",
          "value": "water_tap"
        },
        "implies":[
          {
            "key": "bottle",
            "value": "yes"
          },
        ]
      },{
        "tag": {
          "name": "natural",
          "value": "spring"
        },
        //TODO @ralfhauser, `implies: []` has no effect (at least in applyImplied.service). Is this an old definition which could be removed?
        "implies": []
      },{
        "tag": {
          "name": "amenity",
          "value": "watering_place"
        },
        "implies":[
          {
            "key": "bottle",
            "value": "yes"
          },
          {
            "key": "access_horse",
            "value": "yes"
          }
        ]
      },{
        "tag": {
          "name": "amenity",
          "value": "fountain"
        },
        //TODO @ralfhauser,`implies: []` has no effect (at least in applyImplied.service). Is this an old definition which could be removed?
        "implies": []
      },{
        "tag": {
          "name": "man_made",
          "value": "water_well"
        },
        //TODO @ralfhauser, `implies: []` has no effect (at least in applyImplied.service).  Is this an old definition which could be removed?
        "implies": []
      }
    ]
  };

export default osm_fountain_config;