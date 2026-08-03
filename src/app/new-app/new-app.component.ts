import { Component, effect, inject } from '@angular/core';
import { ColDef, GridApi, GridOptions, GridReadyEvent, IDetailCellRendererParams } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { catalogDetailModel } from '../catalogEntry.model';
import { CatalogSearchService } from './catalog-search.service';
import {
  CatalogSearchIndexService,
  SearchableCatalogDetail,
  SearchableCatalogEntry
} from './catalog-search-index.service';

type DetailCellRendererParams = Pick<
  IDetailCellRendererParams<SearchableCatalogEntry, SearchableCatalogDetail>,
  'detailGridOptions' | 'getDetailRowData' | 'refreshStrategy'
>;

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

  constructor() {
    this.searchIndexService.rebuildSearchIndex(this.rowData);

    effect(() => {
      this.applySearch(this.searchService.normalizedText());
    });
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

  detailCellRendererParams: DetailCellRendererParams = {
    detailGridOptions: {
      columnDefs: this.detailColumnDefs,
      defaultColDef: this.detailDefaultColDef,
      domLayout: 'autoHeight'
    },
    getDetailRowData: params => {
      const mode = params.data._matchMode ?? 'none';
      const fullDetails = params.data.catalogDetails ?? [];
      params.successCallback(mode === 'child-only' ? params.data._matchingChildren ?? [] : fullDetails);
    },
    refreshStrategy: 'rows'
  };

  gridOptions: GridOptions<SearchableCatalogEntry> = {
    columnDefs: this.masterColumnDefs,
    defaultColDef: this.masterDefaultColDef,
    rowData: this.rowData,
    masterDetail: true,
    detailRowAutoHeight: true,
    detailCellRendererParams: this.detailCellRendererParams,
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
  }

  clearSearch() {
    this.searchService.clear();
  }

  reindexAfterDataChange() {
    this.searchIndexService.rebuildSearchIndex(this.rowData);
    this.applySearch(this.searchService.normalizedText());
  }

  private onGridReady(event: GridReadyEvent<SearchableCatalogEntry>) {
    this.gridApi = event.api;
    this.applySearch(this.searchService.normalizedText());
  }

  private applySearch(searchText: string) {
    for (const entry of this.rowData) {
      this.searchIndexService.ensureIndexed(entry);
      const matchInfo = this.searchIndexService.getMatchInfo(entry, searchText);
      entry._matchMode = matchInfo.matchMode;
      entry._matchingChildren = matchInfo.matchingChildren;
    }

    if (!this.gridApi) {
      return;
    }

    this.gridApi.onFilterChanged();
    this.gridApi.forEachNode(node => {
      node.setExpanded(false);
    });

    if (!searchText) {
      return;
    }

    this.gridApi.forEachNode(node => {
      const data = node.data;
      if (!data) {
        return;
      }

      node.setExpanded((data._matchMode ?? 'none') !== 'none');
    });
  }
}
