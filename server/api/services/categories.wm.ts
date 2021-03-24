/*
 * @license
 * (c) Copyright 2020 | MY-D Foundation | Created by Ralf Hauser
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */
 
import l from '../../common/logger';

const blacklist = new Set<string>([
  'drinking fountains',
  'fountains',
  'media with locations',
  'gfdl', // Q3076151 fr-paris fontaine de Mars
])


const blacklistRegExp: RegExp[] = [
  /.*needing.*/,
  /.*self-published work.*/,
  /.*pages with.*/,
  /.*rights\s+warning.*/, // Q55170988
  /.*springbrunnen\s+zürich.*/, // Q55170988
  /.*piers\s+of\s+.+/, // Q55170988
  /.*rainbows\s+in\s+.+/, // Q55170988
  /20\d\d in zürich/,  //too broad
  /.*20\d\d in switzerland/,  //too broad
  /.*20\d\d .+ photographs.*/,  //too broad Q27229873
  /.*20\d\d\s+in\s+the\s+.+\s+of\s+.+/,  //too broad "canton of Zürich Q27230037 
  /.*fountains\s+in\s+.+/, //normally too broad \w+ instead of just for ' ' for Q98494680 
  /.*shops in .+/, //Q27230037
  /.*houses in .+/,  //Q27230037
  /.*windows in .+/, //Q27230037
  /.*photographs taken on .+/, //Q27230037
  /.*photographs by .+/, //Q27230037
  /.*twilights of .+/, //Q27230037
  /.+significance in .+/, //Q27230047
  /.+loves monuments.*/, //Q27230047
  /.+template.+/, //Q27230047
  /.*statues in .+/, //Q27230047
  /.*taken with .+/, //Q27230047
  /.*corrected with .+/, //Q27229660
  /.*monuments.+in .+/, //Q27230037
  /.*pictures by .+/, //Q27229901
  /.*attribution.*/, //Q27229901
  /.*upload bot.*/, //Q27230038
  /.*with annotations.*/, //Q27132067
  /.*flowers in .+/,  //Q27132067
  /.*ornamental.+in .+/,  //Q27132067
  /.*shop signs in .+/,  //Q27132067
  /pd old/,  //Q27132067
  /cc-pd-mark/,  //Q27132067
  /.*built in .+ in .+/,  //Q55166175
  /.*selected for .+/,  //Q55167899
  /.*images reviewed by .+/,  //Q1759793  "Flickr images reviewed by FlickreviewR"
  /.*files uploaded.+/,  //Q1759793  "Files uploaded from Flickr by Jacopo Werther via Bot"
  /.*from .+ via bot.*/,  //Q1759793  "Files uploaded from Flickr by Jacopo Werther via Bot"
  /.*uploaded via campaign.*/,  //Q27229664  "Uploaded via Campaign:wlm-ch"
  /.*license migration.*/, // Q3076151 fr-paris fontaine de Mars
  /.*mérimée with.*/, // Q3076151 fr-paris fontaine de Mars - "maintenance" is another one
  /.*base mérimée.*/, // Q3076151 fr-paris fontaine de Mars
  /.*uploaded with commonist.*/, //Q29684816 ch-bs Pisoni
  /.*fop-switzerland.*/, //Q29684816 ch-bs Pisoni    FoP-Switzerland
  /.*user:.+\/.*/, //Q29684816 ch-bs Pisoni   https://commons.wikimedia.org/wiki/Category:User:Mattes/Contributions/Topics/Buildings_and_structures
  /.*work by .+\d{4}.*/, //Q29684816 ch-bs Pisoni   https://commons.wikimedia.org/wiki/Category:Work_by_Mattes_2012
  /.*items with .+ permission.*/, //Q683514 ch-bs Fasnachtsbrunnen   https://commons.wikimedia.org/wiki/Category:Items_with_OTRS_permission_confirmed
  /.* drinking fountains.*/, //Q55170978 ch-zh "Outdoor drinking fountains"
  /arcades in .+/, //Q27229859 ch-zh "Arcades in Switzerland"
  /balconies in .+/, //Q27229859 ch-zh "Balconies in Switzerland"
]

export function isBlacklisted(categoryName: string | null): boolean {
 
  const check: () => [string, boolean] = () => {
    if (categoryName != null) {
      const name = categoryName.trim().toLowerCase()
      if (name.length > 0) {
          if (blacklist.has(name)) {
              return ['on blacklist', true];
          } else {
              return ['on blacklistRegExp', blacklistRegExp.some(regex => regex.test(name))]
          }
      }
    }
    return ['invalid string', true]
  }
  const [reason, result] = check()
  if(result && process.env.NODE_ENV !== 'production') {
      l.info(`categories.wm.js isBlacklisted because ${reason}: category "${categoryName}"`)           
   }
  return result
}