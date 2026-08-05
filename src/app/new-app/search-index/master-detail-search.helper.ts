import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { CatalogSearchService } from '../catalog-search.service';
import { CatalogSearchIndexService, SearchableDetail, SearchableEntry, SearchIndexConfig } from './catalog-search-index.service';

export interface MasterDetailSearchSetup<TMaster extends SearchableEntry<TDetail>, TDetail extends SearchableDetail> {
  gridOptions: GridOptions<TMaster>;
  onSearchInput(value: string): void;
  clearSearch(): void;
  reindexAfterDataChange(): void;
}

export function createMasterDetailSearchSetup<
  TMaster extends SearchableEntry<TDetail>,
  TDetail extends SearchableDetail
>(
  rowData: TMaster[],
  searchConfig: SearchIndexConfig<TMaster, TDetail>,
  searchService: CatalogSearchService,
  searchIndexService: CatalogSearchIndexService,
  getVisibleDetailRows: (row: TMaster | undefined) => TDetail[],
  getDetailCollection: (row: TMaster | undefined) => TDetail[],
  getRowKey: (row: TMaster) => string,
  masterColumnDefs: ColDef<TMaster>[],
  detailColumnDefs: ColDef<TDetail>[],
  masterDefaultColDef: ColDef<TMaster>,
  detailDefaultColDef: ColDef<TDetail>
): MasterDetailSearchSetup<TMaster, TDetail> {
  let gridApi: GridApi<TMaster> | undefined;
  let searchRefreshHandle: number | undefined;

  const detailGridOptions: GridOptions<TDetail> = {
    columnDefs: detailColumnDefs,
    defaultColDef: detailDefaultColDef,
    domLayout: 'autoHeight'
  };

  const gridOptions: GridOptions<TMaster> = {
    columnDefs: masterColumnDefs,
    defaultColDef: masterDefaultColDef,
    rowData,
    masterDetail: true,
    detailCellRendererParams: {
      detailGridOptions,
      refreshStrategy: 'everything' as const,
      getDetailRowData: (params: { data: TMaster | undefined; successCallback: (rows: TDetail[]) => void }) => {
        const row = params.data as TMaster | undefined;
        params.successCallback(getVisibleDetailRows(row));
      }
    },
    isRowMaster: dataItem => !!getDetailCollection(dataItem).length,
    isExternalFilterPresent: () => searchService.hasText(),
    doesExternalFilterPass: node => {
      const data = node.data;
      if (!data) {
        return false;
      }

      return searchService.hasText() ? (data._matchMode ?? 'none') !== 'none' : true;
    },
    animateRows: true,
    onGridReady: (event: GridReadyEvent<TMaster>) => {
      gridApi = event.api;
      applySearch(searchService.normalizedText());
    }
  };

  const onSearchInput = (value: string) => {
    searchService.setText(value);
    applySearch(searchService.normalizedText());
  };

  const clearSearch = () => {
    searchService.clear();
    applySearch('');
  };

  const reindexAfterDataChange = () => {
    searchIndexService.rebuildSearchIndex(rowData, searchConfig);
    applySearch(searchService.normalizedText());
  };

  const applySearch = (searchText: string) => {
    if (searchRefreshHandle) {
      window.clearTimeout(searchRefreshHandle);
    }

    searchRefreshHandle = window.setTimeout(() => {
      performSearchUpdate(searchText);
    }, 150);
  };

  const performSearchUpdate = (searchText: string) => {
    searchRefreshHandle = undefined;

    for (const entry of rowData) {
      searchIndexService.ensureIndexed(entry, searchConfig);
      const matchInfo = searchIndexService.getMatchInfo(entry, searchText, searchConfig);
      entry._matchMode = matchInfo.matchMode;
      entry._matchingChildren = matchInfo.matchingChildren as TDetail[] | undefined;
    }

    if (!gridApi) {
      return;
    }

    window.setTimeout(() => {
      if (!gridApi) {
        return;
      }

      gridApi.onFilterChanged();
      gridApi.refreshCells({ force: true });

      const rowsToExpand = new Set<string>();
      gridApi.forEachNode(node => {
        const data = node.data;
        if (!data) {
          return;
        }

        const shouldExpand = !!searchText && (data._matchMode ?? 'none') !== 'none' && !!getDetailCollection(data).length;
        if (shouldExpand) {
          rowsToExpand.add(getRowKey(data));
        }
      });

      gridApi.forEachNode(node => {
        node.setExpanded(false);
      });

      window.setTimeout(() => {
        if (!gridApi) {
          return;
        }

        gridApi.forEachNode(node => {
          const data = node.data;
          if (!data) {
            return;
          }

          if (rowsToExpand.has(getRowKey(data))) {
            node.setExpanded(true);
          }
        });
      }, 0);
    }, 0);
  };

  return {
    gridOptions,
    onSearchInput,
    clearSearch,
    reindexAfterDataChange
  };
}
