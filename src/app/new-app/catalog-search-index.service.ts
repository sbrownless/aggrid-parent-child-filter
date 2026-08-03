import { Injectable } from '@angular/core';
import { catalogDetailModel, catalogEntryModel } from '../catalogEntry.model';

export type MatchMode = 'none' | 'parent-only' | 'child-only' | 'both';

export interface SearchableCatalogDetail extends catalogDetailModel {
  _detailHaystack?: string;
}

export interface SearchableCatalogEntry extends catalogEntryModel {
  catalogDetails: SearchableCatalogDetail[];
  _parentHaystack?: string;
  _matchMode?: MatchMode;
  _matchingChildren?: SearchableCatalogDetail[];
}

export interface SearchMatchInfo {
  matchMode: MatchMode;
  matchingChildren?: SearchableCatalogDetail[];
}

@Injectable({ providedIn: 'root' })
export class CatalogSearchIndexService {
  rebuildSearchIndex(entries: SearchableCatalogEntry[]) {
    for (const entry of entries) {
      this.ensureIndexed(entry, true);
    }
  }

  ensureIndexed(entry: SearchableCatalogEntry, force = false) {
    if (force || !entry._parentHaystack) {
      entry._parentHaystack = this.normalizeForSearch([
        entry.uniqueId,
        entry.status,
        entry.changeType,
        entry.changeTicketNumber,
        entry.createdBy,
        entry.lastUpdatedBy
      ].join('\0'));
    }

    for (const detail of entry.catalogDetails ?? []) {
      if (force || !detail._detailHaystack) {
        detail._detailHaystack = this.normalizeForSearch([
          detail.updatedBy,
          detail.fieldChanged,
          detail.originalValue,
          detail.newValue
        ].join('\0'));
      }
    }
  }

  getMatchInfo(entry: SearchableCatalogEntry, searchText: string): SearchMatchInfo {
    if (!searchText) {
      return { matchMode: 'none' };
    }

    this.ensureIndexed(entry);

    const parentMatches = !!entry._parentHaystack?.includes(searchText);

    const matchingChildren = (entry.catalogDetails ?? []).filter(detail =>
      (detail._detailHaystack ?? '').includes(searchText)
    );

    const childMatches = matchingChildren.length > 0;

    if (parentMatches && childMatches) {
      return { matchMode: 'both' };
    }

    if (parentMatches) {
      return { matchMode: 'parent-only' };
    }

    if (childMatches) {
      return { matchMode: 'child-only', matchingChildren };
    }

    return { matchMode: 'none' };
  }

  private normalizeForSearch(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}