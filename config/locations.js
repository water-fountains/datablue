/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

export const locations = {
    "ch-zh": {
      name: 'Zurich',
      "bounding_box": {
        "latMin": 47.3229261255644,
        "lngMin": 8.45960259979614,
        "latMax": 47.431119712250506,
        "lngMax": 8.61940272745742
      },
      "operator_fountain_catalog_qid": 'Q53629101',
      issue_api:{
        qid: null,
        thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/ZueriWieNeuLogo.png',
        url_template: 'https://www.zueriwieneu.ch/report/new?longitude=${lon}&latitude=${lat}&category=Brunnen/Hydranten'
      }
    },
    "ch-ge": {
      name: 'Geneva',
      "bounding_box": {
        "latMin": 46.113705723112744,
        "lngMin": 6.0129547119140625,
        "latMax": 46.29001987172955,
        "lngMax": 6.273880004882812
      },
      "operator_fountain_catalog_qid": 'undefined',
      issue_api:{
        qid: null,
        thumbnail_url: '',
        url_template: null
      }
    },
    "ch-bl": {
      name: 'Basel',
      "bounding_box": {
        "latMin": 47.517200697839414,
        "lngMin": 7.544174194335937,
        "latMax": 47.60477416894759,
        "lngMax": 7.676696777343749
      },
      "operator_fountain_catalog_qid": 'undefined',
      issue_api:{
        qid: null,
        thumbnail_url: '',
        url_template: null
      }
    },
  "ch-lz": {
    name: 'Lucerne',
    "bounding_box": {
      "latMin": 47.03608752310776,
      "lngMin": 8.282318115234375,
      "latMax": 47.068718776878946,
      "lngMax": 8.33810806274414
    },
    "operator_fountain_catalog_qid": 'undefined',
    issue_api:{
      qid: null,
      thumbnail_url: '',
      url_template: null
    }
  },
  "us-nyc": {
    name: 'New York',
    "bounding_box": {
      "latMin": 40.643135583312805,
      "lngMin": -74.13848876953125,
      "latMax": 40.852254338121625,
      "lngMax": -73.81988525390624
    },
    "operator_fountain_catalog_qid": 'undefined',
    issue_api:{
      qid: null,
      thumbnail_url: '',
      url_template: null
    }
  }
  };
