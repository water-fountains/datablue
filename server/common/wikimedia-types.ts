import { isArray } from 'lodash';
import { FountainConfig, FountainPropertyCollection, TypedFountainProperty } from './typealias';

//TODO would be nice to have official types, couldn't find some maybe worth contributing back?

export interface MediaWikiEntity {
  title: string;
  labels: { [lang: string]: any };
}

export interface ExtMetadata {
  value: string;
  source: string;
}

export interface ImageInfo {
  [key: string]: string;
}
export interface ImageInfoExtMetadataCollection {
  extmetadata: { [key: string]: ExtMetadata };
}

export interface MediaWikiImageInfoCollection<P> {
  imageinfo: P[];
}

export type MediaWikiPage<T> = T & {
  pageid: string;
  title: string;
};

export interface MediaWikiQuery<T> {
  query: { pages: { [pageid: string]: MediaWikiPage<T> } };
}

// FountainConfig is the overlapping type of MediaWiki and OSM
export interface MediaWikiEntityCollection extends FountainConfig {
  entities: { [key: string]: MediaWikiEntity | undefined };
  c: any;
}

export interface WikiCommonsCategoryCollection {
  wiki_commons_name: TypedFountainProperty<Category[]>;
}

//TODO @robstoll turn into extension function, would be a bit nicer to use
export function hasWikiCommonsCategories(
  collection: FountainPropertyCollection<Record<string, unknown>>
): collection is FountainPropertyCollection<WikiCommonsCategoryCollection> {
  return collection.wiki_commons_name?.value != undefined && isArray(collection.wiki_commons_name.value);
}

export interface Category {
  n: string;
  c: string;
  l: number;
  //TODO @ralfhauser provide a more precise typing please
  e?: any;
}
