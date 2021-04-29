import { Feature, FeatureCollection, Point } from "geojson";
import { ImageLikeCollection, ImageLikeType } from "../../config/text2img";
import { PropStatus } from "./constants";
import { Category } from "./wikimedia-types";

//TODO @ralfhauser as far as I can see, all features in the FeatureCollection collection has Point as type of `geometry`. Also, geometry is always defined.
// Do you know if there are exceptions to this rule? `geometry` is defined as different geometry type or null, i.e. it could also not exist. I have the feeling it always is
type FountainGeometry = Point;

//TODO @ralfhauser, same same as above and I also have the feeling properties is always defined. We would need to change this definition if there are cases where it does not exist
export type FountainPropertyCollection<T> = T & { [name: string]: any };
export type TypedFountainProperty<T> = {value: T}

export type Fountain<P = {}> = Feature<FountainGeometry, FountainPropertyCollection<P>>;
export type FountainCollection = FeatureCollection<
  FountainGeometry,
  FountainPropertyCollection<{}>
>;

export type FountainConfig = SourceConfig<any, string>;

export type FountainConfigCollection = {
  osm: FountainConfig[];
  wikidata: FountainConfig[];
};

//TODO @ralfhauser, not 100% correct, `gallery` does not fit into FountainProperty type. Should it?
export type FountainConfigProperties = {
  [id: string]: FountainConfigProperty;
};

export type Source = {
  //TODO @ralfhauser looks suspicious/buggy to me, shouldn't we know the status in all cases?
  status: PropStatus | null;
  raw: null;
  //TODO typing: try to get rid of any
  extracted: ImageLikeCollection | string | any | null;
  comments: string[];
};

export type FountainConfigProperty = {
  id: string;
  value: any;
  comments: string;
  status: PropStatus;
  source: SourceType;
  type: string;
  issues: [];
  sources: {
    osm: Source;
    wikidata: Source;
  };
};

/**
 * Fountain properties are described with the following structure:
 * [codename]: {  // unique codename of property
 *  name: {},  // name of property in all supported languages
 *  essential: bool,
 *  type: string,
 *  descriptions: {},
 *  src_pref: ['osm]
 * }
 */
//TODO @ralfhauser find better name
export type SCL = {
  s: string;
  c: string;
  l: number;
};



export type ImageInfoMetadataCollection = { [key: string]: string | undefined };

export type GalleryValue = {
  s: string;
  t: string;
  pgTit?: string;
  //TODO @ralfhauser, should not every SCPT have a category?
  c?: Category;
  metadata?: ImageInfoMetadataCollection;
  description?: string;
  typ?: ImageLikeType
};

export type Translated<T> = {
  en: T;
  de: T;
  fr: T;
  it: T;
  tr: T;
};

export type NamedSources<W, O> = {
  wikidata: W;
  osm: O;
};
export type SourceConfig<V, RE> = {
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
    man_made?: "drinking_fountain" | "water_tap" | "water_well";
    amenity?: "drinking_water" | "water_point" | "watering_place" | "fountain";
    natural?: "spring";
  };
};

//TODO @ralfhauser looks suspicious/buggy to me, IMO we always know that it is either osm or wikidata, shall I change/fix this?
// this currently occurs if metadata.src_config['osm'] or metadata.src_config['wikidata'] returns null in conflate.data.service.ts
export type SourceType = "osm" | "wikidata" | "";
