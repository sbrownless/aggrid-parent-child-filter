import { Component, ElementRef, inject } from '@angular/core';
import { ColDef, GridOptions, ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
import { SearchableCatalogDetail, SearchableCatalogEntry } from './search-index/catalog-search-index.service';

@Component({
  selector: 'app-detail-grid-renderer',
  template: `<ag-grid-angular
    style="width: 100%; height: 100%;"
    [gridOptions]="gridOptions"
    [rowData]="rows"
    [columnDefs]="columnDefs"
    [defaultColDef]="defaultColDef"
    [domLayout]="'autoHeight'"
  ></ag-grid-angular>`,
  standalone: false
})
export class DetailGridRendererComponent implements ICellRendererComp {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  rows: SearchableCatalogDetail[] = [];
  columnDefs: ColDef<SearchableCatalogDetail>[] = [];
  defaultColDef: ColDef<SearchableCatalogDetail> = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: true
  };

  readonly gridOptions: GridOptions<SearchableCatalogDetail> = {
    domLayout: 'autoHeight'
  };

  getGui(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  agInit(params: ICellRendererParams<SearchableCatalogEntry>): void {
    this.setRowsFromParams(params);
  }

  refresh(params: ICellRendererParams<SearchableCatalogEntry>): boolean {
    this.setRowsFromParams(params);
    return true;
  }

  private setRowsFromParams(params: ICellRendererParams<SearchableCatalogEntry>): void {
    const data = params.data as SearchableCatalogEntry | undefined;
    this.rows = Array.isArray(data?.catalogDetails) ? [...data.catalogDetails] : [];

    const context = params.context as { detailColumnDefs?: ColDef<SearchableCatalogDetail>[] } | undefined;
    if (context?.detailColumnDefs?.length) {
      this.columnDefs = context.detailColumnDefs;
    }
  }
}
