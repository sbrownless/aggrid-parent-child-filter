/// <reference types="jasmine" />

import {
  CatalogSearchIndexService,
  SearchIndexConfig,
  SearchableCatalogEntry,
  SearchableCatalogDetail
} from './catalog-search-index.service';
import { CATALOG_SEARCH_INDEX_CONFIG } from './catalog-search-index.config';

describe('CatalogSearchIndexService', () => {
  let service: CatalogSearchIndexService;
  let config: SearchIndexConfig<SearchableCatalogEntry, SearchableCatalogDetail>;

  const baseDetails: SearchableCatalogDetail[] = [
    {
      updatedBy: 'Alice',
      fieldChanged: 'status',
      originalValue: 'Pending',
      newValue: 'Approved'
    },
    {
      updatedBy: 'Bob',
      fieldChanged: 'owner',
      originalValue: 'Team A',
      newValue: 'Team B'
    }
  ];

  const createEntry = (): SearchableCatalogEntry => ({
    uniqueId: 'CAT-1001',
    status: 'Approved',
    changeType: 'Update',
    changeTicketNumber: 'CHG-24001',
    createdBy: 'Jane',
    lastUpdatedBy: 'Ops',
    lastUpdated: new Date('2026-07-18T09:22:00'),
    catalogDetails: baseDetails.map(detail => ({ ...detail }))
  });

  beforeEach(() => {
    service = new CatalogSearchIndexService();
    config = CATALOG_SEARCH_INDEX_CONFIG;
  });

  it('builds parent and detail haystacks using normalized text and null separators', () => {
    const entry = createEntry();

    service.rebuildSearchIndex([entry], config);

    expect(entry._parentHaystack).toContain('cat-1001');
    expect(entry._parentHaystack).toContain('\0');
    expect(entry._parentHaystack).not.toContain('  ');
    expect(entry.catalogDetails[0]._detailHaystack).toContain('approved');
    expect(entry.catalogDetails[0]._detailHaystack).toContain('\0');
  });

  it('returns none when search text is empty', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry], config);

    const match = service.getMatchInfo(entry, '', config);

    expect(match.matchMode).toBe('none');
    expect(match.matchingChildren).toBeUndefined();
  });

  it('returns parent-only when only parent haystack matches', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry], config);

    const match = service.getMatchInfo(entry, 'chg-24001', config);

    expect(match.matchMode).toBe('parent-only');
    expect(match.matchingChildren).toBeUndefined();
  });

  it('returns child-only and matching children subset when only detail haystack matches', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry], config);

    const match = service.getMatchInfo(entry, 'team b', config);

    expect(match.matchMode).toBe('child-only');
    expect(match.matchingChildren?.length).toBe(1);
    expect(match.matchingChildren?.[0].fieldChanged).toBe('owner');
  });

  it('returns both when parent and detail haystacks match', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry], config);

    const match = service.getMatchInfo(entry, 'approved', config);

    expect(match.matchMode).toBe('both');
    expect(match.matchingChildren?.length).toBe(1);
    expect(match.matchingChildren?.[0].fieldChanged).toBe('status');
  });

  it('re-indexes when force is true and keeps cached index when force is false', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry], config);

    const firstHaystack = entry._parentHaystack;
    entry.status = 'Rejected';
    service.ensureIndexed(entry, config, false);

    expect(entry._parentHaystack).toBe(firstHaystack);

    service.ensureIndexed(entry, config, true);

    expect(entry._parentHaystack).toContain('rejected');
  });

  it('throws when config is missing detail collection and getDetails', () => {
    const entry = createEntry();

    expect(() =>
      service.rebuildSearchIndex<SearchableCatalogEntry, SearchableCatalogDetail>([entry], {
        parentSearchFields: ['uniqueId'],
        detailSearchFields: ['updatedBy']
      })
    ).toThrowError(/detailCollectionField or getDetails/i);
  });
});
