import { Component, inject } from '@angular/core';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { CatalogSearchService } from './catalog-search.service';
import { CATALOG_SEARCH_INDEX_CONFIG } from './search-index/catalog-search-index.config';
import {
  CatalogSearchIndexService,
  SearchableCatalogDetail,
  SearchableCatalogEntry
} from './search-index/catalog-search-index.service';

@Component({
  selector: 'app-new-app',
  templateUrl: './new-app.component.html',
  styleUrls: ['./new-app.component.css']
})
export class NewAppComponent {
  readonly searchService = inject(CatalogSearchService);
  readonly searchIndexService = inject(CatalogSearchIndexService);
  title = 'Catalog Entries';
  private gridApi?: GridApi<SearchableCatalogEntry>;
  private readonly searchConfig = CATALOG_SEARCH_INDEX_CONFIG;
  private readonly originalDetailLookup = new Map<string, SearchableCatalogDetail[]>();
  private searchRefreshHandle?: number;

  constructor() {
    this.searchIndexService.rebuildSearchIndex(this.rowData, this.searchConfig);
  }

  masterColumnDefs: ColDef<SearchableCatalogEntry>[] = [
    {
      headerName: '',
      width: 60,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: () => ''
      },
      valueGetter: () => '',
      sortable: false,
      filter: false,
      suppressMenu: true,
      lockPosition: 'left',
      pinned: 'left'
    },
    { field: 'uniqueId', headerName: 'Unique ID', minWidth: 180 },
    { field: 'status', minWidth: 120 },
    { field: 'changeType', headerName: 'Change Type', minWidth: 140 },
    { field: 'changeTicketNumber', headerName: 'Ticket', minWidth: 140 },
    { field: 'createdBy', headerName: 'Created By', minWidth: 140 },
    { field: 'lastUpdatedBy', headerName: 'Last Updated By', minWidth: 160 },
    {
      field: '_matchMode',
      headerName: 'Match Mode',
      minWidth: 130,
      maxWidth: 150,
      sortable: false,
      filter: false
    },
    {
      headerName: 'Debug Match',
      minWidth: 150,
      maxWidth: 180,
      sortable: false,
      filter: false,
      valueGetter: params => this.getDebugMatchSummary(params.data as SearchableCatalogEntry | undefined)
    },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      minWidth: 170,
      valueFormatter: params => {
        const value = params.value as Date | string | null | undefined;
        if (!value) {
          return '';
        }

        return new Date(value).toLocaleString();
      }
    }
  ];

  detailColumnDefs: ColDef<SearchableCatalogDetail>[] = [
    { field: 'fieldChanged', headerName: 'Field Changed', minWidth: 170 },
    { field: 'originalValue', headerName: 'Original Value', minWidth: 160 },
    { field: 'newValue', headerName: 'New Value', minWidth: 160 },
    { field: 'updatedBy', headerName: 'Updated By', minWidth: 140 }
  ];

  masterDefaultColDef: ColDef<SearchableCatalogEntry> = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: true
  };

  detailDefaultColDef: ColDef<SearchableCatalogDetail> = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: true
  };

  rowData: SearchableCatalogEntry[] = [
    {
      uniqueId: 'CAT-1001',
      status: 'Approved',
      changeType: 'Update',
      changeTicketNumber: 'CHG-24001',
      createdBy: 'jsmith',
      lastUpdatedBy: 'adoe',
      lastUpdated: new Date('2026-07-18T09:22:00'),
      catalogDetails: [
        {
          fieldChanged: 'status',
          originalValue: 'Pending',
          newValue: 'Approved',
          updatedBy: 'adoe'
        },
        {
          fieldChanged: 'owner',
          originalValue: 'team-a',
          newValue: 'team-b',
          updatedBy: 'adoe'
        }
      ]
    },
    {
      uniqueId: 'CAT-1002',
      status: 'Draft',
      changeType: 'Create',
      changeTicketNumber: 'CHG-24009',
      createdBy: 'mhill',
      lastUpdatedBy: 'mhill',
      lastUpdated: new Date('2026-07-24T16:10:00'),
      catalogDetails: [
        {
          fieldChanged: 'description',
          originalValue: '',
          newValue: 'Initial description',
          updatedBy: 'mhill'
        }
      ]
    },
    {
      uniqueId: 'CAT-1003',
      status: 'Rejected',
      changeType: 'Delete',
      changeTicketNumber: 'CHG-24015',
      createdBy: 'rpatel',
      lastUpdatedBy: 'ops-user',
      lastUpdated: new Date('2026-07-31T11:47:00'),
      catalogDetails: [
        {
          fieldChanged: 'status',
          originalValue: 'Pending',
          newValue: 'Rejected',
          updatedBy: 'ops-user'
        },
        {
          fieldChanged: 'comments',
          originalValue: 'N/A',
          newValue: 'Missing approval evidence',
          updatedBy: 'ops-user'
        }
      ]
    }
  ];

  detailGridOptions: GridOptions<SearchableCatalogDetail> = {
    columnDefs: this.detailColumnDefs,
    defaultColDef: this.detailDefaultColDef,
    domLayout: 'autoHeight'
  };

  gridOptions: GridOptions<SearchableCatalogEntry> = {
    columnDefs: this.masterColumnDefs,
    defaultColDef: this.masterDefaultColDef,
    rowData: this.rowData,
    masterDetail: true,
    detailCellRendererParams: {
      detailGridOptions: this.detailGridOptions,
      refreshStrategy: 'everything' as const,
      getDetailRowData: (params: { data: SearchableCatalogEntry | undefined; successCallback: (rows: SearchableCatalogDetail[]) => void }) => {
        const row = params.data as SearchableCatalogEntry | undefined;
        params.successCallback(this.getVisibleDetailRows(row));
      }
    },
    isRowMaster: dataItem => !!dataItem?.catalogDetails?.length,
    isExternalFilterPresent: () => this.searchService.hasText(),
    doesExternalFilterPass: node => {
      const data = node.data;
      if (!data) {
        return false;
      }

      return this.searchService.hasText() ? (data._matchMode ?? 'none') !== 'none' : true;
    },
    animateRows: true,
    onGridReady: event => this.onGridReady(event)
  };

  onSearchInput(value: string) {
    this.searchService.setText(value);
    this.applySearch(this.searchService.normalizedText());
  }

  clearSearch() {
    this.searchService.clear();
    this.applySearch('');
  }

  reindexAfterDataChange() {
    this.searchIndexService.rebuildSearchIndex(this.rowData, this.searchConfig);
    this.applySearch(this.searchService.normalizedText());
  }

  private onGridReady(event: GridReadyEvent<SearchableCatalogEntry>) {
    this.gridApi = event.api;
    this.applySearch(this.searchService.normalizedText());
  }

  private getDebugMatchSummary(entry: SearchableCatalogEntry | undefined): string {
    if (!entry) {
      return '';
    }

    const searchText = this.searchService.normalizedText();
    if (!searchText) {
      return 'none:0';
    }

    const matchInfo = this.searchIndexService.getMatchInfo(entry, searchText, this.searchConfig);
    return `${matchInfo.matchMode}:${matchInfo.matchingChildren?.length ?? 0}`;
  }

  private getVisibleDetailRows(row: SearchableCatalogEntry | undefined): SearchableCatalogDetail[] {
    if (!row?.uniqueId) {
      return [];
    }

    const searchText = this.searchService.normalizedText();
    const matchInfo = this.searchIndexService.getMatchInfo(row, searchText, this.searchConfig);
    const originalDetails = this.originalDetailLookup.get(row.uniqueId) ?? [...(row.catalogDetails ?? [])];

    if (!searchText || matchInfo.matchMode !== 'child-only') {
      return [...originalDetails];
    }

    return [...(matchInfo.matchingChildren ?? [])];
  }

  private applySearch(searchText: string) {
    if (this.searchRefreshHandle) {
      window.clearTimeout(this.searchRefreshHandle);
    }

    this.searchRefreshHandle = window.setTimeout(() => {
      this.performSearchUpdate(searchText);
    }, 150);
  }

  private performSearchUpdate(searchText: string) {
    this.searchRefreshHandle = undefined;

    for (const entry of this.rowData) {
      this.searchIndexService.ensureIndexed(entry, this.searchConfig);
      const matchInfo = this.searchIndexService.getMatchInfo(entry, searchText, this.searchConfig);
      entry._matchMode = matchInfo.matchMode;
      entry._matchingChildren = matchInfo.matchingChildren as SearchableCatalogDetail[] | undefined;

      const originalDetails = this.originalDetailLookup.get(entry.uniqueId) ?? [...(entry.catalogDetails ?? [])];
      if (!this.originalDetailLookup.has(entry.uniqueId)) {
        this.originalDetailLookup.set(entry.uniqueId, originalDetails);
      }

    }

    if (!this.gridApi) {
      return;
    }

    window.setTimeout(() => {
      if (!this.gridApi) {
        return;
      }

      this.gridApi!.onFilterChanged();
      this.gridApi!.refreshCells({ force: true });

      const rowsToExpand = new Set<string>();
      this.gridApi!.forEachNode(node => {
        const data = node.data;
        if (!data) {
          return;
        }

        const shouldExpand = !!searchText && (data._matchMode ?? 'none') !== 'none' && !!data.catalogDetails?.length;
        if (shouldExpand) {
          rowsToExpand.add(data.uniqueId);
        }
      });

      this.gridApi!.forEachNode(node => {
        node.setExpanded(false);
      });

      window.setTimeout(() => {
        if (!this.gridApi) {
          return;
        }

        this.gridApi!.forEachNode(node => {
          const data = node.data;
          if (!data) {
            return;
          }

          if (rowsToExpand.has(data.uniqueId)) {
            node.setExpanded(true);
          }
        });
      }, 0);
    }, 0);
  }
}
