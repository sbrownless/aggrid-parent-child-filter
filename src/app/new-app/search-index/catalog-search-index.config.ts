import {
  SearchIndexConfig,
  SearchableCatalogDetail,
  SearchableCatalogEntry
} from './catalog-search-index.service';

export const CATALOG_SEARCH_INDEX_CONFIG: SearchIndexConfig<
  SearchableCatalogEntry,
  SearchableCatalogDetail
> = {
  parentSearchFields: [
    'uniqueId',
    'status',
    'changeType',
    'changeTicketNumber',
    'createdBy',
    'lastUpdatedBy'
  ],
  detailCollectionField: 'catalogDetails',
  detailSearchFields: ['updatedBy', 'fieldChanged', 'originalValue', 'newValue']
};
