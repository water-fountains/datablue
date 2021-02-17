# Components

![data flow](/docs/images/data-flow.png)

## Data collection
Data is collected from a selection of repositories (see figure below), either on a schedule or triggered by webhooks, if possible. In the case of media files hosted on Wikimedia, only the metadata and a link to the media file is collected.
To increase transparency and protect against data sources going offline, backups of the data will be made on a weekly basis.

## Data assimilation
The data collected from the different sources is imported into a data structure (e.g. database table, see “consolidation DB” in figure below) where each row corresponds to information for a single fountain as read from a single data source. It is thereby possible to have multiple rows for a single fountain, and the origin of each information is memorized.
Data importation (see “data importer” in figure below) into the data structure thanks to scripts and configuration files which 
1.	map property names from the source to the data structure (e.g. “name_fr”: “nom”)
2.	Indicate nodata values (e.g. ‘inconnu’)
3.	Provide missing metadata (e.g. city = ‘Geneva’ or water_quality=’excellent’)
4.	Set the authority level of the datasource (Zurich OGD is of higher authority than Wikidata), relevant for the merging process
5.	Provide information on the estimated accuracy of the fountain coordinates (e.g. +/- 1 m)

## Data exporting/merging

The data served to the web app must meet certain quality standards (no duplicates, certain fields required). The data export step polishes the data quality and formats the data as a json for the web app:
1. Merge duplicates: 
  - The rows of the data structure are grouped by similarity of location and given name. For the location, a distance threshold can be defined. For the comparison of names, many algorithms are available: Hamming distance, Levenshtein distance, Damerau–Levenshtein distance, Jaro–Winkler distance. A smart combination of the two distances must be designed (e.g. if the name matches perfectly, then the location doesn’t matter as much). It would be clever to normalize the geometric distance with the estimated accuracy of the coordinates. Warning: two empty names must have a non-zero distance.
  - Within each group, rows are squeezed together into a single row. If for a given property multiple proposals (coming from multiple data sources) exist, then the proposal with the highest authority level is conserved. 
  - In the merging process, the origin and language of each element is carried along. 
2. Quality check: The remaining rows should represent unique fountains. The quality should be guaranteed as follows:
  - Fountains without coordinates are removed.
  - Fountains with unknown drinking water quality should be labeled as such
  - Default values can be set in absence of information. (e.g. year = ‘unknown’)
3.	Save as JSON: The resulting dataset is saved as a json to be easily read by the app. One JSON is saved for each city.
