import { Translated } from '../server/common/typealias';

/*
 * @license
 * (c) Copyright 2019 - 2020 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 *
 *
 * Each time you change the this file, you need to run
 *
 *   ~/git/proximap$ npm run sync_datablue for=locations
 *
 */

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface Location {
  name: string;
  description: Translated<string>;
  description_more: Translated<string>;
  bounding_box: BoundingBox;
  operator_fountain_catalog_qid: string;
  issue_api: IssueApi;
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface BoundingBox {
  latMin: number;
  lngMin: number;
  latMax: number;
  lngMax: number;
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface IssueApi {
  operator: string | null;
  //TODO @ralfhauser, is always null at definition site, do we still use this information somehwere?
  qid: null;
  thumbnail_url: string;
  url_template: string | null;
}

const internalLocationsCollection = {
  'ch-zh': {
    name: 'Zurich',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 47.3229261255644,
      lngMin: 8.45960259979614,
      latMax: 47.431119712250506,
      lngMax: 8.61940272745742,
    },
    operator_fountain_catalog_qid: 'Q53629101',
    issue_api: {
      operator: 'Wasserversorgung Zürich',
      qid: null,
      thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/ZueriWieNeuLogo.png',
      url_template: 'https://www.zueriwieneu.ch/report/new?longitude=${lon}&latitude=${lat}&category=Brunnen/Hydranten',
    },
  },
  'ch-ge': {
    name: 'Geneva',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 46.113705723112744,
      lngMin: 6.0129547119140625,
      latMax: 46.29001987172955,
      lngMax: 6.273880004882812,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'ch-bs': {
    name: 'Basel',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 47.517200697839414,
      lngMin: 7.544174194335937,
      latMax: 47.60477416894759,
      lngMax: 7.676696777343749,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'ch-lu': {
    name: 'Lucerne',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 47.03608752310776,
      lngMin: 8.282318115234375,
      latMax: 47.068718776878946,
      lngMax: 8.33810806274414,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'ch-nw': {
    name: 'Nidwalden',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 46.76432449601197,
      lngMin: 8.20953369140625,
      latMax: 47.01958886438217,
      lngMax: 8.580322265624998,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'de-hh': {
    name: 'Hamburg',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 53.4075,
      lngMin: 9.657,
      latMax: 53.7365,
      lngMax: 10.2997,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'it-roma': {
    name: 'Roma',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 41.793,
      lngMin: 12.369,
      latMax: 41.994,
      lngMax: 12.622,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'fr-paris': {
    name: 'Paris',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 48.818,
      lngMin: 2.246,
      latMax: 48.901,
      lngMax: 2.456,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'in-ch': {
    name: 'Chennai',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 12.8901,
      lngMin: 80.0285,
      latMax: 13.2894,
      lngMax: 80.3746,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'us-nyc': {
    name: 'New York',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 40.643135583312805,
      lngMin: -74.13848876953125,
      latMax: 40.852254338121625,
      lngMax: -73.81988525390624,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'tr-be': {
    name: 'Bergama',
    description: {
      en: `
<h2>The water fountains of Bergama</h2>
      The 2019 topic of the Bergama Environmental Film Festival <a href='https://bergamacevreff.org/en' target='_blank'>https://bergamacevreff.org/en</a> is WATER, an indispensable component of our life and the planet. .
Therefore responsible citizens have mapped out all fountains of the festival hosting city (with drinkable water or unfortunately no longer...) to foster environmental discussions to rebuild our future...
      `,
      de: ``,
      fr: ``,
      it: ``,
      tr: `
<h2> Bergama'nın su çeşmeleri </h2>
İklim krizinin olumsuzluklarının nedenlerini ortadan kaldırmak ve etkilerini azaltmak, bu olumsuzlukları yaratan bizler, insanların elinde. Bu nedenle sorumlu vatandaşlar olarak, iklim değişikliğine neden olan siyasal, toplumsal ve ekolojik sorunlar üzerine herkesi düşünmeye, sorgulamaya ve davranış değişikliğine yönlendiren bir film festivali yapıyoruz. Festivalin bu yılki teması bedenlerimizin ve gezegenin vazgeçilmez bileşeni SU. Büyük bir tehditle karşı karşıya olan ortak varlığımız su, bizi ulusların, dinlerin, nesillerin ve türlerin ötesinde birleştirecek güçte. İşte böyle berrak bir güçle geleceği yeniden inşa edebiliriz. Su gibi akan filmler, söyleşiler ve etkinliklerde buluşacağımız Bergama Çevre Filmleri Festivali’ne hepinizi yalnızca izlemek için değil, konuşmak, paylaşmak ve birlikte çözüm üretmek için de bekliyoruz.
      <a href='https://bergamacevreff.org' target='_blank'>https://bergamacevreff.org</a>
`,
    },
    description_more: {
      en: `It is in our hands to eliminate and reduce the effects of all the disastrous events caused by Climate Crises. Therefore, as responsible citizens, we organized a film festival on environmental issues we expected to experience in Turkey to discuss solutions and encourage behavioral changes toward the social and ecological problems due to climate crises. To be effective in our discussions, we will address a different environmental theme each year. This year's theme is WATER, an indispensable component of our life and the planet. Our common existence, facing a major threat, has the power to unite us beyond nationalities, religions, generations and species. With such clear power, we can rebuild the future. We are inviting you not only to watch and talk, but more importantly to share and find solutions together in Bergama Environmental Films Festival, where we will meet in films, panel discussions and various side events flowing like water.
<a href="https://bergamacevreff.org/en" target="_blank"> https://bergamacevreff.org/en</a>
<a href="http://whc.unesco.org/en/list/1457" target="_blank"> http://whc.unesco.org/en/list/1457</a>

<h3>Team</h3>
<a href="https://commons.wikimedia.org/wiki/User:Fatih_Kurunaz" target="_blank"> https://commons.wikimedia.org/wiki/User:Fatih_Kurunaz</a>`,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 39.08743603215884,
      lngMin: 27.13726043701172,
      latMax: 39.14097854651647,
      lngMax: 27.21691131591797,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  'sr-bg': {
    name: 'Belgrade',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      latMin: 44.725,
      lngMin: 20.3541,
      latMax: 44.8803,
      lngMax: 20.484,
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
  test: {
    name: 'Test-City (not in Prod)',
    description: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    description_more: {
      en: ``,
      de: ``,
      fr: ``,
      it: ``,
      tr: ``,
    },
    bounding_box: {
      //too many categories möve bellevue zürich 47,3655859, 8,5452455
      latMin: 47.3655,
      lngMin: 8.5452,
      latMax: 47.3656,
      lngMax: 8.5453,
      //categories regex problem https://beta.water-fountains.org/ch-ge?l=de&i=Q98494680  Fontaine de la rue du Mont-Blanc
      //  latMin: 46.2081,
      //  lngMin: 6.1447,
      //  latMax: 46.2083,
      //  lngMax: 6.1449
      // osm-node/7514807132 Gstadstr.56 Zollikon ch-zh for "year" and external google image 47.3396, 8.5704
      //  "latMin": 47.3396,
      //  "lngMin": 8.5704,
      //  "latMax": 47.3397,
      //  "lngMax": 8.5705
      // Q68792383 Bergama 39.1261, 27.1810
      // "latMin": 39.1258,
      // "lngMin": 27.1807,
      // "latMax": 39.1265,
      // "lngMax": 27.1814
      // Bambi Oberstrass
      //"latMin": 47.3934,
      //"lngMin": 8.5447,
      //"latMax": 47.3936,
      //"lngMax": 8.5448
      // osm wm-category ch-zh Brunnen Sunnehalde Küsnacht with forgotten Category
      //	        "latMin": 47.3288,
      //	        "lngMin": 8.5776,
      //	        "latMax": 47.3290,
      //	        "lngMax": 8.5778
      // osm wm-category ch-zh Brunnen Rietwies Zollikon https://github.com/water-fountains/proximap/issues/306
      //	        "latMin": 47.3390,
      //	        "lngMin": 8.6010,
      //	        "latMax": 47.3398,
      //	        "lngMax": 8.6018
      // osm wm-image ch-zh Brunnentrog mit Relief "Möve"  https://github.com/water-fountains/proximap/issues/306
      //	        "latMin": 47.3655,
      //	        "lngMin": 8.54524,
      //	        "latMax": 47.3656,
      //	        "lngMax": 8.54525
      //Klusdörfli without P18 nor coordinates 47.36518, 8.568826
      //"latMin": 47.3644,
      //"lngMin": 8.56875,
      //"latMax": 47.3652,
      //"lngMax": 8.56885
      // Schule Friesenberg with multiple Categories
      //	        "latMin": 47.3602,
      //	        "lngMin": 8.5054,
      //	        "latMax": 47.3604,
      //	        "lngMax": 8.5055
      // 2x Schule Friesenberg with multiple Categories
      //	        "latMin": 47.3584,
      //	        "lngMin": 8.5054,
      //	        "latMax": 47.3604,
      //	        "lngMax": 8.5058
      // Schule Friesenberg with 1 Category, no P18: 47.358684, 8.505754
      //	        "latMin": 47.3584,
      //	        "lngMin": 8.5054,
      //	        "latMax": 47.3587,
      //	        "lngMax": 8.5058
      //5 fountains of Bergama
      //	        "latMin": 39.117,
      //	        "lngMin": 27.17,
      //	        "latMax": 39.12,
      //	        "lngMax": 27.19
    },
    operator_fountain_catalog_qid: 'undefined',
    issue_api: {
      operator: null,
      qid: null,
      thumbnail_url: ``,
      url_template: null,
    },
  },
};

//TODO we could use this type instead of string
export type City = keyof typeof internalLocationsCollection;

export const cities: City[] = Object.keys(internalLocationsCollection).filter(
  city => city !== 'default' && (city !== 'test' || process.env.NODE_ENV !== 'production')
) as City[];

export function isCity(s: string): s is City {
  return cities.includes(s as City);
}

export type LocationsCollection = Record<City, Location>;
// we don't expose just the internal structure as we also want to be sure that it follows the spec.
// However, we allow City union to grow dynamically
export const locationsCollection: LocationsCollection = internalLocationsCollection;

export function mapLocations<R>(f: (loc: Location) => R): R[] {
  const arr: R[] = [];
  for (const loc in locationsCollection) {
    const l = locationsCollection[loc];
    arr.push(f(l));
  }
  return arr;
}
