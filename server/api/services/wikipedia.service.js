const utf8 = require('utf8');
const _ = require ('lodash');
const axios = require ('axios');
const https = require('https');
const md5 = require('js-md5');
import l from '../../common/logger';
import {PROP_STATUS_OK, PROP_STATUS_WARNING} from "../../common/constants";

const summaryUrlSnippet = "/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=";

class WikipediaService {
  
    getSummary(wikipediaUrl) {
      return new Promise((resolve, reject) =>{
      // fetches summary text from Wikipedia
      // fetch all images in category
      let url = wikipediaUrl.replace('/wiki/', summaryUrlSnippet);
      
      axios.get(url)
        .then(r => {
          let data = r.data.query.pages;
          let summary = data[Object.keys(data)[0]].extract;
          
          resolve(summary);
        })
        .catch(function (error) {
          reject(error);
        })
      });
    }
  
}

export default new WikipediaService();