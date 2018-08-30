import {locations} from "./locations";

const wikidata_fountain_config = {
    "sub_sources":[],
  "claims": {
      val_in_array: true,
      val_is_obj: true,
      props: [
      {
        "src_p_name": "P571",
        "dst_p_name": "construction_date",
        "rank": 1,
        "value_translation": vals=>{
          //just keep the first date
          return parseInt(vals[0].value.substring(0,4));
        }
    },{
      "src_p_name": "P1476",
      "dst_p_name": "name",
      "rank": 1
    },{
      "src_p_name": "P137",
      "dst_p_name": "operator_name",
      "value_translation": vals=>{switch(vals[0].value){
        case "Q27229237": return "Wasserversorgung Zürich";
      }},
      "rank": 1
    },{
      "src_p_name": "P5623",
      "dst_p_name": "water_type",
      "value_translation": vals=>{switch(vals[0].value){
        case "Q53633635": return "tapwater";
        case "Q1881858": return "springwater";
        case "Q53634173": return "own_supply";
        case "Q161598": return "groundwater";
      }},
      "rank": 1
    },{
      "src_p_name": "P2795",
      "dst_p_name": "directions",
      "rank": 2
    },{
      "src_p_name": "P5282",
      "dst_p_name": "pano_url",
      "rank": 1
    },{
      "src_p_name": "P18",
      "dst_p_name": "featured_image_name",
      "rank": 1
    },{
      "src_p_name": "P625",
      "dst_p_name": "coords",
      "rank": 2,
      "value_translation": coordList=>{
        // return coords in lng lat format
        return [coordList[0].value[1], coordList[0].value[0]]
      }
    },{
      "src_p_name": "P528",
      "dst_p_name": "id_operator",
      "rank": 1,
      "value_translation": catCodes=>{
        let catCode = null;
        // loop through all catalog codes to find the right one
        catCodes.forEach(code=>{
          // return value only if qualifier matches the operator id
          if(code.qualifiers['P972'][0] === locations.zurich.operator_qid){
            catCode = code.value
          }
        });
        return catCode;
        
      }
    },{
      "src_p_name": "P373",
      "dst_p_name": "wiki_commons_name",
      "rank": 1,
      "value_translation": names=>{
        return `Category:${names[0].value}`;
      }
    }
  ]},
  "labels":{
      val_in_array: false,
    val_is_obj: false,
    props: [
      {
        src_p_name: "en",
        dst_p_name: "name_en",
        rank: 2,
      },{
        src_p_name: "fr",
        dst_p_name: "name_fr",
        rank: 2,
      },{
        src_p_name: "de",
        dst_p_name: "name_de",
        rank: 2,
      },
    ]
  },
  "sitelinks":{
    val_in_array: false,
    val_is_obj: false,
    "props": [
      {
        "src_p_name": "commonswiki",
        "dst_p_name": "wiki_commons_name",
        "rank": 1
      },
      {
        "src_p_name": "enwiki",
        "dst_p_name": "wikipedia_en_url",
        "rank": 1,
        "value_translation": name=>{
          return `https://en.wikipedia.org/wiki/${name}`
        }
      },
      {
        "src_p_name": "dewiki",
        "dst_p_name": "wikipedia_de_url",
        "rank": 1,
        "value_translation": name=>{
          return `https://de.wikipedia.org/wiki/${name}`
        }
      }
    ]}
  };

export default wikidata_fountain_config;