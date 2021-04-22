/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import * as _  from 'lodash'
import axios from "axios"
import l from '../../common/logger';

const summaryUrlSnippet = "/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=";

class WikipediaService {
  
    getSummary(wikipediaUrl: string, dbg: string) : Promise<string> {
      return new Promise((resolve) =>{
      // fetches summary text from Wikipedia
      // fetch all images in category
      let url = encodeURI(wikipediaUrl.replace('/wiki/', summaryUrlSnippet));
      
      axios.get(url)
        .then(r => {
          let data = r.data.query.pages;
          let summary = data[Object.keys(data)[0]].extract;
          
          resolve(summary);
        })
        .catch(function (error) {
          l.error(`Error fetching Wikipedia summary: ${error} (url: ${url}) `+dbg);
          resolve('Error fetching Wikipedia summary');
        })
      });
    }
  
}

export default new WikipediaService();