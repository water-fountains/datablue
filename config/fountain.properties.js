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
    name:{
      en: 'title',
      de: 'Titel',
      fr: 'titre'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Original title of the fountain, for example the title given by the sculptor.',
      de: 'Originaltitel des Brunnens, zum Beispiel der vom Bildhauer gegeben wurde.',
      fr: 'Titre original de la fontaine, par exemple celui donné par le sculpteur.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P1476'],
        src_name: ['Statement', 'title'],
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'name'],
        src_name: ['tag', 'name'],
        value_translation: identity
      }
    }
  },
  name_en: {
    name:{
      en: 'name (en)',
      de: 'Name (en)',
      fr: 'nom (en)'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the fountain in English.',
      de: 'Name des Brunnens auf Englisch.',
      fr: 'Nom de la fontaine en anglais.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Label',
        src_path: ['labels', 'en'],
        src_name: ['Label', 'English'],
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:en'],
        src_name: ['tag', 'name:en'],
        value_translation: identity
      }
    }
  },
  name_de: {
    name:{
      en: 'name (de)',
      de: 'Name (de)',
      fr: 'nom (de)'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the fountain in German',
      de: 'Name des Brunnens auf Deutsch.',
      fr: 'Nom de la fontaine en allemand.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Label',
        src_path: ['labels', 'de'],
        src_name: ['Label', 'German'],
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:de'],
        src_name: ['tag', 'name:de'],
        value_translation: identity
      }
    }
  },
  name_fr: {
    name:{
      en: 'name (fr)',
      de: 'Name (fr)',
      fr: 'nom (fr)'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the fountain in French',
      de: 'Name des Brunnens auf Französisch.',
      fr: 'Nom de la fontaine en français.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Label',
        src_path: ['labels', 'fr'],
        src_name: ['Label', 'French'],
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:fr'],
        src_name: ['tag', 'name:fr'],
        value_translation: identity
      }
    }
  },
  description_short_en: {
    name:{
      en: 'description (en)',
      de: 'Beschreibung (en)',
      fr: 'description (en)'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Short description of the fountain in English.',
      de: 'Kurze Beschreibung des Brunnens auf Englisch.',
      fr: 'Brève description de la fontaine en anglais.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Key:description',
        src_path: ['properties', 'description:en'],
        src_name: ['tag', 'description:en'],
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'en'],
        src_name: ['Description', 'English'],
        value_translation: identity
      }
    }
  },
  description_short_de: {
    name:{
      en: 'description (de)',
      de: 'Beschreibung (de)',
      fr: 'description (de)'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Short description of the fountain in German.',
      de: 'Kurze Beschreibung des Brunnens auf Deutsch.',
      fr: 'Brève description de la fontaine en allemand.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Key:description',
        src_path: ['properties', 'description:de'],
        src_name: ['tag', 'description:de'],
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'de'],
        src_name: ['Description', 'German'],
        value_translation: identity
      }
    }
  },
  description_short_fr: {
    name:{
      en: 'description (fr)',
      de: 'Beschreibung (fr)',
      fr: 'description (fr)'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Short description of the fountain in French.',
      de: 'Kurze Beschreibung des Brunnens auf Französisch.',
      fr: 'Brève description de la fontaine en français.'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Key:description',
        src_path: ['properties', 'description:fr'],
        src_name: ['tag', 'description:fr'],
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'fr'],
        src_name: ['Description', 'French'],
        value_translation: identity
      }
    }
  },
  id_osm: {
    name:{
      en: 'ID (OpenStreetMap)',
      de: 'ID (OpenStreetMap)',
      fr: 'ID (OpenStreetMap)'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Identifier used by OpenStreetMap for the fountain. Fountains can be either nodes or ways, therefore the identifier must start with either "node" or "way".',
      de: 'Kennung, die von OpenStreetMap für den Brunnen verwendet wird. Brunnen können entweder Knoten oder Wege sein, daher muss der Identifikator entweder mit "node" oder "way" beginnen.',
      fr: 'Identifiant utilisé par OpenStreetMap pour la fontaine. Les fontaines peuvent être soit des noeuds, soit des voies, donc l\'identificateur doit commencer par "node" ou "way".'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Elements',
        src_path: ['properties', 'id'],
        src_name: ['id'],
        src_info: 'OpenStreetMap identifier cannot be easily modified in online editor.',
        value_translation: identity
      },
      wikidata: null
    }
  },
  id_operator: {
    name:{
      en: 'ID (operator)',
      de: 'ID (Betreiber)',
      fr: 'ID (opérateur)'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Identifier used by the fountain operator to catalog the fountain.',
      de: 'Kennung, die vom Brunnenbetreiber zur Katalogisierung des Brunnens verwendet wird.',
      fr: 'Identificateur utilisé par l\'opérateur de la fontaine pour cataloguer la fontaine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P528'],
        src_name: ['Statement', 'catalog code'],
        src_info: `The catalog code must have a 'catalog' qualifier referring to the catalog documented in the location metadata. (${_.map(locations, (l,name)=>{return `${name}: ${l.operator_qid}`}).join(', ')})`,
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
        src_name: ['tag', 'ref'],
        src_info: 'This tag could also be used for other purposes. We therefore recommend using Wikidata to store this information.',
        value_translation: identity
      }
    }
  },
  id_wikidata: {
    name:{
      en: 'ID (Wikidata)',
      de: 'ID (Wikidata)',
      fr: 'ID (Wikidata)'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Identifier used by Wikidata for the fountain.',
      de: 'Kennung, die von Wikidata für den Brunnen verwendet wird.',
      fr: 'Identifiant utilisé par Wikidata pour la fontaine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Wikidata:Identifiers',
        src_path: ['id'],
        src_name: ['-'],
        src_info: 'The Wikidata identifier cannot be modified. It uniquely identifies a Wikidata entity.',
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'wikidata'],
        src_name: ['tag', 'wikidata'],
        value_translation: identity
      }
    }
  },
  construction_date: {
    name:{
      en: 'construction date',
      de: 'Baujahr',
      fr: 'date de construction'
    },
    essential: true,
    type: 'number',
    descriptions: {
      en:'Year the fountain was constructed. If multiple dates are provided in Wikidata, only the first is shown here.',
      de: 'Baujahr des Brunnens. Wenn in Wikidata mehrere Daten angegeben sind, wird hier nur das erste angezeigt.',
      fr: 'Année de construction de la fontaine. Si plusieurs dates sont fournies dans Wikidata, seule la première est affichée ici.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P571'],
        src_name: ['Statement', 'inception'],
        extraction_info: 'Only the first value returned by wikidata is kept.',
        value_translation: values => {
          //just keep the first date
          return parseInt(values[0].value.substring(0, 4));
        }
      },
      osm: {
        src_path: ['properties', 'start_date'],
        src_name: ['tag', 'start_date'],
        value_translation: identity
      }
    }
  },
  artist_name: {
    name:{
      en: 'artist name',
      de: 'Name des Künstlers',
      fr: 'nom de l\'artiste'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Name of the artist who created or designed the fountain.',
      de: 'Der Name des Künstlers, der den Brunnen erschaffen hat.',
      fr: 'Nom de l\'artiste qui a créé ou conçu la fontaine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P170'],
        src_name: ['Statement', 'creator'],
        extraction_info: 'Only the first value returned by Wikidata is kept. If the QID corresponds to that of "anonymous" (Q4233718), return null.',
        value_translation: values => {
          //just keep the first value
          if(values[0].value !== 'Q4233718'){
            return values[0].value;
          }else{
            // fix for https://github.com/water-fountains/proximap/issues/129
            return null;
          };
        }
      },
      osm: {
        src_path: ['properties', 'artist_name'],
        src_name: ['tag', 'artist_name'],
        value_translation: identity
      }
    }
  },
  availability: {
    name:{
      en: 'availability',
      de: 'aktiver Zeitraum',
      fr: 'disponibilité'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Times of the year during which the fountain is running. [example: March-November]',
      de: 'Zeiten des Jahres, in denen der Brunnen läuft. [Beispiel: März-November]',
      fr: 'Périodes de l\'année durant lesquelles la fontaine fonctionne. [exemple : mars-novembre]'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'opening_hours'],
        src_name: ['tag', 'opening_hours'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  floor_level: {
    name:{
      en: 'floor',
      de: 'Stockwerk',
      fr: 'niveau'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Floor at which the fountain is situated.',
      de: 'Stockwerk, auf dem sich der Brunnen befindet.',
      fr: 'L\'étage où se trouve la fontaine.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'level'],
        src_name: ['tag', 'level'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  fixme: {
    name:{
      en: 'data errors',
      de: 'Datenfehler',
      fr: 'erreurs de données'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Property used in OpenStreetMap to indicate if there might be data issues.',
      de: 'Eigenschaft, die in OpenStreetMap verwendet wird, um anzuzeigen, ob es Datenprobleme geben könnte.',
      fr: 'Propriété utilisée dans OpenStreetMap pour indiquer s\'il y a des problèmes de données.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'fixme'],
        src_name: ['tag', 'fixme'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  directions: {
    name:{
      en: 'location',
      de: 'Lage',
      fr: 'emplacement'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Directions to or address of fountain. [example: near Kappenbühlstrasse 74]',
      de: 'Wegbeschreibung oder Adresse des Brunnens. [Beispiel: near Kappenbühlstrasse 74]',
      fr: 'Itinéraire pour se rendre à la fontaine ou adresse de la fontaine. [exemple: near Kappenbühlstrasse 74]'
    },
    src_pref: ['wikidata'],
    src_config: {
      osm: null,
      wikidata: {
        src_path: ['claims', 'P2795'],
        src_name: ['Statement', 'directions'],
        src_info: 'Only first value returned by Wikidata is kept.',
        value_translation: values => {
          //just keep the first name
          return values[0].value;
        }
      }
    }
  },
  pano_url: {
    name:{
      en: 'panorama URLs',
      de: 'Panorama-URLs',
      fr: 'URL des panoramas'
    },
    essential: false,
    type: 'object',
    descriptions: {
      en:'URLs to street-level views of the fountain.',
      de: 'URLs zu Straßenansichten des Brunnens.',
      fr: 'URLs vers les images de la fontaine au niveau de la rue.'
    },
    src_pref: ['wikidata'],
    src_config: {
      osm: null,
      wikidata: {
        src_path: ['claims', 'P5282'],
        src_name: ['Statement', 'ground level 360 degree view'],
        extraction_info: 'The source of the imagery is determined automatically on the basis of the url.',
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
    name:{
      en: 'featured image',
      de: 'Hauptbild',
      fr: 'image principal'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Name of the featured image as documented in Wikidata. This is useful for creating the gallery object, but otherwise not used directly.',
      de: 'Name des Hauptbildes, wie in Wikidata dokumentiert. Dies ist nützlich für die Erstellung des Galerie-Objekts, wird aber ansonsten nicht direkt verwendet.',
      fr: 'Nom de l\'image principale tel que documenté dans Wikidata. Ceci est utile pour créer l\'objet de la galerie, mais n\'est pas utilisé directement.'
    },
    src_pref: ['wikidata'],
    src_config: {
      osm: null,
      wikidata: {
        src_path: ['claims', 'P18'],
        src_name: ['Statement', 'image'],
        extraction_info: 'Only the first value returned by Wikidata is kept.',
        value_translation: values => {
          //just keep the first value
          return values[0].value;
        }
      }
    }
  },
  coords: {
    name:{
      en: 'coordinates',
      de: 'Koordinaten',
      fr: 'coordonnées'
    },
    essential: false,
    type: 'coords',
    descriptions: {
      en:'Geographical coordinates at which the fountain is located, expressed as an array of longitude and latitude (in that order).',
      de: 'Geographische Koordinaten, an denen sich der Brunnen befindet, ausgedrückt als eine Liste von Längen- und Breitengrad (in dieser Reihenfolge).',
      fr: 'Coordonnées géographiques où se trouve la fontaine, exprimées sous la forme d\'une liste contenant la longitude et la latitude (dans cet ordre).'
    },
    src_pref: ['osm', 'wikidata'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P625'],
        src_name: ['Statement', 'coodinate location'],
        extraction_info: 'The order of coordinates is reversed to match the longitude-latitude format.',
        value_translation: coordList => {
          // return coords in lng lat format !! reverse will mutate array
          return coordList[0].value.slice().reverse()
        }
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Elements',
        src_path: ['geometry', 'coordinates'],
        src_name: ['-'],
        src_info: 'Fountain coordinates in OpenStreetMap can be changed by dragging the fountain in the map editor.',
        value_translation: identity
      }
    }
  },
  water_type: {
    name:{
      en: 'water type',
      de: 'Wasserart',
      fr: 'type d\'eau'
    },
    essential: true,
    type: 'string',
    descriptions: {
      en:'Type of water that the fountain provides, for example tap water, springwater, or groundwater.',
      de: 'Art des Wassers, das der Brunnen liefert, z.B. Leitungswasser, Quellwasser oder Grundwasser.',
      fr: 'Type d\'eau que la fontaine fournit, par exemple l\'eau du robinet, l\'eau de source ou l\'eau souterraine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P5623'],
        src_name: ['Statement', 'type of water supply'],
        extraction_info: 'The Wikidata QIDs of the water quality are directly translated into keyword values.',
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
        src_path: ['properties', 'drinking_water:description'],
        src_name: ['tag', 'drinking_water:description'],
        src_info: 'This attribute can also be used for other purposes.',
        extraction_info: 'The values known to occur in OpenStreetMap are translated into keyword values.',
        value_translation: value => {
          switch (value) {
            case "Leitungswasser":
              return "tapwater";
            case "Quellwasser":
              return "springwater";
            case "eigene Versorgung":
              return "own_supply";
            case "Grundwasser":
              return "groundwater";
            default:
              return "other: " + value;
          }
        }
      }
    }
  },
  wiki_commons_name: {
    name:{
      en: 'Wikimedia Commons category',
      de: 'Wikicommons-Kategorie',
      fr: 'catégorie Wikimedia Commons'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Name of the Wikimedia Commons page of the fountain.',
      de: 'Name der Wikimedia Commons-Seite des Brunnens.',
      fr: 'Nom de la page Wikimedia Commons de la fontaine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P373'],
        src_name: ['Statement', 'Commons category'],
        src_info: 'This property can also be defined as a Sitelink, but the Statement value will be used first',
        src_path_extra: ['sitelinks', 'commonswiki'],
        extraction_info: 'Only the first value returned is used.',
        value_translation: commons => {
          return commons[0].value;
        },
        value_translation_extra: identity
      },
      osm: {
        src_path: ['properties', 'wikimedia_commons'],
        src_name: ['tag', 'wikimedia_commons'],
        value_translation: identity
      }
    }
  },
  wikipedia_en_url: {
    name:{
      en: 'Wikipedia page in English',
      de: 'Wikipediaseite auf Englisch',
      fr: 'page Wikipedia en anglais'
    },
    essential: true,
    type: 'url',
    descriptions: {
      en:'URL of the fountain Wikipedia page in English.',
      de: 'URL der Brunnen-Wikipedia-Seite auf Englisch.',
      fr: 'URL de la page de la fontaine Wikipedia en anglais.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Sitelinks',
        src_path: ['sitelinks', 'enwiki'],
        src_name: ['Wikipedia', 'en'],
        value_translation: name => {
          return `https://en.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        src_name: ['tag', 'wikipedia'],
        src_info: 'The name of the wikipedia page must be prefixed with the language locale code. Example: "fr:Jet d\'eau de Genève"',
        extraction_info: 'Only values with language locale code "en" are retained and turned into a URL.',
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
  wikipedia_de_url: {
    name:{
      en: 'Wikipedia page in German',
      de: 'Wikipediaseite auf Deutsch',
      fr: 'page Wikipedia en allemand'
    },
    essential: true,
    type: 'url',
    descriptions: {
      en:'URL of the fountain Wikipedia page in German.',
      de: 'URL der Brunnen-Wikipedia-Seite auf Deutsch.',
      fr: 'URL de la page de la fontaine Wikipedia en allemand.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Sitelinks',
        src_path: ['sitelinks', 'dewiki'],
        src_name: ['Wikipedia', 'de'],
        value_translation: name => {
          return `https://de.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        src_name: ['tag', 'wikipedia'],
        src_info: 'The name of the wikipedia page must be prefixed with the language locale code. Example: "fr:Jet d\'eau de Genève"',
        extraction_info: 'Only values with language locale code "de" are retained and turned into a URL.',
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
  wikipedia_fr_url: {
    name:{
      en: 'Wikipedia page in French',
      de: 'Wikipediaseite auf Französisch',
      fr: 'page Wikipedia en français'
    },
    essential: true,
    type: 'url',
    descriptions: {
      en:'URL of the fountain Wikipedia page in French.',
      de: 'URL der Brunnen-Wikipedia-Seite auf Französisch.',
      fr: 'URL de la page de la fontaine Wikipedia en français.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Sitelinks',
        src_path: ['sitelinks', 'frwiki'],
        src_name: ['Wikipedia', 'fr'],
        value_translation: name => {
          return `https://fr.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        src_name: ['tag', 'wikipedia'],
        src_info: 'The name of the wikipedia page must be prefixed with the language locale code. Example: "fr:Jet d\'eau de Genève"',
        extraction_info: 'Only values with language locale code "fr" are retained and turned into a URL.',
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
  operator_name: {
    name:{
      en: 'operator name',
      de: 'Betreiber-Name',
      fr: 'nom de l\'opérateur',
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Name of the operator of the fountain.',
      de: 'Name des Brunnenbetreibers.',
      fr: 'Nom de l\'opérateur de la fontaine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P137'],
        src_name: ['Statement', 'operator'],
        extraction_info: 'Only the First value returned by Wikidata is kept.',
        value_translation: vals => {return vals[0].value}
      },
      osm: {
        src_path: ['properties', 'operator'],
        src_name: ['tag', 'operator'],
        extraction_info: 'Known OpenStreetMap values are translated into "official names".',
        value_translation: value => {
          switch (value) {
            case "WVZ":
              return "Wasserversorgung Zürich";
          }
        }
      }
    }
  },
  access_pet: {
    name:{
      en: 'pet bowl',
      de: 'Hundetrog',
      fr: 'bol pour chiens'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether the fountain has a small bowl for dogs.',
      de: 'Gibt an, ob der Brunnen einen Hundetrog hat.',
      fr: 'Indique si la fontaine a un bol pour chiens.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'dog'],
        src_name: ['tag', 'dog'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  access_bottle: {
    name:{
      en: 'bottle refill',
      de: 'Flaschenfüllung',
      fr: 'remplissage de bouteille'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether a bottle can be refilled easily at the fountain.',
      de: 'Gibt an, ob eine Flasche am Brunnen leicht nachfüllbar ist.',
      fr: 'Indique si une bouteille peut être rechargée facilement à la fontaine.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'bottle'],
        src_name: ['tag', 'bottle'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  access_wheelchair: {
    name:{
      en: 'wheelchair accessible',
      de: 'Rollstuhlgerecht',
      fr: 'accès pour handicapés'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether fountain is wheelchair-friendly.',
      de: 'Gibt an, ob Brunnen rollstuhlgerecht ist.',
      fr: 'Indique si la fontaine est adaptée aux fauteuils roulants.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'wheelchair'],
        src_name: ['tag', 'wheelchair'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  potable: {
    name:{
      en: 'potable',
      de: 'trinkbar',
      fr: 'potable'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether water is potable or not.',
      de: 'Gibt an, ob Wasser trinkbar ist oder nicht.',
      fr: 'Indique si l\'eau est potable ou non.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'drinking_water'],
        src_name: ['tag', 'drinking_water'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  potable_controlled: {
    name:{
      en: 'controlled',
      de: 'kontrollierte',
      fr: 'contrôlée'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether the water is officially certified as potable.',
      de: 'Gibt an, ob die Wasserqualität von Behörden kontrolliert wird oder nicht.',
      fr: 'Indique si la qualité de l\'eau est contrôlée par les autorités ou non.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'drinking_water:legal'],
        src_name: ['tag', 'drinking_water:legal'],
        value_translation: str2bool
      },
      wikidata: null
    }
  },
  water_flow: {
    name:{
      en: 'water flow',
      de: 'Wasserfluss',
      fr: 'débit'
    },
    essential: false,
    type: 'string',
    descriptions: {
      en:'Flow rate of fountain. [example: 1.5 l/min]',
      de: 'Wasserfluss des Brunnens. [Beispiel: 1.5 l/min]',
      fr: 'Débit d\'eau de la fontaine. [exemple: 1.5 l/min]'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'flow_rate'],
        src_name: ['tag', 'flow_rate'],
        value_translation: identity
      },
      wikidata: null
    }
  },
  // add property for #132
  swimming_place: {
    name:{
      en: 'swimming place',
      de: 'Badeanlage',
      fr: 'lieu de baignade'
    },
    essential: true,
    type: 'boolean_string',
    descriptions: {
      en:'Indicates whether it is possible to swim in the fountain.',
      de: 'Gibt an, ob es möglich ist im Brunnen sich zu baden.',
      fr: 'Indique s\'il est possible de se baigner dans la fontaine.'
    },
    src_pref: ['wikidata'],
    src_config: {
      osm: null,
      wikidata: {
        src_path: ['claims', 'P31'],
        src_name: ['Statement', 'instance of'],
        src_info: 'Fountain can be marked as an instance of "swimming pool" or "swimming place".',
        extraction_info: 'Statement values are checked to see if any are "swimming pool" (Q1501) or "swimming place" (Q17456505)',
        value_translation: parents => {
          // loop through all instances to see if swimming pool or swimming place is among them
          for(let code of parents){
            // return value only if qualifier matches the operator id
            if(['Q1501', 'Q17456505'].indexOf(code.value)>=0) {
              return 'yes';
            }
          }
  
          return null;
        },
      }
    }
  },
  described_at_url: {
    name:{
      en: 'described at URL',
      de: 'wird Beschrieben in URL',
      fr: 'décrit à l\'URL'
    },
    essential: false,
    type: 'object',
    descriptions: {
      en:'Foutnain is described at the following URLs.',
      de: 'Der Brunnen wird in den angegebenen URLs beschrieben.',
      fr: 'La fontaine est décrits aux l\'URLs suivantes.'
    },
    src_pref: ['wikidata'],
    src_config: {
      osm: null,
      wikidata: {
        src_path: ['claims', 'P973'],
        src_name: ['Statement', 'described at URL'],
        extraction_info: 'All defined URLs are returned.',
        value_translation: (urls)=>{
          return _.map(urls, 'value');
        }
      }
    }
  },
  youtube_video_id: {
    name:{
      en: 'Youtube video IDs',
      de: 'YouTube-Video-Kennungen',
      fr: 'identifiants de vidéos YouTube'
    },
    essential: false,
    type: 'object',
    descriptions: {
      en:'YouTube video IDs of a video portraying the fountain',
      de: 'YouTube-Video-Kennungen',
      fr: 'identifiant vidéos YouTube'
    },
    src_pref: ['wikidata'],
    src_config: {
      osm: null,
      wikidata: {
        src_path: ['claims', 'P1651'],
        src_name: ['Statement', 'YouTube video ID'],
        extraction_info: 'All defined IDs are returned.',
        value_translation: (ids)=>{
          return _.map(ids, 'value');
        }
      }
    }
  }
};
_.forEach(fountain_properties, function (property, key) {
  property.id = key;
  property.value = null;
  property.comments = '';
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