import { Component, inject, input } from '@angular/core';
import { ColDef, ExcelCell, ExcelRow, GridApi, GridOptions, GridReadyEvent, ProcessRowGroupForExportParams } from 'ag-grid-community';
import 'ag-grid-enterprise';
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
  readonly displayName = input<string>('Default Name');
  exportAllData = true;
  currentExportFilteredOnly = false;
  private gridApi?: GridApi<SearchableCatalogEntry>;
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
    filter: true,
    headerClass: 'excel-header-bold'
  };

  detailDefaultColDef: ColDef<SearchableCatalogDetail> = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: true,
    headerClass: 'excel-header-bold'
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

  gridOptions: GridOptions<SearchableCatalogEntry> = {
    ...this.searchSetup.gridOptions,
    excelStyles: [
      {
        id: 'excel-header-bold',
        font: { bold: true }
      }
    ]
  };

  onSearchInput(value: string) {
    this.searchSetup.onSearchInput(value);
  }

  clearSearch() {
    this.searchSetup.clearSearch();
  }

  onGridReady(event: GridReadyEvent<SearchableCatalogEntry>) {
    this.gridApi = event.api;
  }

  exportToExcel(event: Event, exportFilteredData?: boolean) {
    event.preventDefault();
    const useFilteredExport = exportFilteredData ?? !this.exportAllData;
    this.currentExportFilteredOnly = useFilteredExport;
    this.gridApi?.exportDataAsExcel({
      fileName: this.getExportFileName(),
      exportedRows: useFilteredExport ? 'filteredAndSorted' : 'all',
      getCustomContentBelowRow: params => this.getDetailRowsForExcel(params)
    });
  }

  get exportModeLabel(): string {
    return this.exportAllData ? 'Download All data' : 'Download Filtered data';
  }

  canExport(): boolean {
    return !!this.gridApi;
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

  private getDetailRowsForExcel(params: ProcessRowGroupForExportParams): ExcelRow[] {
    const row = params.node.data as SearchableCatalogEntry | undefined;
    const details = this.currentExportFilteredOnly ? this.getVisibleDetailRows(row) : [...(row?.catalogDetails ?? [])];
    if (!details.length) {
      return [];
    }

    const rows: ExcelRow[] = [
      {
        outlineLevel: 1,
        cells: [
          this.excelCell(''),
          this.excelCell(`Detail rows for ${row?.uniqueId ?? 'entry'}`, 'excel-header-bold'),
          this.excelCell(''),
          this.excelCell(''),
          this.excelCell('')
        ]
      },
      {
        outlineLevel: 1,
        cells: [
          this.excelCell(''),
          this.excelCell('Field Changed', 'excel-header-bold'),
          this.excelCell('Original Value', 'excel-header-bold'),
          this.excelCell('New Value', 'excel-header-bold'),
          this.excelCell('Updated By', 'excel-header-bold')
        ]
      }
    ];

    for (const detail of details) {
      rows.push({
        outlineLevel: 1,
        cells: [
          this.excelCell(''),
          this.excelCell(detail.fieldChanged),
          this.excelCell(detail.originalValue),
          this.excelCell(detail.newValue),
          this.excelCell(detail.updatedBy)
        ]
      });
    }

    return rows;
  }

  private excelCell(value: unknown, styleId?: string): ExcelCell {
    return {
      styleId,
      data: {
        type: 'String',
        value: value === null || value === undefined ? '' : String(value)
      }
    };
  }

  private getExportFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const suffix = `${year}-${day}-${month}`;

    return `Catalog entries for ${this.displayName()}-${suffix}.xlsx`;
  }
}
