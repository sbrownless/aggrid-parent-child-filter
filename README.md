# AG Grid Master/Detail Search Demo

This project demonstrates an Angular + AG Grid Enterprise master/detail screen with a signal-driven search experience.

## What This App Does

- Displays catalog entries as master rows.
- Uses AG Grid Enterprise master/detail so each master row can expand to show detail rows.
- Provides a search box under the Catalog Entries title.
- Uses Angular Signals for search state.
- Filters and expands rows based on master and detail matches.
- Uses precomputed haystacks for faster matching on larger datasets.

## Key Files

- src/app/new-app/new-app.component.ts
  - Grid setup, expansion behavior, and external filter wiring.
- src/app/new-app/new-app.component.html
  - Search input and conditional clear x button.
- src/app/new-app/catalog-search.service.ts
  - Signal-based search state service.
- src/app/new-app/search-index/catalog-search-index.service.ts
  - Haystack indexing and match-mode evaluation service.
- src/app/new-app/search-index/catalog-search-index.service.spec.ts
  - Unit tests for indexing and hit-mode behavior.

## Search State (Signals)

The search state is managed in CatalogSearchService:

- text: raw signal value for the input.
- normalizedText: trimmed + lowercase value used for matching.
- hasText: whether input currently contains non-whitespace text.

Behavior:

- Typing updates the signal via setText().
- clear() resets the signal to empty.
- The component reacts to normalizedText changes using an Angular effect.

## Event Flow

1. User types in the search box.
2. The input handler calls onSearchInput(value).
3. onSearchInput calls searchService.setText(value).
4. The signal changes and normalizedText is recomputed.
5. Component effect runs and calls applySearch(normalizedText).
6. For each master row:
   - ensureIndexed(entry) ensures haystacks exist.
   - getMatchInfo(entry, searchText) calculates hit mode and matching detail rows.
   - _matchMode and _matchingChildren are updated on the row.
7. AG Grid external filter runs:
   - No search text: all master rows pass.
   - With search text: only rows with _matchMode not equal to none pass.
8. Grid rows are collapsed first.
9. If search text exists, matched rows are expanded automatically.
10. When detail data is requested:
    - detail-only: only matching detail rows are returned.
    - master-only and both: full detail rows are returned.

## Hit-Mode Rules

The search index service returns one of four modes:

- none
  - No match in master or detail rows.
- master-only
  - Master haystack matches, detail haystack does not.
  - Master row is shown and expanded.
  - Full detail rows shown.
- detail-only
  - Master haystack does not match, detail haystack does.
  - Master row is shown and expanded.
  - Detail rows are filtered to matching rows only.
- both
  - Master and detail haystacks both match.
  - Master row is shown and expanded.
  - Full detail rows shown.

## Haystack Indexing Strategy

To reduce repeated field scanning per keystroke:

- Master rows store _parentHaystack.
- Detail rows store _detailHaystack.
- Haystacks are normalized (lowercase, collapsed whitespace, trimmed).
- Fields are joined using \0 (null separator) to avoid cross-field phrase matches.

Why \0:

- Prevents accidental phrase matches spanning two different fields.
- Keeps substring matching fast using includes().

## Data Change Handling

If row data changes at runtime:

- Call reindexAfterDataChange() in the component.
- This rebuilds haystacks and reapplies current search criteria.

## Using the Generic Search Index in a New Component

The generic search-index service can be reused in another master/detail component with minimal setup.

1. Define a search config for the new component.

```ts
const searchConfig = {
  parentSearchFields: ['id', 'status', 'owner'],
  detailSearchFields: ['fieldChanged', 'newValue', 'updatedBy'],
  detailCollectionField: 'children'
};
```

2. Make your master/detail row types compatible with the generic service.

```ts
export interface MyMasterRow extends SearchableEntry<MyDetailRow> {
  id: string;
  status: string;
  owner: string;
  children: MyDetailRow[];
}

export interface MyDetailRow extends SearchableDetail {
  fieldChanged: string;
  newValue: string;
  updatedBy: string;
}
```

3. Inject the search services in the new component and rebuild the index when the data is loaded.

```ts
constructor(
  private readonly searchService: CatalogSearchService,
  private readonly searchIndexService: CatalogSearchIndexService
) {
  this.searchIndexService.rebuildSearchIndex(this.rowData, searchConfig);
}
```

4. Compute the visible detail rows for each master row using the match result.

```ts
private getVisibleDetailRows(row: MyMasterRow | undefined) {
  if (!row) {
    return [];
  }

  const searchText = this.searchService.normalizedText();
  const matchInfo = this.searchIndexService.getMatchInfo(row, searchText, searchConfig);

  if (!searchText || matchInfo.matchMode !== 'child-only') {
    return [...row.children];
  }

  return [...(matchInfo.matchingChildren ?? [])];
}
```

5. Use that method from the AG Grid master/detail detail callback.

```ts
this.gridOptions = {
  masterDetail: true,
  detailCellRendererParams: {
    refreshStrategy: 'everything',
    getDetailRowData: params => {
      const row = params.data as MyMasterRow | undefined;
      params.successCallback(this.getVisibleDetailRows(row));
    }
  }
};
```

The main idea is that you only need to change the search config and the row shape for a new component. The matching engine and the detail-row visibility behavior remain reusable.

## Build and Test

Install dependencies:

- npm install

Run development server:

- npm start

Build:

- npm run build

Run unit tests (headless):

- npm run test -- --watch=false --browsers=ChromeHeadless

## Notes

- AG Grid Enterprise is enabled in the component with import 'ag-grid-enterprise'.
- Angular cache and generated folders are ignored via .gitignore and hidden in workspace settings.
