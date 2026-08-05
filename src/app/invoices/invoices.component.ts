import { Component, inject } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';
import { CatalogSearchService } from '../new-app/catalog-search.service';
import { CatalogSearchIndexService, SearchIndexConfig, SearchableDetail, SearchableEntry } from '../new-app/search-index/catalog-search-index.service';
import { createMasterDetailSearchSetup } from '../new-app/search-index/master-detail-search.helper';

export interface Invoice extends SearchableEntry<InvoiceLineItem> {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Pending' | 'Paid' | 'Overdue';
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface InvoiceLineItem extends SearchableDetail {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const invoiceSearchConfig: SearchIndexConfig<Invoice, InvoiceLineItem> = {
  parentSearchFields: ['invoiceNumber', 'customerId', 'customerName', 'status', 'notes'],
  detailSearchFields: ['description', 'id'],
  detailCollectionField: 'items'
};

@Component({
  selector: 'app-invoices',
  template: `
    <div class="invoices-page">
      <h2>Invoices</h2>
      <div class="search-box">
        <input
          type="text"
          [value]="searchService.text()"
          (input)="onSearchInput($any($event).target.value)"
          placeholder="Search invoices or line items"
          aria-label="Invoice search"
        />
        <button *ngIf="searchService.hasText()" type="button" (click)="clearSearch()">x</button>
      </div>
      <ag-grid-angular class="ag-theme-alpine invoices-grid" [gridOptions]="gridOptions"></ag-grid-angular>
    </div>
  `,
  styleUrls: ['./invoices.component.css'],
  standalone: false
})
export class InvoicesComponent {
  readonly searchService = inject(CatalogSearchService);
  readonly searchIndexService = inject(CatalogSearchIndexService);

  readonly invoices: Invoice[] = [
    {
      id: 'INV-001',
      invoiceNumber: 'INV-2026-001',
      customerId: 'CUST-100',
      customerName: 'Acme Corp',
      issueDate: '2026-01-10',
      dueDate: '2026-01-24',
      status: 'Pending',
      items: [
        {
          id: 'LI-001',
          description: 'Consulting services',
          quantity: 10,
          unitPrice: 150,
          totalPrice: 1500
        },
        {
          id: 'LI-002',
          description: 'Support retainer',
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500
        }
      ],
      subtotal: 2000,
      taxRate: 0.23,
      taxAmount: 460,
      totalAmount: 2460,
      notes: 'Net 14 days'
    },
    {
      id: 'INV-002',
      invoiceNumber: 'INV-2026-002',
      customerId: 'CUST-200',
      customerName: 'Contoso Ltd',
      issueDate: '2026-02-01',
      dueDate: '2026-02-15',
      status: 'Paid',
      items: [
        {
          id: 'LI-003',
          description: 'Software license',
          quantity: 3,
          unitPrice: 1200,
          totalPrice: 3600
        }
      ],
      subtotal: 3600,
      taxRate: 0.23,
      taxAmount: 828,
      totalAmount: 4428,
      notes: 'Paid in full'
    }
  ];

  readonly masterColumnDefs: ColDef<Invoice>[] = [
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
    { field: 'invoiceNumber', headerName: 'Invoice', minWidth: 140 },
    { field: 'customerName', headerName: 'Customer', minWidth: 160 },
    { field: 'status', minWidth: 100 },
    { field: 'issueDate', headerName: 'Issued', minWidth: 120 },
    { field: 'dueDate', headerName: 'Due', minWidth: 120 },
    { field: 'totalAmount', headerName: 'Total', minWidth: 120, valueFormatter: params => `$${params.value}` },
    { field: '_matchMode', headerName: 'Match Mode', minWidth: 120 }
  ];

  readonly detailColumnDefs: ColDef<InvoiceLineItem>[] = [
    { field: 'description', headerName: 'Description', minWidth: 220 },
    { field: 'quantity', minWidth: 100 },
    { field: 'unitPrice', headerName: 'Unit Price', minWidth: 120 },
    { field: 'totalPrice', headerName: 'Total Price', minWidth: 120 }
  ];

  readonly masterDefaultColDef: ColDef<Invoice> = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: false,
    suppressMenu: true
  };

  readonly detailDefaultColDef: ColDef<InvoiceLineItem> = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: false,
    suppressMenu: true
  };

  readonly searchSetup = createMasterDetailSearchSetup(
    this.invoices,
    invoiceSearchConfig,
    this.searchService,
    this.searchIndexService,
    row => this.getVisibleDetailRows(row),
    row => row?.items ?? [],
    row => row.id,
    this.masterColumnDefs,
    this.detailColumnDefs,
    this.masterDefaultColDef,
    this.detailDefaultColDef
  );

  readonly gridOptions: GridOptions<Invoice> = this.searchSetup.gridOptions;

  constructor() {
    this.searchIndexService.rebuildSearchIndex(this.invoices, invoiceSearchConfig);
  }

  onSearchInput(value: string) {
    this.searchSetup.onSearchInput(value);
  }

  clearSearch() {
    this.searchSetup.clearSearch();
  }

  private getVisibleDetailRows(invoice: Invoice | undefined): InvoiceLineItem[] {
    if (!invoice) {
      return [];
    }

    const searchText = this.searchService.normalizedText();
    const matchInfo = this.searchIndexService.getMatchInfo(invoice, searchText, invoiceSearchConfig);

    if (!searchText || matchInfo.matchMode !== 'child-only') {
      return [...invoice.items];
    }

    return [...(matchInfo.matchingChildren ?? [])];
  }
}
