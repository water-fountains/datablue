/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import {PROP_STATUS_OK, PROP_STATUS_WARNING} from "../server/common/constants";
import {locations} from "./locations";

const _ = require('lodash');

function str2bool(val) {
  switch (val) {
    case 'yes':
      return 'true';
    case 'no':
      return 'false';
    default:
      return 'other';
  }
}

function identity(val){return val}

let fountain_properties = {
  name: {
    i18n:{
      en: 'name',
      de: 'Name',
      fr: 'nom'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Common name of the fountain',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P1476'],
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'name'],
        value_translation: identity
      }
    }
  },
  name_en: {
    i18n:{
      en: 'name in English',
      de: 'Name auf Englisch',
      fr: 'nom en anglais'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the fountain in English',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Label',
        src_path: ['labels', 'en'],
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:en'],
        value_translation: identity
      }
    }
  },
  name_de: {
    i18n:{
      en: 'name in German',
      de: 'Name auf Deutsch',
      fr: 'nom en allemand'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the fountain in German',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Label',
        src_path: ['labels', 'de'],
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:de'],
        value_translation: identity
      }
    }
  },
  name_fr: {
    i18n:{
      en: 'name in French',
      de: 'Name auf Französisch',
      fr: 'nom en français'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the fountain in French',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Label',
        src_path: ['labels', 'fr'],
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:fr'],
        value_translation: identity
      }
    }
  },
  description_short_en: {
    i18n:{
      en: 'description in English',
      de: 'Beschreibung auf Englisch',
      fr: 'description en anglais'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'short description of the fountain in English',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Key:description',
        src_path: ['properties', 'description:en'],
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'en'],
        value_translation: identity
      }
    }
  },
  description_short_de: {
    i18n:{
      en: 'description in German',
      de: 'Beschreibung auf Deutsch',
      fr: 'description en allemand'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Short description of the fountain in German.',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Key:description',
        src_path: ['properties', 'description:de'],
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'de'],
        value_translation: identity
      }
    }
  },
  description_short_fr: {
    i18n:{
      en: 'description in French',
      de: 'Beschreibung auf Französisch',
      fr: 'description en français'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Short description of the fountain in French.',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Key:description',
        src_path: ['properties', 'description:fr'],
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'fr'],
        value_translation: identity
      }
    }
  },
  id_osm: {
    i18n:{
      en: 'OpenStreetMap identifier',
      de: 'OpenStreetMap-ID',
      fr: 'identifiant OpenStreetMap'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Identifier used by OpenStreetMap for the fountain. Fountains can be either nodes or ways, therefore the identifier must include this information.',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        help: null,
        src_path: ['properties', 'id'],
        value_translation: identity
      }
    }
  },
  id_operator: {
    i18n:{
      en: 'operator identifier',
      de: 'Betreiber-ID',
      fr: 'identifiant opérateur'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Identifier used by the fountain operator for the fountain.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P528'],
        value_translation: catCodes => {
          // loop through all catalog codes to find the right one
          for(let code of catCodes){
            // return value only if qualifier matches the operator id
            if(_.map(locations, 'operator_qid').indexOf(code.qualifiers['P972'][0]) >= 0) {
              return code.value;
              
            }
          }
        },
      },
      osm: {
        src_path: ['properties', 'ref'],
        value_translation: identity
      }
    }
  },
  id_wikidata: {
    i18n:{
      en: 'Wikidata identifier',
      de: 'Wikidata-ID',
      fr: 'identifiant Wikidata'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Identifier used by Wikidata for the fountain.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['id'],
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'wikidata'],
        value_translation: identity
      }
    }
  },
  construction_date: {
    i18n:{
      en: 'construction date',
      de: 'Baujahr',
      fr: 'date de construction'
    },
    essential: true,
    type: 'number',
    descriptions: {
      en:'Year of construction. [example: 1971]',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P571'],
        value_translation: values => {
          //just keep the first date
          return parseInt(values[0].value.substring(0, 4));
        }
      },
      osm: {
        src_path: ['properties', 'start_date'],
        value_translation: identity
      }
    }
  },
  availability: {
    i18n:{
      en: 'availability',
      de: 'aktiver Zeitraum',
      fr: 'disponibilité'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Times of the year during which the fountain is running. [example: March-November]',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'opening_hours'],
        value_translation: identity
      }
    }
  },
  floor_level: {
    i18n:{
      en: 'floor',
      de: 'Stockwerk',
      fr: 'niveau'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Floor at which the fountain is situated.',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'level'],
        value_translation: identity
      }
    }
  },
  fixme: {
    i18n:{
      en: 'data errors',
      de: 'Datenfehler',
      fr: 'erreurs de données'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Property used in OpenStreetMap to indicate if there might be data issues.',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'fixme'],
        value_translation: identity
      }
    }
  },
  directions: {
    i18n:{
      en: 'location',
      de: 'Lage',
      fr: 'emplacement'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Directions to or address of fountain. [example: near Kappenbühlstrasse 74]',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P2795', 0, 'value'],
        value_translation: identity
      }
    }
  },
  pano_url: {
    i18n:{
      en: 'panorama URLs',
      de: 'Panorama-URLs',
      fr: 'URL des panoramas'
    },
    essential: false,
    type: 'object',
    descriptions: {
      en:'URLs to street-level views of the fountain. The source of the imagery is determined automatically on the basis of the domain name.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P5282'],
        value_translation: (list)=>{
          return _.map(list, el=>{
            let url = el.value;
            // determine source from url
            let source_name = 'unknown';
            if(url.includes('goo.gl/maps') || url.includes('instantstreetview')){
              source_name = 'Google Street View';
            }else if(url.includes('mapillary')){
              source_name = 'Mapillary';
            }else if(url.includes('openstreetcam')){
              source_name = 'OpenStreetCam';
            }
            return {
              source_name: source_name,
              url: url
            }
          })
        }
      }
    }
  },
  featured_image_name: {
    i18n:{
      en: 'featured image',
      de: 'Hauptbild',
      fr: 'image principal'
    },
    essential: false,
    type: 'url',
    descriptions: {
      en:'Name of the featured image as documented in Wikidata. This is useful for creating the gallery object, but otherwise not used directly.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P18', 0, 'value'],
        value_translation: identity
      }
    }
  },
  coords: {
    i18n:{
      en: 'coordinates',
      de: 'Koordinaten',
      fr: 'coordonnées'
    },
    essential: false,
    type: 'coords',
    descriptions: {
      en:'Geographical coordinates at which the fountain is located, expressed as an array of longitude and latitude (in that order).',
      de: '',
      fr: ''
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P625'],
        value_translation: coordList => {
          // return coords in lng lat format !! reverse will mutate array
          return coordList[0].value.slice().reverse()
        }
      },
      osm: {
        src_path: ['geometry', 'coordinates'],
        value_translation: identity
      }
    }
  },
  water_type: {
    i18n:{
      en: 'water type',
      de: 'Wasserart',
      fr: 'type d\'eau'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Type of water that the fountain provides, for example tap water, springwater, or groundwater.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P5623'],
        value_translation: vals => {
          switch (vals[0].value) {
            case "Q53633635":
              return "tapwater";
            case "Q1881858":
              return "springwater";
            case "Q53634173":
              return "own_supply";
            case "Q161598":
              return "groundwater";
            default:
              return "other: "+vals[0].value;
          }
        }
      },
      osm: {
        src_path: ['properties', 'water_type'],
        value_translation: vals => {
          switch (vals[0].value) {
            case "Leitungswasser":
              return "tapwater";
            case "Quellwasser":
              return "springwater";
            case "eigene Versorgung":
              return "own_supply";
            case "Grundwasser":
              return "groundwater";
            default:
              return "other: "+vals[0].value;
          }
        }
      }
    }
  },
  wiki_commons_name: {
    i18n:{
      en: 'Wikimedia Commons category',
      de: 'Wikicommons-Kategorie',
      fr: 'catégorie Wikimedia Commons'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Name of the Wikimedia Commons page of the fountain',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P373'],
        value_translation: names => {
          return `Category:${names[0].value}`;
        }
      },
      osm: {
        src_path: ['properties', 'wikimedia_commons'],
        value_translation: identity
      }
    }
  },
  wikipedia_en_url: {
    i18n:{
      en: 'Wikipedia page in English',
      de: 'Wikipediaseite auf Englisch',
      fr: 'page Wikipedia en anglais'
    },
    essential: true,
    type: 'url',
    descriptions: {
      en:'URL of the fountain Wikipedia page in English.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['sitelinks', 'enwiki'],
        value_translation: name => {
          return `https://en.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        value_translation: val => {
          let parts = val.split(':');
          if (parts[0] === 'en') {
            return `https://en.wikipedia.org/wiki/${parts[1]}`;
          } else {
            return null;
          }
        }
      }
    }
  },
  wikipedia_en_summary: {
    i18n:{
      en: 'Wikipedia extract in English',
      de: 'Auszug Wikipedia auf Englisch',
      fr: 'extrait Wikipedia en anglais'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Summary extracted from the fountain Wikipedia page in English.',
      de: '',
      fr: ''
    },
    src_pref: [],
    src_config: {}
  },
  wikipedia_de_url: {
    i18n:{
      en: 'Wikipedia page in German',
      de: 'Wikipediaseite auf Deutsch',
      fr: 'page Wikipedia en allemand'
    },
    essential: true,
    type: 'url',
    descriptions: {
      en:'URL of the fountain Wikipedia page in German.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['sitelinks', 'dewiki'],
        value_translation: name => {
          return `https://de.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        value_translation: val => {
          let parts = val.split(':');
          if (parts[0] === 'de') {
            return `https://de.wikipedia.org/wiki/${parts[1]}`;
          } else {
            return null;
          }
        }
      }
    }
  },
  wikipedia_de_summary: {
    i18n:{
      en: 'Wikipedia extract in German',
      de: 'Auszug Wikipedia auf Deutsch',
      fr: 'extrait Wikipedia en allemand'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Summary extracted from the fountain Wikipedia page in German.',
      de: '',
      fr: ''
    },
    src_pref: [],
    src_config: {}
  },
  wikipedia_fr_url: {
    i18n:{
      en: 'Wikipedia page in French',
      de: 'Wikipediaseite auf Französisch',
      fr: 'page Wikipedia en français'
    },
    essential: true,
    type: 'url',
    descriptions: {
      en:'URL of the fountain Wikipedia page in French.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['sitelinks', 'frwiki'],
        value_translation: name => {
          return `https://fr.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        value_translation: val => {
          let parts = val.split(':');
          if (parts[0] === 'fr') {
            return `https://fr.wikipedia.org/wiki/${parts[1]}`;
          } else {
            return null;
          }
        }
      }
    }
  },
  wikipedia_fr_summary: {
    i18n:{
      en: 'Wikipedia extract in French',
      de: 'Auszug Wikipedia auf Französisch',
      fr: 'extrait Wikipedia en français'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Summary extracted from the fountain Wikipedia page in French.',
      de: '',
      fr: ''
    },
    src_pref: [],
    src_config: {}
  },
  operator_name: {
    i18n:{
      en: 'operator name',
      de: 'Betreiber-Name',
      fr: 'nom de l\'opérateur',
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Name of the operator of the fountain.',
      de: '',
      fr: ''
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P137'],
        value_translation: vals => {
          switch (vals[0].value) {
            case "Q27229237":
              return "Wasserversorgung Zürich";
          }
        }
      },
      osm: {
        src_path: ['properties', 'operator'],
        value_translation: value => {
          switch (value) {
            case "WVZ":
              return "Wasserversorgung Zürich";
          }
        }
      }
    }
  },
  gallery: {
    i18n:{
      en: 'image gallery',
      de: 'Bildergallerie',
      fr: 'galerie d\'images'
    },
    essential: false,
    type: 'object',
    descriptions: {
      en:'Collection of images created from the Wikimedia Commons category, to display in the fountain gallery.',
      de: '',
      fr: ''
    },
    src_pref: [],
    src_config: {}
  },
  access_pet: {
    i18n:{
      en: 'pet access',
      de: 'Kleintierzugriff',
      fr: 'bol pour animaux'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Whether a fountain for small pets is available. [yes, no]',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'dog'],
        value_translation: identity
      }
    }
  },
  access_bottle: {
    i18n:{
      en: 'bottle refill',
      de: 'Flaschenfüllung',
      fr: 'remplissage de bouteille'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Whether a bottle can be refilled easily. [yes, no]',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'bottle'],
        value_translation: identity
      }
    }
  },
  access_wheelchair: {
    i18n:{
      en: 'wheelchair accessible',
      de: 'Rollstuhlgerecht',
      fr: 'accès pour handicapés'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Whether fountain is wheelchair-friendly. [yes, no]',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'wheelchair'],
        value_translation: identity
      }
    }
  },
  potable: {
    i18n:{
      en: 'potable',
      de: 'trinkbar',
      fr: 'potable'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether water is potable or not.',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'drinking_water'],
        value_translation: identity
      }
    }
  },
  potable_controlled: {
    i18n:{
      en: '',
      de: '',
      fr: ''
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether the water is officially certified as potable.',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'drinking_water:legal'],
        value_translation: str2bool
      }
    }
  },
  water_flow: {
    i18n:{
      en: 'water flow',
      de: 'Wasserfluss',
      fr: 'débit'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Flow rate of fountain. [example: 1.5 l/min]',
      de: '',
      fr: ''
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'flow_rate'],
        value_translation: identity
      }
    }
  }
};
_.forEach(fountain_properties, function (property, key) {
  property.name = key;
  property.value = null;
  property.comments = 'no data found';
  property.status = PROP_STATUS_WARNING;
  property.source = '';
});
// some custom values
fountain_properties.fixme.status = PROP_STATUS_OK;
fountain_properties.fixme.comments = '';

export const fountain_property_metadata = fountain_properties;

export function get_prop(fountain, source, property) {
  return fountain_properties[property].src_config[source].value_translation(
    _.get(fountain, fountain_properties[property].src_config[source].src_path));
}