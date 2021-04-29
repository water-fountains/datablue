import { isArray } from "lodash";
import { FountainConfig, FountainPropertyCollection, TypedFountainProperty } from "./typealias";

//TODO would be nice to have official types, couldn't find some maybe worth contributing back?

export type MediaWikiEntity = {
  title: string;
  labels: { [lang: string]: any };
};

export type ExtMetadata = { value: string; source: string };

export type ImageInfo = { [key: string]: string };
export type ImageInfoExtMetadataCollection = {
  extmetadata: { [key: string]: ExtMetadata };
};

export type MediaWikiImageInfoCollection<P> = {
  imageinfo: P[];
};

export type MediaWikiPage<T> = T & {
  pageid: string;
  title: string;
};

export type MediaWikiQuery<T> = {
  query: { pages: { [pageid: string]: MediaWikiPage<T> } };
};

// FountainConfig is the overlapping type of MediaWiki and OSM
export interface MediaWikiEntityCollection extends FountainConfig {
  entities: { [key: string]: MediaWikiEntity | undefined };
  c: any;
}

export type WikiCommonsCategoryCollection = {
  wiki_commons_name: TypedFountainProperty<Category[]>;
};

//TODO @robstoll turn into extension function, would be a bit nicer to use
export function hasWikiCommonsCategories(collection: FountainPropertyCollection<{}>) : collection is FountainPropertyCollection<WikiCommonsCategoryCollection> {
    return collection.wiki_commons_name !== undefined && collection.wiki_commons_name.value != undefined && isArray(collection.wiki_commons_name.value)
}

export type Category = {
  n: string;
  c: string;
  l: number;
  //TODO @ralfhauser provide a more precise typing please
  e?: any
};
