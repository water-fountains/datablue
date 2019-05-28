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
        src_instructions: {
          en: ['Statement', 'title'],
          de: ['Aussage', 'Titel'],
          fr: ['Déclaration', 'titre']
        },
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'name'],
        src_instructions: {
          en: ['tag', 'name'],
          de: ['Attribut', 'name'],
          fr: ['Attribut', 'name']
        },
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
        src_instructions: {
          en: ['Label', 'English'],
          de: ['Bezeichnung', 'Englisch'],
          fr: ['Libellé', 'anglais']
        },
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:en'],
        src_instructions: {
          en: ['tag', 'name:en'],
          de: ['Attribut', 'name:en'],
          fr: ['Attribut', 'name:en']
        },
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
        src_instructions: {
          en: ['Label', 'German'],
          de: ['Bezeichnung', 'Deutsch'],
          fr: ['Libellé', 'allemand']
        },
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:de'],
        src_instructions: {
          en: ['tag', 'name:de'],
          de: ['Attribut', 'name:de'],
          fr: ['Attribut', 'name:de']
        },
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
        src_instructions: {
          en: ['Label', 'French'],
          de: ['Bezeichnung', 'Französisch'],
          fr: ['Libellé', 'français']
        },
        value_translation: identity
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Multilingual_names',
        src_path: ['properties', 'name:fr'],
        src_instructions: {
          en: ['tag', 'name:fr'],
          de: ['Attribut', 'name:fr'],
          fr: ['Attribut', 'name:fr']
        },
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
        src_instructions: {
          en: ['tag', 'description:en'],
          de: ['Attribut', 'description:en'],
          fr: ['Attribut', 'description:en']
        },
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'en'],
        src_instructions: {
          en: ['Description', 'English'],
          de: ['Beschreibung', 'Englisch'],
          fr: ['Description', 'anglais']
        },
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
        src_instructions: {
          en: ['tag', 'description:de'],
          de: ['Attribut', 'description:de'],
          fr: ['Attribut', 'description:de']
        },
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'de'],
        src_instructions: {
          en: ['Description', 'German'],
          de: ['Beschreibung', 'Deutsch'],
          fr: ['Description', 'allemand']
        },
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
        src_instructions: {
          en: ['tag', 'description:fr'],
          de: ['Attribut', 'description:fr'],
          fr: ['Attribut', 'description:fr']
        },
        value_translation: identity
      },
      wikidata: {
        help: 'https://www.wikidata.org/wiki/Help:Description',
        src_path: ['descriptions', 'fr'],
        src_instructions: {
          en: ['Description', 'French'],
          de: ['Beschreibung', 'Französisch'],
          fr: ['Description', 'français']
        },
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
        src_instructions: {
          en: ['-'],
          de: ['-'],
          fr: ['-']
        },
        src_info: {
          en:'OpenStreetMap identifier cannot be easily modified in online editor',
          de: 'OpenStreetMap Identifikator kann nicht einfach im Online Editor geändert werden.',
          fr: 'L\'identifiant OpenStreetMap ne peut pas être facilement modifié dans l\'éditeur en ligne'
        },
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
        src_instructions: {
          en: ['Statement', 'catalog code'],
          de: ['Aussage', 'Katalognummer'],
          fr: ['Déclaration', 'numéro de catalogue']
        },
        src_info: {
          en:`The catalog code must have a 'catalog' qualifier referring to the catalog documented in the location metadata. (${_.map(locations, (l,name)=>{return `${l.name}: ${l.operator_qid}`}).join(', ')})`,
          de: `Der Katalogcode muss einen 'Katalog'-Qualifizierer haben, der sich auf den in den Standortmetadaten dokumentierten Katalog bezieht. (${_.map(locations, (l,name)=>{return `${l.name}: ${l.operator_qid}`}).join(', ')})`,
          fr: `Le code de catalogue doit avoir un qualificatif \'catalogue\' faisant référence au catalogue documenté dans les métadonnées de localisation. (${_.map(locations, (l,name)=> {return `${l.name} : ${l.operator_qid}`}).join(', ')})`
          },
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
        src_instructions: {
          en: ['tag', 'ref'],
          de: ['Attribut', 'ref'],
          fr: ['Attribut', 'ref']
        },
        src_info: {
          en:'This tag could also be used for other purposes. We therefore recommend using Wikidata to store this information.',
          de: 'Dieser Tag kann auch für andere Zwecke verwendet werden. Wir empfehlen daher, diese Informationen in Wikidata zu speichern.',
          fr: 'Cette balise peut également être utilisée à d\'autres fins. Nous vous recommandons donc d\'utiliser Wikidata pour stocker ces informations.'
        },
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
        src_instructions: {
          en: ['-'],
          de: ['-'],
          fr: ['-']
        },
        src_info: {
          en:'The Wikidata identifier cannot be modified. It uniquely identifies a Wikidata entity.',
          de: 'Der Wikidata-Identifikator kann nicht geändert werden. Es identifiziert eine Wikidata-Entität eindeutig.',
          fr: 'L\'identifiant Wikidata ne peut pas être modifié. Il identifie de manière unique une entité Wikidata.'
        },
        value_translation: identity
      },
      osm: {
        src_path: ['properties', 'wikidata'],
        src_instructions: {
          en: ['tag', 'wikidata'],
          de: ['Attribut', 'wikidata'],
          fr: ['Attribut', 'wikidata']
        },
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
      en:'Year the fountain was constructed.',
      de: 'Baujahr des Brunnens.',
      fr: 'Année de construction de la fontaine.'
    },
    src_pref: ['wikidata', 'osm'],
    src_config: {
      wikidata: {
        src_path: ['claims', 'P571'],
        src_instructions: {
          en: ['Statement', 'inception'],
          de: ['Aussage', 'Gründung, Erstellung bzw. Entstehung'],
          fr: ['Déclaration', 'date de fondation ou de création']
        },
        extraction_info: {
          en: 'Only the first value returned by wikidata is kept.',
          de: 'Nur der erste Wert, der von Wikidata zurückgegeben wird, bleibt erhalten.',
          fr: 'Seule la première valeur retournée par wikidata est conservée.'
        },
        value_translation: values => {
          //just keep the first date
          return parseInt(values[0].value.substring(0, 4));
        }
      },
      osm: {
        src_path: ['properties', 'start_date'],
        src_instructions: {
          en: ['tag', 'start_date'],
          de: ['Attribut', 'start_date'],
          fr: ['Attribut', 'start_date']
        },
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
        src_instructions: {
          en: ['Statement', 'creator'],
          de: ['Aussage', 'Urheber'],
          fr: ['Déclaration', 'créateur']
        },
        extraction_info: {
          en: 'Only the first value returned by Wikidata is kept. If the QID corresponds to that of "anonymous" (Q4233718), it returns null.',
          de: 'Nur der erste Wert, der von Wikidata zurückgegeben wird, bleibt erhalten. Wenn die QID der von "Anonymus" (Q4233718) entspricht, ist der Wert "null".',
          fr: 'Seule la première valeur retournée par Wikidata est conservée. Si le QID correspond à celui de "anonyme" (Q4233718), la valeur retournée est "null".'
        },
        value_translation: values => {
          //just return the first value that is not anonymous.
          for (let value of values){
            if(value.value !== 'Q4233718'){
              return value.value;
            }
          }
          // fix for https://github.com/water-fountains/proximap/issues/129
          return null;
          
        }
      },
      osm: {
        src_path: ['properties', 'artist_name'],
        src_instructions: {
          en: ['tag', 'artist_name'],
          de: ['Attribut', 'artist_name'],
          fr: ['Attribut', 'artist_name']
        },
        extraction_info: {
          en: 'Only the first value is kept.',
          de: 'Nur der erste Wert, der zurückgegeben wird, bleibt erhalten.',
          fr: 'Seule la première valeur retournée est conservée.'
        },
        value_translation: text=>{
          return text.split(';')[0]
        }
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
      en:'Times of the year during which the fountain is running.',
      de: 'Zeiten des Jahres, in denen der Brunnen läuft.',
      fr: 'Périodes de l\'année durant lesquelles la fontaine fonctionne.'
    },
    src_pref: ['osm'],
    src_config: {
      osm: {
        src_path: ['properties', 'opening_hours'],
        src_instructions: {
          en: ['tag', 'opening_hours'],
          de: ['Attribut', 'opening_hours'],
          fr: ['Attribut', 'opening_hours']
        },
        src_info: {
          en: 'Date range must be in English. Example: "March-November"',
          de: 'Muss auf Englisch sein. Beispiel: "March-November"',
          fr: 'Doit être en anglais. Exemple: "March-November"'
        },
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
        src_instructions: {
          en: ['tag', 'level'],
          de: ['Attribut', 'level'],
          fr: ['Attribut', 'level']
        },
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
        src_instructions: {
          en: ['tag', 'fixme'],
          de: ['Attribut', 'fixme'],
          fr: ['Attribut', 'fixme']
        },
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
        src_instructions: {
          en: ['Statement', 'directions'],
          de: ['Aussage', 'Wegbeschreibung'],
          fr: ['Déclaration', 'instructions pour s\'y rendre']
        },
        extraction_info: {
          en:'Only first value returned by Wikidata is kept.',
          de: 'Nur der erste Wert, der von Wikidata zurückgegeben wird, bleibt erhalten.',
          fr: 'Seule la première valeur retournée par Wikidata est conservée.'
        },
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
        src_instructions: {
          en: ['Statement', 'ground level 360 degree view'],
          de: ['Aussage', 'Bodennahe 360-Grad-Ansicht'],
          fr: ['Déclaration', 'vue à 360 degrés depuis le sol']
        },
        extraction_info: {
          en: 'The source of the imagery is determined automatically on the basis of the url.',
          de: 'Die Quelle der Bilder wird automatisch anhand der URL ermittelt.',
          fr: 'La source de l\'imagerie est déterminée automatiquement sur la base de l\'url.'
        },
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
      osm: {
        src_info: {
          en: 'Value is only taken if it contains "File:".',
          de: 'Wert wird nur genommen wenn es "File:" beinhaltet.',
          fr: 'La valeur est seulement acceptée si elle contient "File:" pour indiquer qu\'il s\'agit d\'un fichier.'
        },
        src_path: ['properties', 'wikimedia_commons'],
        src_instructions: {
          en: ['tag', 'wikimedia_commons'],
          de: ['Attribut', 'wikimedia_commons'],
          fr: ['Attribut', 'wikimedia_commons']
        },
        value_translation: text=>{
          if(text.includes('File:')){
            return text.replace('File:', '')
          }else{
            return null;
          }}
      },
      wikidata: {
        src_path: ['claims', 'P18'],
        src_instructions: {
          en: ['Statement', 'image'],
          de: ['Aussage', 'Bild'],
          fr: ['Déclaration', 'image']
        },
        extraction_info: {
          en: 'Only the first value returned by Wikidata is kept.',
          de: 'Nur der erste Wert, der von Wikidata zurückgegeben wird, bleibt erhalten.',
          fr: 'Seule la première valeur retournée par Wikidata est conservée.'
        },
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
        src_instructions: {
          en: ['Statement', 'coodinate location'],
          de: ['Aussage', 'geographische Koordinaten'],
          fr: ['Déclaration', 'coordonnées géographiques']
        },
        src_info: {
          en:'Geographical coordinates are to be expressed as an array of longitude and latitude (in that order).',
          de: 'Geographische Koordinaten müssen eingetragen werden als eine Liste von Längen- und Breitengrad (in dieser Reihenfolge).',
          fr: 'Les coordonnées géographiques doivent être exprimées sous la forme d\'une liste contenant la longitude et la latitude (dans cet ordre).'
        },
        extraction_info: {
          en: 'The order of coordinates is reversed to match the longitude-latitude format.',
          de: 'Die Reihenfolge der Koordinaten wird umgekehrt, um dem Längen- und Breitenformat zu entsprechen.',
          fr: 'L\'ordre des coordonnées est inversé pour correspondre au format longitude-latitude.'
        },
        value_translation: coordList => {
          // return coords in lng lat format !! reverse will mutate array
          try{
            // for #212, sometimes no coords exist
            return coordList[0].value.slice().reverse();
          }catch (e) {
            return null;
          }
        }
      },
      osm: {
        help: 'https://wiki.openstreetmap.org/wiki/Elements',
        src_path: ['geometry', 'coordinates'],
        src_instructions: {
          en: ['-'],
          de: ['-'],
          fr: ['-']
        },
        src_info: {
          en:'Fountain coordinates in OpenStreetMap can be changed by dragging the fountain in the map editor.',
          de: 'Die Fontänenkoordinaten in OpenStreetMap können durch Ziehen des Brunnens im Karteneditor geändert werden.',
          fr: 'Les coordonnées de la fontaine dans OpenStreetMap peuvent être modifiées en faisant glisser la fontaine dans l\'éditeur de carte.'
        },
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
        src_instructions: {
          en: ['Statement', 'type of water supply'],
          de: ['Aussage', 'Art der Wasserversorgung'],
          fr: ['Déclaration', 'type d\'alimentation en eau']
        },
        extraction_info: {
          en: 'The Wikidata QIDs of the water quality are directly translated into keyword values.',
          de: 'Die Wikidata-QIDs der Wasserqualität werden direkt in Keyword-Werte übersetzt.',
          fr: 'Les QID Wikidata de la qualité de l\'eau sont directement traduits en valeurs de mots-clés.'
        },
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
              return vals[0].value;
          }
        }
      },
      osm: {
        src_path: ['properties', 'drinking_water:description'],
        src_instructions: {
          en: ['tag', 'drinking_water:description'],
          de: ['Attribut', 'drinking_water:description'],
          fr: ['Attribut', 'drinking_water:description']
        },
        src_info: {
          en:'This attribute can also be used for other purposes.',
          de: 'Dieses Attribut kann auch für andere Zwecke verwendet werden.',
          fr: 'Cet attribut peut également être utilisé à d\'autres fins.'
        },
        extraction_info: {
          en: 'The values known to occur in OpenStreetMap are translated into keyword values.',
          de: 'Die in OpenStreetMap bekannten Werte werden in Schlüsselwortwerte umgewandelt.',
          fr: 'Les valeurs connues dans OpenStreetMap sont traduites en valeurs de mots-clés.'
        },
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
              return value;
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
        src_instructions: {
          en: ['Statement', 'Commons category'],
          de: ['Aussage', 'Commons-Kategorie'],
          fr: ['Déclaration', 'catégorie Commons']
        },
        src_info: {
          en:'This property can also be defined as a Sitelink, but the Statement value will be used first',
          de: 'Diese Eigenschaft kann auch als Interwiki-Link definiert werden, aber der Statement Wert wird zuerst verwendet.',
          fr: 'Cette propriété peut aussi être définie comme un Liens de site, mais la valeur du Statement sera utilisée en premier.'
        },
        src_path_extra: ['sitelinks', 'commonswiki'],
        extraction_info: {
          en: 'Only the first value returned is used.',
          de: 'Es wird nur der erste zurückgegebene Wert verwendet.',
          fr: 'Seule la première valeur retournée est utilisée.'
        },
        value_translation: commons => {
          return commons[0].value;
        },
        value_translation_extra: text=>{
          return text.replace('Category:', '')
        }
      },
      osm: {
        src_info: {
          en: 'Value is only taken if it contains "Category:".',
          de: 'Wert wird nur genommen wenn es "Category:" beinhaltet.',
          fr: 'La valeur est seulement acceptée si elle contient "Category:" pour indiquer qu\'il s\'agit d\'une catégorie.'
        },
        src_path: ['properties', 'wikimedia_commons'],
        src_instructions: {
          en: ['tag', 'wikimedia_commons'],
          de: ['Attribut', 'wikimedia_commons'],
          fr: ['Attribut', 'wikimedia_commons']
        },
        value_translation: text=>{
          if(text.includes('Category:')){
            return text.replace('Category:', '')
          }else{
            return null;
          }}
        }
    }
  },
  wikipedia_en_url: {
    name:{
      en: 'Wikipedia page in English',
      de: 'Wikipediaseite auf Englisch',
      fr: 'page Wikipédia en anglais'
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
        src_instructions: {
          en: ['Wikipedia', 'en'],
          de: ['Wikipedia', 'en'],
          fr: ['Wikipédia', 'en']
        },
        value_translation: name => {
          return `https://en.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        src_instructions: {
          en: ['tag', 'wikipedia'],
          de: ['Attribut', 'wikipedia'],
          fr: ['Attribut', 'wikipedia']
        },
        src_info: {
          en:'The name of the wikipedia page must be prefixed with the language locale code. Example: "fr:Jet d\'eau de Genève"',
          de: 'Der Name der Wikipedia-Seite muss mit dem Sprachumgebungscode vorangestellt werden. Beispiel: " fr:Jet d\'eau de Genève"',
          fr: 'Le nom de la page wikipedia doit être préfixé avec le code de la langue locale. Exemple : "fr:Jet d\'eau de Genève"'
        },
        extraction_info: {
          en: 'Only values with language locale code "en" are retained and turned into a URL.',
          de: 'Nur Werte mit dem Sprachumgebungscode "en" werden beibehalten und in eine URL umgewandelt.',
          fr: 'Seules les valeurs avec le code local de langue "fr" sont conservées et transformées en URL.'
        },
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
      fr: 'page Wikipédia en allemand'
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
        src_instructions: {
          en: ['Wikipedia', 'de'],
          de: ['Wikipedia', 'de'],
          fr: ['Wikipédia', 'de']
        },
        value_translation: name => {
          return `https://de.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        src_instructions: {
          en: ['tag', 'wikipedia'],
          de: ['Attribut', 'wikipedia'],
          fr: ['Attribut', 'wikipedia']
        },
        src_info: {
          en:'The name of the wikipedia page must be prefixed with the language locale code. Example: "fr:Jet d\'eau de Genève"',
          de: 'Der Name der Wikipedia-Seite muss mit dem Sprachumgebungscode vorangestellt werden. Beispiel: " fr:Jet d\'eau de Genève"',
          fr: 'Le nom de la page wikipedia doit être préfixé avec le code de la langue locale. Exemple : "fr:Jet d\'eau de Genève"'
        },
        extraction_info: {
          en: 'Only values with language locale code "de" are retained and turned into a URL.',
          de: 'Nur Werte mit dem Sprachumgebungscode "de" werden beibehalten und in eine URL umgewandelt.',
          fr: 'Seules les valeurs avec le code local de langue "de" sont conservées et transformées en URL.'
        },
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
      fr: 'page Wikipédia en français'
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
        src_instructions: {
          en: ['Wikipedia', 'fr'],
          de: ['Wikipedia', 'fr'],
          fr: ['Wikipédia', 'fr']
        },
        value_translation: name => {
          return `https://fr.wikipedia.org/wiki/${name}`
        }
      },
      osm: {
        src_path: ['properties', 'wikipedia'],
        src_instructions: {
          en: ['tag', 'wikipedia'],
          de: ['Attribut', 'wikipedia'],
          fr: ['Attribut', 'wikipedia']
        },
        src_info: {
          en:'The name of the wikipedia page must be prefixed with the language locale code. Example: "fr:Jet d\'eau de Genève"',
          de: 'Der Name der Wikipedia-Seite muss mit dem Sprachumgebungscode vorangestellt werden. Beispiel: " fr:Jet d\'eau de Genève"',
          fr: 'Le nom de la page wikipedia doit être préfixé avec le code de la langue locale. Exemple : "fr:Jet d\'eau de Genève"'
        },
        extraction_info: {
          en: 'Only values with language locale code "fr" are retained and turned into a URL.',
          de: 'Nur Werte mit dem Sprachumgebungscode "fr" werden beibehalten und in eine URL umgewandelt.',
          fr: 'Seules les valeurs avec le code local de langue "fr" sont conservées et transformées en URL.'
        },
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
        src_instructions: {
          en: ['Statement', 'operator'],
          de: ['Aussage', 'Betreiber'],
          fr: ['Déclaration', 'opérateur']
        },
        extraction_info: {
          en: 'Only the First value returned by Wikidata is kept.',
          de: 'Nur der von Wikidata zurückgegebene Wert First wird beibehalten.',
          fr: 'Seule la première valeur retournée par Wikidata est conservée.'
        },
        value_translation: vals => {return vals[0].value}
      },
      osm: {
        src_path: ['properties', 'operator'],
        src_instructions: {
          en: ['tag', 'operator'],
          de: ['Attribut', 'operator'],
          fr: ['Attribut', 'operator']
        },
        extraction_info: {
          en: 'Known OpenStreetMap values are translated into "official names".',
          de: 'Bekannte OpenStreetMap-Werte werden in "offizielle Namen" übersetzt.',
          fr: 'Les valeurs connues d\'OpenStreetMap sont traduites en "noms officiels".'
        },
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
        src_instructions: {
          en: ['tag', 'dog'],
          de: ['Attribut', 'dog'],
          fr: ['Attribut', 'dog']
        },
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
        src_instructions: {
          en: ['tag', 'bottle'],
          de: ['Attribut', 'bottle'],
          fr: ['Attribut', 'bottle']
        },
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
        src_instructions: {
          en: ['tag', 'wheelchair'],
          de: ['Attribut', 'wheelchair'],
          fr: ['Attribut', 'wheelchair']
        },
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
        src_instructions: {
          en: ['tag', 'drinking_water'],
          de: ['Attribut', 'drinking_water'],
          fr: ['Attribut', 'drinking_water']
        },
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
        src_instructions: {
          en: ['tag', 'drinking_water:legal'],
          de: ['Attribut', 'drinking_water:legal'],
          fr: ['Attribut', 'drinking_water:legal']
        },
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
        src_instructions: {
          en: ['tag', 'flow_rate'],
          de: ['Attribut', 'flow_rate'],
          fr: ['Attribut', 'flow_rate']
        },
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
        src_instructions: {
          en: ['Statement', 'instance of'],
          de: ['Aussage', 'ist ein(e)'],
          fr: ['Déclaration', 'nature de l\'élément']
        },
        src_info: {
          en:'Fountain can be marked as an instance of "swimming pool" or "swimming place".',
          de: 'Der Brunnen kann als einen "Schwimmbecken" oder eine "Badeanlage" markiert werden.',
          fr: 'La fontaine peut être marquée comme étant une "piscine" ou un de "lieu de baignade".'
        },
        extraction_info: {
          en: 'Statement values are checked to see if any are "swimming pool" (Q1501) or "swimming place" (Q17456505)',
          de: 'Die Aussagewerte werden überprüft, um festzustellen, ob es sich um "Schwimmbecken" (Q1501) oder "Badeanlage" (Q17456505) handelt.',
          fr: 'Les valeurs des relevés sont vérifiées pour voir s\'il s\'agit de "piscine" (Q1501) ou de "lieu de baignade" (Q17456505).'
        },
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
        src_instructions: {
          en: ['Statement', 'described at URL'],
          de: ['Aussage', 'wird beschrieben in URL'],
          fr: ['Déclaration', 'décrit à l\'URL']
        },
        extraction_info: {
          en: 'All defined URLs are returned.',
          de: 'Alle definierten URLs werden zurückgegeben.',
          fr: 'Toutes les URL définies sont retournées.'
        },
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
        src_instructions: {
          en: ['Statement', 'YouTube video ID'],
          de: ['Aussage', 'YouTube-Video-Kennung'],
          fr: ['Déclaration', 'identifiant de la vidéo YouTube']
        },
        extraction_info: {
          en: 'All defined IDs are returned.',
          de: 'Alle definierten IDs werden zurückgegeben.',
          fr: 'Tous les ID définis sont retournés.'
        },
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