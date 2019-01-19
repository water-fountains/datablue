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
    ]
  };

export default osm_fountain_config;