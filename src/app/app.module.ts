import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { AppComponent } from './app.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { NewAppComponent } from './new-app/new-app.component';

const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: 'new-app', component: NewAppComponent },
      { path: 'invoices', component: InvoicesComponent }
    ]
  }
];

@NgModule({
  declarations: [AppComponent, NewAppComponent, InvoicesComponent],
  imports: [BrowserModule, FormsModule, AgGridModule, RouterModule.forRoot(routes)],
  bootstrap: [AppComponent]
})
export class AppModule {}
