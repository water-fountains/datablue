import {PROP_STATUS_OK, PROP_STATUS_WARNING} from "../server/common/constants";

const _ = require('lodash');

let default_fountain_template = {
  properties: {
    name:{
      essential: true
  },
    name_en:{
      essential: true
  },
    name_de:{
      essential: true
  },
    name_fr:{
      essential: true
  },
    description_short:{
      essential: false
  },
    id_osm:{
      essential: true
  },
    id_operator:{
      essential: true
  },
    id_wikidata:{
      essential: true
  },
    construction_date:{
      essential: true
  },
    availability:{
      essential: false
  },
    floor_level:{
      essential: false
  },
    fixme:{
      essential: false
  },
    directions:{
      essential: true
  },
    pano_url:{
      essential: false
  },
    image_url:{
      essential: false
  },
    coords:{
      essential: false
    },
    water_type:{
      essential: true
    },
    wiki_commons_name:{
      essential: false
    },
    wikipedia_en_url:{
      essential: true
    },
    wikipedia_de_url:{
      essential: true
    },
    operator_name:{
      essential: false
    },
    gallery:{
      essential: false
    },
    access_pet:{
      essential: true
    },
    access_bottle:{
      essential: true
    },
    access_wheelchair:{
      essential: true
    },
    potable:{
      essential: false
    },
    water_flow:{
      essential: false
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