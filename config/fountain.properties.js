import {PROP_STATUS_OK, PROP_STATUS_WARNING} from "../server/common/constants";
import {locations} from "./locations";

const _ = require('lodash');

function str2bool(val) {
  switch (val) {
    case 'yes':
      return true;
    case 'no':
      return false;
    default:
      return 'other';
  }
}

function identity(val){return val}

let fountain_properties = {
  name: {
    essential: true,
    type: 'string',
    description: 'Default name to be shown if no language-specific name is provided',
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
    essential: true,
    type: 'string',
    description: 'Name of the fountain in English',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['labels', 'en'],
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'name:en'],
        value_translation: identity
      }
    }
  },
  name_de: {
    essential: true,
    type: 'string',
    description: 'Name of the fountain in German',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['labels', 'de'],
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'name:de'],
        value_translation: identity
      }
    }
  },
  name_fr: {
    essential: true,
    type: 'string',
    description: 'Name of the fountain in French',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['labels', 'fr'],
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'name:fr'],
        value_translation: identity
      }
    }
  },
  description_short_en: {
    essential: false,
    type: 'string',
    description: 'short description of the fountain in English',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        src_path: ['properties', 'description:en'],
        value_translation: identity
      },
      wikidata: {
        src_path: ['descriptions', 'en'],
        value_translation: identity
      }
    }
  },
  description_short_de: {
    essential: false,
    type: 'string',
    description: 'Short description of the fountain in German.',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        src_path: ['properties', 'description:de'],
        value_translation: identity
      },
      wikidata: {
        src_path: ['descriptions', 'de'],
        value_translation: identity
      }
    }
  },
  id_osm: {
    essential: true,
    type: 'string',
    description: 'Identifier used by OpenStreetMap for the fountain. Fountains can be either nodes or ways, therefore the identifier must include this information.',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'id'],
        value_translation: identity
      }
    }
  },
  id_operator: {
    essential: true,
    type: 'string',
    description: 'Identifier used by the fountain operator for the fountain.',
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P528'],
        value_translation: catCodes => {
          // loop through all catalog codes to find the right one
          for(let code of catCodes){
            // return value only if qualifier matches the operator id
            if (code.qualifiers['P972'][0] === locations.zurich.operator_qid) {
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
    essential: true,
    type: 'string',
    description: 'Identifier used by Wikidata for the fountain.',
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
    essential: true,
    type: 'number',
    description: 'Year of construction. [example: 1971]',
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
    essential: false,
    type: 'string',
    description: 'Times of the year during which the fountain is running. [example: March-November]',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'opening_hours'],
        value_translation: identity
      }
    }
  },
  floor_level: {
    essential: false,
    type: 'string',
    description: 'Floor at which the fountain is situated.',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'level'],
        value_translation: identity
      }
    }
  },
  fixme: {
    essential: false,
    type: 'string',
    description: 'Property used in OpenStreetMap to indicate if there might be data issues.',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'fixme'],
        value_translation: identity
      }
    }
  },
  directions: {
    essential: true,
    type: 'string',
    description: 'Directions to or address of fountain. [example: near Kappenbühlstrasse 74]',
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P2795', 0, 'value'],
        value_translation: identity
      }
    }
  },
  pano_url: {
    essential: false,
    type: 'url',
    description: 'URL to a street-level view of the fountain.',
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P5282', 0, 'value'],
        value_translation: identity
      }
    }
  },
  featured_image_name: {
    essential: false,
    type: 'url',
    description: 'Name of the featured image as documented in Wikidata. This is useful for creating the gallery object, but otherwise not used directly.',
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P18', 0, 'value'],
        value_translation: identity
      }
    }
  },
  coords: {
    essential: false,
    type: 'coords',
    description: 'Geographical coordinates at which the fountain is located, expressed as an array of longitude and latitude (in that order).',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P625'],
        value_translation: coordList => {
          // return coords in lng lat format
          return coordList[0].value.reverse();
        }
      },
      osm: {
        src_path: ['geometry', 'coordinates'],
        value_translation: identity
      }
    }
  },
  water_type: {
    essential: true,
    type: 'string',
    description: 'Type of water that the fountain provides, for example tap water, springwater, or groundwater.',
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
    essential: false,
    type: 'string',
    description: 'Name of the Wikimedia Commons page of the fountain',
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
    essential: true,
    type: 'url',
    description: 'URL of the fountain Wikipedia page in English.',
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
    essential: false,
    type: 'string',
    description: 'Summary extracted from the fountain Wikipedia page in English.',
    src_pref: [],
    src_config: {}
  },
  wikipedia_de_url: {
    essential: true,
    type: 'url',
    description: 'URL of the fountain Wikipedia page in German.',
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
    essential: false,
    type: 'string',
    description: 'Summary extracted from the fountain Wikipedia page in German.',
    src_pref: [],
    src_config: {}
  },
  operator_name: {
    essential: false,
    type: 'string',
    description: 'Name of the operator of the fountain.',
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
    essential: false,
    type: 'object',
    description: 'Collection of images created from the Wikimedia Commons category, to display in the fountain gallery.',
    src_pref: [],
    src_config: {}
  },
  access_pet: {
    essential: true,
    type: 'boolean_string',
    description: 'Whether a fountain for small pets is available. [yes, no]',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'dog'],
        value_translation: str2bool
      }
    }
  },
  access_bottle: {
    essential: true,
    type: 'boolean_string',
    description: 'Whether a bottle can be refilled easily. [yes, no]',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'bottle'],
        value_translation: str2bool
      }
    }
  },
  access_wheelchair: {
    essential: true,
    type: 'boolean_string',
    description: 'Whether fountain is wheelchair-friendly. [yes, no]',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'wheelchair'],
        value_translation: str2bool
      }
    }
  },
  potable: {
    essential: true,
    type: 'boolean_string',
    description: 'Indicates whether water is potable or not.',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'drinking_water'],
        value_translation: str2bool
      }
    }
  },
  potable_controlled: {
    essential: true,
    type: 'boolean_string',
    description: 'Indicates whether the water is officially certified as potable.',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'drinking_water:legal'],
        value_translation: str2bool
      }
    }
  },
  water_flow: {
    essential: false,
    type: 'string',
    description: 'Flow rate of fountain. [example: 1.5 l/min]',
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