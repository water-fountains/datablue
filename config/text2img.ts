
import l from '../server/common/logger';

export type ImageLike = {
  typ: 'wm' | 'ext-flickr' | 'ext-fullImgUrl' | 'flickr',
  src: 'osm'
  value: string,
}
export type ImageLikeCollection = {
  src: 'osm',
  type: 
    'wm' | 'ext' | 'ext-fullImgUrl' | 'flickr' | 
    'unk' // defined like this in conflate.data.service.ts
  ,
  imgs: ImageLike[],
}

export function text2img(text: string) : ImageLikeCollection | null {
	const prefix = 'https://commons.wikimedia.org/wiki/File:';
	const prefixShort = 'file:'; //as per https://wiki.openstreetmap.org/wiki/Key:wikimedia%20commons example  
	const prefixFlickr = 'https://www.flickr.com/photos/';
	const staticFlickr = '^https://.+\.flickr\.com/.+\..+';
	const prefixStreetview = 'dueToKeyDisabled_https://maps.googleapis.com/maps/api/streetview?size=';
	let imWmNam: string|null = null;
	if(text.startsWith(prefix)){ //test with ch-zh Q27230145 or rather node/1415970706
		imWmNam = text.substring(prefix.length);
	} else {
		const textLc = text.toLowerCase()
		if (textLc.trim().startsWith(prefixShort)) {
			const startPos = textLc.indexOf(prefixShort);
			imWmNam = text.substring(startPos+prefixShort.length);
		}
	}
	if (null != imWmNam) {
		const imgName = decodeURI(imWmNam);
      return {
        src: 'osm',
        type:'wm',
        imgs: [{
          value: imgName,
          typ:'wm',
          src: 'osm'
        }]
      }
  } else if(text.startsWith(prefixFlickr) && -1 == text.indexOf('.',prefixFlickr.length)) { //test with it-ro Q76941085 or rather node/259576441
    return {
      src: 'osm',
      //TODO @Ralf.Hauser in all other cases type here and typ in imgs is always the same, only here we have ext and ext-flicker. Correct or a bug?
      type:'ext',
      imgs: [{
        value: text,
        typ: 'ext-flickr',
        src: 'osm'
      }]
    }
  } else if(text.startsWith(prefixStreetview) ) { //test with ch-zh Q55166478 or rather node/496416098
    return  {
      src: 'osm',
      type:'ext-fullImgUrl',
      imgs: [{
        value: text,
        typ:'ext-fullImgUrl',
        src: 'osm'
      }],
    }
  } else if(text.match(staticFlickr)){ //test with tr-be Q68792383 or rather node/3654842352
    return {
      src: 'osm',
      type:'flickr',
      imgs: [{
        value: text,
        typ:'flickr',
        src:'osm'
      }],
    }
  } else {
    l.info('fountain.properties.js osm img: ignored "'+text+'"');
    return null;
  }
}
