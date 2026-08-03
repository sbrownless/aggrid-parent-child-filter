import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { AppComponent } from './app.component';
import { NewAppComponent } from './new-app/new-app.component';

const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [{ path: 'new-app', component: NewAppComponent }]
  }
];

@NgModule({
  declarations: [AppComponent, NewAppComponent],
  imports: [BrowserModule, AgGridModule, RouterModule.forRoot(routes)],
  bootstrap: [AppComponent]
})
export class AppModule {}
