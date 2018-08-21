import {PROP_STATUS_OK, PROP_STATUS_WARNING} from "../server/common/constants";

const _ = require('lodash');

let default_fountain_template = {
  properties: {
    name:{
      essential: true,
      type: 'string'
  },
    name_en:{
      essential: true,
      type: 'string'
  },
    name_de:{
      essential: true,
      type: 'string'
  },
    name_fr:{
      essential: true,
      type: 'string'
  },
    description_short:{
      essential: false,
      type: 'string'
  },
    id_osm:{
      essential: true,
      type: 'string'
  },
    id_operator:{
      essential: true,
      type: 'string'
  },
    id_wikidata:{
      essential: true,
      type: 'string'
  },
    construction_date:{
      essential: true,
      type: 'number'
  },
    availability:{
      essential: false,
      type: 'string'
  },
    floor_level:{
      essential: false,
      type: 'string'
  },
    fixme:{
      essential: false,
      type: 'string'
  },
    directions:{
      essential: true,
      type: 'string'
  },
    pano_url:{
      essential: false,
      type: 'url'
  },
    featured_image_name:{
      essential: false,
      type: 'url'
  },
    coords:{
      essential: false,
      type: 'coords'
    },
    water_type:{
      essential: true,
      type: 'string'
    },
    wiki_commons_name:{
      essential: false,
      type: 'string'
    },
    wikipedia_en_url:{
      essential: true,
      type: 'url'
    },
    wikipedia_de_url:{
      essential: true,
      type: 'url'
    },
    operator_name:{
      essential: false,
      type: 'string'
    },
    gallery:{
      essential: false,
      type: 'object'
    },
    access_pet:{
      essential: true,
      type: 'boolean_string'
    },
    access_bottle:{
      essential: true,
      type: 'boolean_string'
    },
    access_wheelchair:{
      essential: true,
      type: 'boolean_string'
    },
    potable:{
      essential: false,
      type: 'boolean_string'
    },
    water_flow:{
      essential: false,
      type: 'string'
    }
}
};
_.forEach(default_fountain_template.properties, function(value, key) {
  value.rank = 10;
  value.value = null;
  value.comment = 'no data found';
  value.status = PROP_STATUS_WARNING;
});
// some custom values
default_fountain_template.properties.fixme.value = '';

export const default_fountain = default_fountain_template;