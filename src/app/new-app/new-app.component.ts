import { Component, inject } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';
import { CatalogSearchService } from './catalog-search.service';
import { CATALOG_SEARCH_INDEX_CONFIG } from './search-index/catalog-search-index.config';
import {
  CatalogSearchIndexService,
  SearchableCatalogDetail,
  SearchableCatalogEntry
} from './search-index/catalog-search-index.service';
import { createMasterDetailSearchSetup } from './search-index/master-detail-search.helper';

@Component({
  selector: 'app-new-app',
  templateUrl: './new-app.component.html',
  styleUrls: ['./new-app.component.css']
})
export class NewAppComponent {
  readonly searchService = inject(CatalogSearchService);
  readonly searchIndexService = inject(CatalogSearchIndexService);
  title = 'Catalog Entries';
  private readonly searchConfig = CATALOG_SEARCH_INDEX_CONFIG;
  private readonly originalDetailLookup = new Map<string, SearchableCatalogDetail[]>();

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

  readonly searchSetup = createMasterDetailSearchSetup(
    this.rowData,
    this.searchConfig,
    this.searchService,
    this.searchIndexService,
    row => this.getVisibleDetailRows(row),
    row => row?.catalogDetails ?? [],
    row => row.uniqueId,
    this.masterColumnDefs,
    this.detailColumnDefs,
    this.masterDefaultColDef,
    this.detailDefaultColDef
  );

  gridOptions: GridOptions<SearchableCatalogEntry> = this.searchSetup.gridOptions;

  onSearchInput(value: string) {
    this.searchSetup.onSearchInput(value);
  }

  clearSearch() {
    this.searchSetup.clearSearch();
  }

  reindexAfterDataChange() {
    this.searchSetup.reindexAfterDataChange();
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

    if (!this.originalDetailLookup.has(row.uniqueId)) {
      this.originalDetailLookup.set(row.uniqueId, originalDetails);
    }

    if (!searchText || matchInfo.matchMode !== 'child-only') {
      return [...originalDetails];
    }

    return [...(matchInfo.matchingChildren ?? [])];
  }
}
