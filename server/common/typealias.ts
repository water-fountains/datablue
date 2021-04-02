import { Feature, FeatureCollection, Point } from "geojson"


//TODO @ralfhauser as far as I can see, all features in the FeatureCollection collection has Point as type of `geometry`. Also, geometry is always defined. 
// Do you know if there are exceptions to this rule? `geometry` is defined as different geometry type or null, i.e. it could also not exist. I have the feeling it always is
type G = Point

//TODO @ralfhauser, same same as above and I also have the feeling properties is always defined. We would need to change this definition if there are cases where it does not exist
type P =  { [name: string]: any; }

export type Fountain = Feature<G, P>
export type FountainCollection = FeatureCollection<G, P>
