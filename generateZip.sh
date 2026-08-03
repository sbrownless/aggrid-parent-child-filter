mkdir -p src/app

# package.json
cat > package.json << 'EOF'
{
  "name": "angular-aggrid-parent-child",
  "version": "1.0.0",
  "scripts": {
    "start": "ng serve",
    "build": "ng build"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "ag-grid-angular": "^32.0.0",
    "ag-grid-community": "^32.0.0",
    "ag-grid-enterprise": "^32.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "typescript": "~5.3.0"
  }
}
EOF

# angular.json
cat > angular.json << 'EOF'
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "projects": {
    "angular-aggrid-parent-child": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/angular-aggrid-parent-child",
            "index": "src/index.html",
            "main": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": [
              "src/styles.css",
              "node_modules/ag-grid-community/styles/ag-grid.css",
              "node_modules/ag-grid-community/styles/ag-theme-alpine.css"
            ]
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "browserTarget": "angular-aggrid-parent-child:build"
          }
        }
      }
    }
  },
  "defaultProject": "angular-aggrid-parent-child"
}
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true
  }
}
EOF

# tsconfig.app.json
cat > tsconfig.app.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.ts"]
}
EOF

# index.html
cat > src/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AG Grid Parent Child Filter</title>
  <base href="/" />
</head>
<body>
  <app-root></app-root>
</body>
</html>
EOF

# styles.css
cat > src/styles.css << 'EOF'
html, body { height: 100%; margin: 0; }
.ag-theme-alpine { height: 100%; width: 100%; }
.search-box { margin-bottom: 10px; }
input { width: 300px; padding: 6px; font-size: 14px; }
EOF

# main.ts
cat > src/main.ts << 'EOF'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
EOF

# app.module.ts
cat > src/app/app.module.ts << 'EOF'
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AgGridModule } from 'ag-grid-angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AgGridModule.withComponents([])],
  bootstrap: [AppComponent]
})
export class AppModule {}
EOF

# app.component.ts
cat > src/app/app.component.ts << 'EOF'
import { Component } from '@angular/core';
import { GridApi, GridReadyEvent, IDetailCellRendererParams } from 'ag-grid-community';
import 'ag-grid-enterprise';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  gridApi!: GridApi;

  columnDefs = [
    { field: 'name', filter: true },
    { field: 'category', filter: true }
  ];

  childColumnDefs = [
    { field: 'name' },
    { field: 'description' }
  ];

  defaultColDef = {
    flex: 1,
    resizable: true,
    sortable: true,
    filter: true
  };

  rowData = [
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

  detailCellRendererParams: IDetailCellRendererParams = {
    detailGridOptions: {
      columnDefs: this.childColumnDefs,
      defaultColDef: { flex: 1, resizable: true }
    },
    getDetailRowData: params => {
      const matches = params.data._matchingChildren;
      params.successCallback(matches?.length ? matches : params.data.children);
    }
  };

  getSearchableParentFields() {
    return this.columnDefs.filter(col => col.filter !== false).map(col => col.field);
  }

  getSearchableChildFields() {
    return this.childColumnDefs.filter(col => col.filter !== false).map(col => col.field);
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
  }

  onSearchChange(value: string) {
    const filter = value.toLowerCase();
    const parentFields = this.getSearchableParentFields();
    const childFields = this.getSearchableChildFields();

    this.gridApi.forEachNode(node => {
      const data = node.data;

      const parentMatches = parentFields.some(field =>
        String(data[field]).toLowerCase().includes(filter)
      );

      const matchingChildren = data.children.filter(child =>
        childFields.some(field =>
          String(child[field]).toLowerCase().includes(filter)
        )
      );

      data._matchingChildren = matchingChildren;

      const passes = !filter || parentMatches || matchingChildren.length > 0;
      node.setDisplayed(passes);

      if (matchingChildren.length > 0) node.setExpanded(true);
      else if (!filter) node.setExpanded(false);
    });
  }
}
EOF

# app.component.html
cat > src/app/app.component.html << 'EOF'
<div class="search-box">
  <input type="text" placeholder="Search parent or child..." (input)="onSearchChange($event.target.value)" />
</div>

<ag-grid-angular
  class="ag-theme-alpine"
  style="width: 100%; height: 600px;"
  [rowData]="rowData"
  [columnDefs]="columnDefs"
  [defaultColDef]="defaultColDef"
  [masterDetail]="true"
  [detailCellRendererParams]="detailCellRendererParams"
  (gridReady)="onGridReady($event)"
>
</ag-grid-angular>
EOF

# app.component.css
cat > src/app/app.component.css << 'EOF'
/* empty */
EOF

# Create ZIP
zip -r angular-aggrid-parent-child.zip .
