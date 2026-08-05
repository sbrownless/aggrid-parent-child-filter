# Search Box Event Flow

This file is a quick reference for the current new-app search behavior.
For full architecture and rationale, see [README.md](README.md).

## Runtime Sequence

1. User types in the search input in [src/app/new-app/new-app.component.html](src/app/new-app/new-app.component.html).
2. Input event calls `onSearchInput(value)` in [src/app/new-app/new-app.component.ts](src/app/new-app/new-app.component.ts).
3. `onSearchInput` delegates to `CatalogSearchService.setText(...)` in [src/app/new-app/catalog-search.service.ts](src/app/new-app/catalog-search.service.ts).
4. `normalizedText` signal recomputes (trimmed + lowercase).
5. Angular `effect(...)` in the component reacts and runs `applySearch(normalizedText)`.
6. For each parent row:
   - `CatalogSearchIndexService.ensureIndexed(...)` ensures parent/detail haystacks exist.
   - `CatalogSearchIndexService.getMatchInfo(...)` returns `none`, `parent-only`, `child-only`, or `both`.
   - Component stores `_matchMode` and `_matchingChildren` on the row.
7. AG Grid external filter is refreshed with `gridApi.onFilterChanged()`.
8. Component collapses all rows first.
9. If search text is non-empty, rows with `_matchMode !== 'none'` are auto-expanded.
10. When detail rows render, `getDetailRowData` applies this rule:
   - `child-only`: return only `_matchingChildren`.
   - `parent-only` or `both`: return full details.

## Behavior Rules

1. Empty search text:
   - all parent rows displayed
   - all parents collapsed

2. Clear x clicked:
   - search text cleared via signal service
   - all parent rows displayed
   - all parents collapsed

3. Search text present:
   - only parent rows matching parent or detail content are displayed
   - parent-only hit: expand parent, do not filter details
   - child-only hit: expand parent, filter detail rows to matches
   - both hit: expand parent, do not filter details

## Haystack Notes

1. Haystacks are precomputed for parent and detail rows in [src/app/new-app/search-index/catalog-search-index.service.ts](src/app/new-app/search-index/catalog-search-index.service.ts).
2. Text is normalized to lowercase with collapsed whitespace.
3. Fields are joined using `\0` to prevent cross-field phrase matches.
