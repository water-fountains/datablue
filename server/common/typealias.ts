import { Feature, FeatureCollection, Geometry, Point, Position } from 'geojson';
import { UncheckedBoundingBox } from '../../config/locations';
import { ImageLikeCollection, ImageLikeType } from '../../config/text2img';
import { isNumeric } from '../api/controllers/utils';
import { PropStatus } from './constants';
import { illegalState } from './illegalState';
import { Category, MediaWikiSimplifiedEntity } from './wikimedia-types';

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
//TODO @ralfhauser as far as I can see, geometry is always defined.
// Do you know if there are exceptions to this rule? `geometry` is defined as different geometry type or null, i.e. it could also not exist. I have the feeling it always is
type DefaultFountainGeometry = Point;

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
//TODO @ralfhauser, same same as above and I also have the feeling properties is always defined. We would need to change this definition if there are cases where it does not exist
export type FountainPropertyCollection<T> = T & { [name: string]: any };

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface TypedFountainProperty<T> {
  value: T;
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export type Fountain<G extends Geometry = DefaultFountainGeometry, P = Record<string, unknown>> = Feature<
  G,
  FountainPropertyCollection<P>
>;

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export type FountainCollection<G extends Geometry = DefaultFountainGeometry> = FeatureCollection<
  G,
  FountainPropertyCollection<Record<string, unknown>>
> & { last_scan: Date };

export function FountainCollection(fountains: Fountain[], lastScan: Date): FountainCollection {
  return { type: 'FeatureCollection', features: fountains, last_scan: lastScan };
}

export type FountainConfig = SourceConfig<any, string>;

export type FountainConfigCollection = NamedSources<MediaWikiSimplifiedEntity[], FountainConfig[]>;

//TODO @ralfhauser, not 100% correct, `gallery` does not fit into FountainProperty type. Should it?
export interface FountainConfigProperties {
  [id: string]: FountainConfigProperty;
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface Source {
  //TODO @ralfhauser looks suspicious/buggy to me, shouldn't we know the status in all cases?
  status: PropStatus | null;
  raw: null;
  //TODO typing: try to get rid of any
  extracted: ImageLikeCollection | string | any | null;
  comments: string[];
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface FountainConfigProperty {
  id: string;
  value: any;
  comments: string;
  status: PropStatus;
  source: SourceType;
  type: string;
  issues: [];
  sources: NamedSources<Source, Source>;
}

//TODO @ralfhauser find better name
export interface SCL {
  s: string;
  c: string;
  l: number;
}

export interface ImageInfoMetadataCollection {
  [key: string]: string | undefined;
}

export interface GalleryValue {
  s: string;
  t: string;
  pgTit?: string;
  c?: Category;
  metadata?: ImageInfoMetadataCollection;
  description?: string;
  typ?: ImageLikeType;
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface Translated<T> {
  en: T;
  de: T;
  fr: T;
  it: T;
  tr: T;
}

export interface NamedSources<W, O> {
  wikidata: W;
  osm: O;
}
export interface SourceConfig<V, RE> {
  src_path: string[];
  src_instructions: Translated<string[]>;
  value_translation: (values: V) => any | null;

  help?: string;
  extraction_info?: Translated<string> | Translated<string[]>;
  src_info?: Translated<string>;
  src_path1?: string[];
  src_path_extra?: string[];
  value_translation_extra?: (text: string) => RE | null;
  //TODO see if we get official types
  properties?: {
    image: string;
    wikimedia_commons?: any;
    man_made?: 'drinking_fountain' | 'water_tap' | 'water_well';
    amenity?: 'drinking_water' | 'water_point' | 'watering_place' | 'fountain';
    natural?: 'spring';
  };
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
//TODO @ralfhauser looks suspicious/buggy to me, IMO we always know that it is either osm or wikidata, shall I change/fix this?
// this currently occurs if metadata.src_config['osm'] or metadata.src_config['wikidata'] returns null in conflate.data.service.ts
export type SourceType = keyof NamedSources<unknown, unknown> | '';

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in datablue as well
export type Database = SourceType;

export function isDatabase(d: string): d is Database {
  return d === 'osm' || d === 'wikidata';
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface LngLat {
  lng: number;
  lat: number;
}
export function LngLat(lng: number, lat: number): LngLat {
  if (lng < -180 || lng > 180) illegalState('lng out of range [-180, 180]', lng);
  if (lat < -90 || lat > 90) illegalState('lat out of range [-180, 180]', lat);

  return { lng: lng, lat: lat };
}
export function parseLngLat(lngLatAsString: string): LngLat {
  const lngLatArr = lngLatAsString.split(',');
  if (lngLatArr.length >= 2 && isNumeric(lngLatArr[0]) && isNumeric(lngLatArr[1])) {
    const lat = Number(lngLatArr[0]);
    const lng = Number(lngLatArr[1]);
    return LngLat(lng, lat);
  } else {
    illegalState('could not parse to LngLat, given string: ' + lngLatAsString);
  }
}
export function positionToLngLat(position: Position): LngLat {
  const lng = position[0];
  const lat = position[1];
  if (lng === undefined || lat === undefined) {
    illegalState('position.length was less than 2', position);
  }
  return LngLat(lng, lat);
}

// TODO it would make more sense to move common types to an own library which is consumed by both, datablue and proximap
// if you change something here, then you need to change it in proximap as well
export interface BoundingBox {
  min: LngLat;
  max: LngLat;
}
export function BoundingBox(min: LngLat, max: LngLat): BoundingBox {
  if (min.lng >= max.lng) illegalState('min lng greater or equal max lng.', 'min', min, 'max', max);
  if (min.lat >= max.lat) illegalState('min lat greater or equal to max lat', 'min', min, 'max', max);

  return { min: min, max: max };
}
export function uncheckedBoundingBoxToChecked(uncheckedBoundingBox: UncheckedBoundingBox): BoundingBox {
  return BoundingBox(
    LngLat(uncheckedBoundingBox.lngMin, uncheckedBoundingBox.latMin),
    LngLat(uncheckedBoundingBox.lngMax, uncheckedBoundingBox.latMax)
  );
}
