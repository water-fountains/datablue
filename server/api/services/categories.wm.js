/*
 * @license
 * (c) Copyright 2020 | MY-D Foundation | Created by Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */
 
import l from '../../common/logger';

const blackListed = new Set();
blackListed.add('drinking fountains');
blackListed.add('fountains');
blackListed.add('media with locations');

const blackLiRe = [];
blackLiRe.push(/20\d\d in zürich/);  //too broad
blackLiRe.push(/.*20\d\d in switzerland/);  //too broad
blackLiRe.push(/.*fountains in .+/); //normally too broad
blackLiRe.push(/.*shops in .+/); //Q27230037
blackLiRe.push(/.*houses in .+/);  //Q27230037
blackLiRe.push(/.*windows in .+/); //Q27230037
blackLiRe.push(/.*photographs taken on .+/); //Q27230037
blackLiRe.push(/.*photographs by .+/); //Q27230037
blackLiRe.push(/.*twilights of .+/); //Q27230037
blackLiRe.push(/.+significance in .+/); //Q27230047
blackLiRe.push(/.+loves monuments.*/); //Q27230047
blackLiRe.push(/.+template.+/); //Q27230047
blackLiRe.push(/.*statues in .+/); //Q27230047
blackLiRe.push(/.*taken with .+/); //Q27230047
blackLiRe.push(/.*corrected with .+/); //Q27229660
blackLiRe.push(/.*monuments.+in .+/); //Q27230037
blackLiRe.push(/.*pictures by .+/); //Q27229901
blackLiRe.push(/.*attribution.*/); //Q27229901
blackLiRe.push(/.*upload bot.*/); //Q27230038
blackLiRe.push(/.*with annotations.*/); //Q27132067
blackLiRe.push(/.*flowers in .+/);  //Q27132067
blackLiRe.push(/.*ornamental.+in .+/);  //Q27132067
blackLiRe.push(/.*shop signs in .+/);  //Q27132067
blackLiRe.push(/pd old/);  //Q27132067
blackLiRe.push(/cc-pd-mark/);  //Q27132067
blackLiRe.push(/.*built in .+ in .+/);  //Q55166175
blackLiRe.push(/.*selected for .+/);  //Q55167899



export function isBlackListed(catName) {
  if (null == catName) {
     return true;
  }
  const categoT = catName.trim();
  if (0 < categoT.length) {
    const categoTlc = categoT.toLowerCase();
    if (-1 == categoTlc.indexOf('needing')) {
      if (-1 == categoTlc.indexOf('self-published work')) {
        if (-1 == categoTlc.indexOf('pages with')) {
          if (blackListed.has(categoTlc)) {
             if(process.env.NODE_ENV !== 'production') {
                l.info('categories.wm.js isBlackListed: category "'+catName+'" '+new Date().toISOString());                
             }
             return true;
          }
          for(let i=0;i<blackLiRe.length;i++){
              const blaLiRe = blackLiRe[i];
              if (blaLiRe.test(categoTlc)) {
                 if (process.env.NODE_ENV !== 'production') {
                   l.info('categories.wm.js isBlackListed: regex category "'+catName+'" '+new Date().toISOString());                
                 }
                 return true;
              }
          }
          return false;
        }
      }
    }
    if(process.env.NODE_ENV !== 'production') {
       l.info('categories.wm.js isBlackListed: category "'+catName+'" '+new Date().toISOString());                
    }
  }
  return true;
}