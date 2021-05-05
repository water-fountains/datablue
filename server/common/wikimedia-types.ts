import { FountainPropertyCollection, TypedFountainProperty } from './typealias';

//TODO would be nice to have official types, couldn't find some maybe worth contributing back?

export interface MediaWikiEntity {
  pageid: number;
  labels: { [lang: string]: { language: string; value: string } };
  descriptions: { [lang: string]: { language: string; value: string } };
}

export interface MediaWikiSimplifiedEntity {
  title: string;
  labels: { [lang: string]: string };
  descriptions: { [lang: string]: string };
  claims: { [id: string]: { value: any; qualifiers: { [id: string]: string[] } }[] };
  sitelinks?: { [lang: string]: string };
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

export interface MediaWikiEntityCollection {
  entities: { [key: string]: MediaWikiEntity | undefined };
}

export interface WikiCommonsCategoryCollection {
  wiki_commons_name: TypedFountainProperty<Category[]>;
}

//TODO @robstoll turn into extension function, would be a bit nicer to use
export function hasWikiCommonsCategories(
  collection: FountainPropertyCollection<Record<string, unknown>>
): collection is FountainPropertyCollection<WikiCommonsCategoryCollection> {
  return collection.wiki_commons_name?.value !== undefined && Array.isArray(collection.wiki_commons_name.value);
}

export interface Category {
  n: string;
  c: string;
  l: number;
  //TODO @ralfhauser provide a more precise typing please
  e?: any;
}
