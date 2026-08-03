# Search Box Event Flow

When the user types in the search box, the following sequence happens:

1. `input` event fires on the `<input>` element.
2. Angular calls `onSearchChange($event.target.value)` from `app.component.html`.
3. `onSearchChange()` updates `currentFilterText`:
   - trims the text
   - converts it to lowercase
4. `onSearchChange()` then iterates every `rowData` parent:
   - if the filter text is empty, clears `data._matchingChildren`
   - otherwise builds `data._matchingChildren` from child rows whose `name` or `description` contain the search text
5. `this.gridApi.onFilterChanged()` is called.
6. AG Grid re-evaluates the external filter:
   - `isExternalFilterPresent()` returns true if `currentFilterText` exists
   - `doesExternalFilterPass(node)` runs for each parent row
     - parent passes if parent fields match
     - or if any child row matches
7. The grid redraws rows based on filter results:
   - matched parents stay visible
   - parents with no parent match and no child matches are hidden
8. A `setTimeout(() => { ... }, 0)` runs after the filter update:
   - iterates `gridApi.forEachNode(...)`
   - computes whether each parent row should be expanded
   - calls `node.setExpanded(...)` for rows with matching children
9. If a parent row expands, AG Grid renders the detail panel:
   - `getDetailRowData(params)` uses `params.data._matchingChildren` when present
   - detail grid shows only the filtered child rows
10. When the nested detail grid first renders, `detailGridOptions.onFirstDataRendered` calls `this.gridApi?.onRowHeightChanged()` to recalc row heights.
