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
  description_short: {
    essential: false,
    type: 'string',
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        src_path: ['properties', 'description'],
        value_translation: identity
      },
      wikidata: {
        src_path: ['descriptions', 'en'],
        value_translation: identity
      }
    }
  },
  id_osm: {
    essential: true,
    type: 'string',
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
    src_pref: ['wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P5282'],
        value_translation: identity
      }
    }
  },
  featured_image_name: {
    essential: false,
    type: 'url',
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
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P625'],
        value_translation: coordList => {
          // return coords in lng lat format
          return [coordList[0].value[1], coordList[0].value[0]]
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
              return null;
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
              return null;
          }
        }
      }
    }
  },
  wiki_commons_name: {
    essential: false,
    type: 'string',
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
    src_pref: [],
    src_config: {}
  },
  wikipedia_de_url: {
    essential: true,
    type: 'url',
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
    src_pref: [],
    src_config: {}
  },
  operator_name: {
    essential: false,
    type: 'string',
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
    src_pref: [],
    src_config: {}
  },
  access_pet: {
    essential: true,
    type: 'boolean_string',
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
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'flow_rate'],
        value_translation: identity
      }
    }
  },
  fix_me: {
    essential: false,
    type: 'string',
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'fixme'],
        value_translation: identity
      }
    }
  }
};
_.forEach(fountain_properties, function (property, key) {
  property.name = key;
  property.value = null;
  property.comment = 'no data found';
  property.status = PROP_STATUS_WARNING;
  property.source = '';
});
// some custom values
fountain_properties.fixme.value = '';
fountain_properties.fixme.status = PROP_STATUS_OK;

export const fountain_property_metadata = fountain_properties;