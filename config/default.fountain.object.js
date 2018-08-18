const _ = require('lodash');

let default_fountain_template = {
  properties: {
    name:{
      value: '',
      essential: true
  },
    name_en:{
      value: '',
      essential: true
  },
    name_de:{
      value: '',
      essential: true
  },
    name_fr:{
      value: '',
      essential: true
  },
    description_short:{
      value: '',
      essential: false
  },
    id_osm:{
      value: 'undefined',
      essential: true
  },
    id_operator:{
      value: 'undefined',
      essential: true
  },
    id_wikidata:{
      value: 'undefined',
      essential: true
  },
    construction_date:{
      value: null,
      essential: true
  },
    availability:{
      value: null,
      essential: false
  },
    floor_level:{
      value: null,
      essential: false
  },
    fixme:{
      value: '',
      essential: false
  },
    directions:{
      value: null,
      essential: true
  },
    pano_url:{
      value: null,
      essential: false
  },
    image_url:{
      value: null,
      essential: false
  },
    coords:{
      value: [],
      essential: false
    },
    water_type:{
      value: 'unavailable',
      essential: true
    },
    wiki_commons_name:{
      value: null,
      essential: false
    },
    wikipedia_en_url:{
      value: null,
      essential: true
    },
    wikipedia_de_url:{
      value: null,
      essential: true
    },
    operator_name:{
      value: null,
      essential: false
    },
    gallery:{
      value: null,
      essential: false
    },
    access_pet:{
      value: null,
      essential: true
    },
    access_bottle:{
      value: null,
      essential: true
    },
    water_flow:{
      value: null,
      essential: false
    }
}
};
_.forEach(default_fountain_template.properties, function(value, key) {
  value.rank = 10;
  value.comment = '';
});

export const default_fountain = default_fountain_template;