import {
  CatalogSearchIndexService,
  SearchableCatalogEntry,
  SearchableCatalogDetail
} from './catalog-search-index.service';

describe('CatalogSearchIndexService', () => {
  let service: CatalogSearchIndexService;

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
  });

  it('builds parent and detail haystacks using normalized text and null separators', () => {
    const entry = createEntry();

    service.rebuildSearchIndex([entry]);

    expect(entry._parentHaystack).toContain('cat-1001');
    expect(entry._parentHaystack).toContain('\0');
    expect(entry._parentHaystack).not.toContain('  ');
    expect(entry.catalogDetails[0]._detailHaystack).toContain('approved');
    expect(entry.catalogDetails[0]._detailHaystack).toContain('\0');
  });

  it('returns none when search text is empty', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry]);

    const match = service.getMatchInfo(entry, '');

    expect(match.matchMode).toBe('none');
    expect(match.matchingChildren).toBeUndefined();
  });

  it('returns parent-only when only parent haystack matches', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry]);

    const match = service.getMatchInfo(entry, 'chg-24001');

    expect(match.matchMode).toBe('parent-only');
    expect(match.matchingChildren).toBeUndefined();
  });

  it('returns child-only and matching children subset when only detail haystack matches', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry]);

    const match = service.getMatchInfo(entry, 'team b');

    expect(match.matchMode).toBe('child-only');
    expect(match.matchingChildren?.length).toBe(1);
    expect(match.matchingChildren?.[0].fieldChanged).toBe('owner');
  });

  it('returns both when parent and detail haystacks match', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry]);

    const match = service.getMatchInfo(entry, 'approved');

    expect(match.matchMode).toBe('both');
    expect(match.matchingChildren).toBeUndefined();
  });

  it('re-indexes when force is true and keeps cached index when force is false', () => {
    const entry = createEntry();
    service.rebuildSearchIndex([entry]);

    const firstHaystack = entry._parentHaystack;
    entry.status = 'Rejected';
    service.ensureIndexed(entry, false);

    expect(entry._parentHaystack).toBe(firstHaystack);

    service.ensureIndexed(entry, true);

    expect(entry._parentHaystack).toContain('rejected');
  });
});
