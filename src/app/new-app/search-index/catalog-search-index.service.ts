import { Injectable } from '@angular/core';
import { catalogDetailModel, catalogEntryModel } from '../../catalogEntry.model';

export type MatchMode = 'none' | 'parent-only' | 'child-only' | 'both';

export interface SearchableDetail {
  _detailHaystack?: string;
}

export interface SearchableEntry<TDetail extends SearchableDetail = SearchableDetail> {
  _parentHaystack?: string;
  _matchMode?: MatchMode;
  _matchingChildren?: TDetail[];
}

export interface SearchIndexConfig<
  TEntry extends SearchableEntry<TDetail>,
  TDetail extends SearchableDetail
> {
  parentSearchFields: ReadonlyArray<keyof TEntry>;
  detailSearchFields: ReadonlyArray<keyof TDetail>;
  detailCollectionField?: keyof TEntry;
  getDetails?: (entry: TEntry) => TDetail[] | null | undefined;
}

export interface SearchableCatalogDetail extends catalogDetailModel {
  _detailHaystack?: string;
}

export interface SearchableCatalogEntry extends catalogEntryModel, SearchableEntry<SearchableCatalogDetail> {
  catalogDetails: SearchableCatalogDetail[];
}

export interface SearchMatchInfo<TDetail extends SearchableDetail = SearchableDetail> {
  matchMode: MatchMode;
  matchingChildren?: TDetail[];
}

@Injectable({ providedIn: 'root' })
export class CatalogSearchIndexService {
  rebuildSearchIndex<
    TEntry extends SearchableEntry<TDetail>,
    TDetail extends SearchableDetail
  >(entries: TEntry[], config: SearchIndexConfig<TEntry, TDetail>) {
    this.validateConfig(config);

    for (const entry of entries) {
      this.ensureIndexed(entry, config, true);
    }
  }

  ensureIndexed<
    TEntry extends SearchableEntry<TDetail>,
    TDetail extends SearchableDetail
  >(entry: TEntry, config: SearchIndexConfig<TEntry, TDetail>, force = false) {
    this.validateConfig(config);

    if (force || !entry._parentHaystack) {
      entry._parentHaystack = this.buildHaystack(entry, config.parentSearchFields);
    }

    const details = this.readDetails(entry, config);
    for (const detail of details) {
      if (force || !detail._detailHaystack) {
        detail._detailHaystack = this.buildHaystack(detail, config.detailSearchFields);
      }
    }
  }

  getMatchInfo<
    TEntry extends SearchableEntry<TDetail>,
    TDetail extends SearchableDetail
  >(entry: TEntry, searchText: string, config: SearchIndexConfig<TEntry, TDetail>): SearchMatchInfo<TDetail> {
    if (!searchText) {
      return { matchMode: 'none' };
    }

    this.ensureIndexed(entry, config);

    const parentMatches = !!entry._parentHaystack?.includes(searchText);

    const matchingChildren = this.readDetails(entry, config).filter(detail =>
      (detail._detailHaystack ?? '').includes(searchText)
    );

    const childMatches = matchingChildren.length > 0;

    if (parentMatches && childMatches) {
      return { matchMode: 'both', matchingChildren };
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

  private buildHaystack<TItem extends object>(item: TItem, fields: ReadonlyArray<keyof TItem>): string {
    const values = fields.map(field => this.coerceToSearchValue(item[field]));
    return this.normalizeForSearch(values.join('\0'));
  }

  private readDetails<
    TEntry extends SearchableEntry<TDetail>,
    TDetail extends SearchableDetail
  >(entry: TEntry, config: SearchIndexConfig<TEntry, TDetail>): TDetail[] {
    if (config.getDetails) {
      return config.getDetails(entry) ?? [];
    }

    if (!config.detailCollectionField) {
      return [];
    }

    const value = entry[config.detailCollectionField] as unknown;
    return Array.isArray(value) ? (value as TDetail[]) : [];
  }

  private coerceToSearchValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }

  private validateConfig<
    TEntry extends SearchableEntry<TDetail>,
    TDetail extends SearchableDetail
  >(config: SearchIndexConfig<TEntry, TDetail>) {
    if (!config.parentSearchFields.length) {
      throw new Error('CatalogSearchIndexService requires at least one parentSearchField.');
    }

    if (!config.detailSearchFields.length) {
      throw new Error('CatalogSearchIndexService requires at least one detailSearchField.');
    }

    if (!config.getDetails && !config.detailCollectionField) {
      throw new Error(
        'CatalogSearchIndexService requires either detailCollectionField or getDetails in SearchIndexConfig.'
      );
    }
  }
}