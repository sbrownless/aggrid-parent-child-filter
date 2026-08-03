import { Component } from '@angular/core';
import {
  ColDef,
  GetDetailRowDataParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IDetailCellRendererParams
} from 'ag-grid-community';
import 'ag-grid-enterprise';

interface ChildRow {
  name: string;
  description: string;
}

interface ParentRow {
  name: string;
  category: string;
  children: ChildRow[];
  _matchingChildren?: ChildRow[];
}

type DetailCellRendererParams = Pick<
  IDetailCellRendererParams<ParentRow, ChildRow>,
  'detailGridOptions' | 'getDetailRowData' | 'refreshStrategy'
>;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  gridApi!: GridApi<ParentRow>;

  columnDefs: ColDef<ParentRow>[] = [
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
    { field: 'name', filter: true },
    { field: 'category', filter: true }
  ];

  childColumnDefs: ColDef<ChildRow>[] = [
    { field: 'name' },
    { field: 'description' }
  ];

  childDefaultColDef: ColDef<ChildRow> = {
    flex: 1,
    resizable: true
  };

  defaultColDef: ColDef<ParentRow> = {
    flex: 1,
    resizable: true,
    sortable: true,
    filter: true
  };

  rowData: ParentRow[] = [
    {
      name: 'Parent A',
      category: 'Group 1',
      children: [
        { name: 'Child A1', description: 'Blue item' },
        { name: 'Child A2', description: 'Red item' }
      ]
    },
    {
      name: 'Parent B',
      category: 'Group 2',
      children: [
        { name: 'Child B1', description: 'Yellow item' },
        { name: 'Child B2', description: 'Green item' }
      ]
    }
  ];

  detailCellRendererParams: DetailCellRendererParams = {
    detailGridOptions: {
      domLayout: 'autoHeight',
      columnDefs: this.childColumnDefs,
      defaultColDef: this.childDefaultColDef,
      onFirstDataRendered: () => {
        this.gridApi?.onRowHeightChanged();
      }
    },
    getDetailRowData: (params: GetDetailRowDataParams<ParentRow, ChildRow>) => {
      const matchingChildren = params.data._matchingChildren;
      const rows = matchingChildren && matchingChildren.length ? matchingChildren : params.data.children;
      params.successCallback(rows);
    },
    refreshStrategy: 'rows'
  };

  currentFilterText = '';
  parentFilterFields = ['name', 'category'];
  childFilterFields = ['name', 'description'];

  gridOptions: GridOptions<ParentRow> = {
    columnDefs: this.columnDefs,
    defaultColDef: this.defaultColDef,
    rowData: this.rowData,
    masterDetail: true,
    detailRowAutoHeight: true,
    detailCellRendererParams: this.detailCellRendererParams,
    isRowMaster: dataItem => !!dataItem.children && dataItem.children.length > 0,
    isExternalFilterPresent: () => !!this.currentFilterText,
    doesExternalFilterPass: node => {
      const data = node.data;
      if (!data) {
        return false;
      }

      const filterText = this.currentFilterText;
      if (!filterText) {
        return true;
      }

      const parentMatches = this.parentFilterFields.some(field =>
        String((data as any)[field] ?? '').toLowerCase().includes(filterText)
      );

      const childMatches = data.children?.some(child =>
        this.childFilterFields.some(field =>
          String((child as any)[field] ?? '').toLowerCase().includes(filterText)
        )
      );

      return parentMatches || !!childMatches;
    }
  };

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
  }

  onSearchChange(value: string) {
    this.currentFilterText = value.trim().toLowerCase();

    this.rowData.forEach(data => {
      if (!this.currentFilterText) {
        data._matchingChildren = undefined;
        return;
      }

      const matchingChildren = data.children?.filter(child =>
        this.childFilterFields.some(field =>
          String((child as any)[field] ?? '').toLowerCase().includes(this.currentFilterText)
        )
      ) ?? [];

      data._matchingChildren = matchingChildren.length ? matchingChildren : undefined;
    });

    this.gridApi.onFilterChanged();

    setTimeout(() => {
      this.gridApi.forEachNode(node => {
        const data = node.data;
        if (!data) {
          return;
        }

        const parentMatches = this.parentFilterFields.some(field =>
          String((data as any)[field] ?? '').toLowerCase().includes(this.currentFilterText)
        );

        const matchingChildren = data._matchingChildren?.length ? data._matchingChildren : [];

        if (this.currentFilterText && (matchingChildren.length > 0 || parentMatches)) {
          node.setExpanded(matchingChildren.length > 0 && !parentMatches ? true : matchingChildren.length > 0);
        } else {
          node.setExpanded(false);
        }
      });
    }, 0);
  }
}

