const osm_fountain_config = {
    "sub_sources":[
      {
        "tag": {
          "name": "man_made",
          "value": "drinking_fountain"
        },
        "implies":
        [
          {
            "key": "drinking_water",
            "value": "yes"
          }
        ]
      },{
        "tag": {
          "name": "amenity",
          "value": "drinking_water"
        },
        "implies":
          [
            {
              "key": "drinking_water",
              "value": "yes"
            }
          ]
      },{
        "tag": {
          "name": "amenity",
          "value": "water_point"
        },
        "implies":
          [
            {
              "key": "drinking_water",
              "value": "yes"
            },
            {
              "key": "bottle",
              "value": "yes"
            },
          ]
      },{
        "tag": {
          "name": "man_made",
          "value": "water_tap"
        },
        "implies":[
          {
            "key": "bottle",
            "value": "yes"
          },
        ]
      },{
        "tag": {
          "name": "natural",
          "value": "spring"
        },
        "implies": []
      },{
        "tag": {
          "name": "amenity",
          "value": "watering_place"
        },
        "implies":[
          {
            "key": "bottle",
            "value": "yes"
          },
          {
            "key": "access_horse",
            "value": "yes"
          }
        ]
      },{
        "tag": {
          "name": "amenity",
          "value": "fountain"
        },
        "implies": []
      },{
        "tag": {
          "name": "man_made",
          "value": "water_well"
        },
        "implies": []
      }
    ],
  "keys": [
    {
      "key": "name",
      "property": "name",
      "rank": 2
    },{
      "key": "description",
      "property": "short_description",
      "rank": 2
    },{
      "key": "drinking_water",
      "property": "potable",
      "value_translation": {
        "yes": true,
        "no": false
      },
      "rank": 1
    },{
      "key": "drinking_water:legal",
      "property": "potable_controlled",
      "value_translation": {
        "yes": true,
        "no": false
      },
      "rank": 1
    },{
      "key": "drinking_water:description",
      "property": "water_type",
      "value_translation": {
        "Quellwasser": "springwater",
        "Leitungswasser": "tapwater"
      },
      "rank": 2
    },{
      "key": "operator",
      "property": "operator_name",
      "rank": 2
    },{
      "key": "bottle",
      "property": "access_bottle",
      "value_translation": {
        "yes": true,
        "no": false
      },
      "rank": 1
    },{
      "key": "dog",
      "property": "access_pet",
      "value_translation": {
        "yes": true,
        "no": false
      },
      "rank": 1
    },{
      "key": "wheelchair",
      "property": "access_wheelchair",
      "value_translation": {
        "yes": true,
        "no": false
      },
      "rank": 1
    },{
      "key": "ref",
      "property": "id_operator",
      "rank": 2
    },{
      "key": "wikidata",
      "property": "id_wikidata",
      "rank": 2
    },{
      "key": "artist_name",
      "property": "artists",
      "separable": {
        "separator": ";",
        "map_to_subproperty": "name"
      },
      "rank": 2
    },{
      "key": "id",
      "property": "id_osm",
      "rank": 1
    },{
      "key": "lat",
      "property": "latitude",
      "rank": 1
    },{
      "key": "lon",
      "property": "longitude",
      "rank": 1
    },{
      "key": "start_date",
      "property": "construction_date",
      "rank": 2
    },{
      "key": "opening_hours",
      "property": "availability",
      "rank": 1
    },{
      "key": "level",
      "property": "floor_level",
      "rank": 1
    },{
      "key": "fixme",
      "property": "fixme",
      "rank": 1
    },
  ]
  };

export default osm_fountain_config;