import { describe, expect, it } from 'vitest';
import {
  searchAlreadyExists,
  searchesMatch,
  cacheStacBatches,
  getCachedStacBatches,
  clearCachedStacBatches,
  identifyProblematicFacets,
  cacheSearchResults,
  clearCachedSearchResults,
  getCachedSearchResults,
} from './searchHelpers';
import { UserSearchQueries, UserSearchQuery } from '../Cart/types';
import { ActiveSearchQuery } from './types';
import { activeSearchQueryFixture, rawProjectFixture } from '../../test/mock/fixtures';
import { tempStorageGetMock } from '../../test/mock/mockStorage';
import { convertObjectToHash } from '../../common/utils';

describe('Test cacheSearchResults, getCachedSearchResults, and clearCachedSearchResults', () => {
  const results = { response: { docs: [], numFound: 0 } };
  const pagination = { page: 1, pageSize: 10 };
  const cachedURL = 'http://test.com';

  afterEach(() => {
    clearCachedSearchResults();
  });

  it('caches and retrieves search results', () => {
    cacheSearchResults(results, pagination, cachedURL);
    const cached = getCachedSearchResults();
    expect(cached.cachedURL).toBe(cachedURL);
    expect(cached.response).toBeDefined();
  });

  it('clears cached search results', () => {
    cacheSearchResults(results, pagination, cachedURL);
    clearCachedSearchResults();
    expect(getCachedSearchResults()).toEqual({});
  });

  it('clears cache when expired', () => {
    cacheSearchResults(results, pagination, cachedURL);

    // Expect the cache to be set
    expect(tempStorageGetMock('cachedSearchResults')).toBeTruthy();

    // Simulate time passing
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60 * 60 * 2000); // Move time forward by 2 hours
    const cached = getCachedSearchResults();
    expect(cached).toEqual({});

    // Should also remove from localStorage
    const cachedItem = tempStorageGetMock('cachedSearchResults');
    expect(cachedItem).toBeUndefined();
  });
});

describe('Test identifyProblematicFacets', () => {
  it('should identify new facets that were not in last successful query', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'],
        facet2: ['value3'], // New facet
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet2:value3')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should identify new values in existing facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // Added value2
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet1:value2')).toBe(true);
    expect(problematic.has('facet1:value1')).toBe(false); // value1 was in successful query
    expect(problematic.size).toBe(1);
  });

  it('should identify multiple problematic facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // New value
        facet2: ['value3'], // New facet
        facet3: ['value4', 'value5'], // New facet with multiple values
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet1:value2')).toBe(true);
    expect(problematic.has('facet2:value3')).toBe(true);
    expect(problematic.has('facet3:value4')).toBe(true);
    expect(problematic.has('facet3:value5')).toBe(true);
    expect(problematic.size).toBe(4);
  });

  it('should return empty set when there are no problematic facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // Same as successful query
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.size).toBe(0);
  });

  it('should return empty set when lastSuccessfulQuery is null', () => {
    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, null);

    expect(problematic.size).toBe(0);
  });

  it('should handle removed facets (should not mark as problematic)', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
        facet2: ['value2'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'], // facet2 removed
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Removing facets shouldn't be marked as problematic
    expect(problematic.size).toBe(0);
  });

  it('should handle empty facets in current query', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {}, // All facets removed
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.size).toBe(0);
  });

  it('should handle empty facets in last successful query', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {}, // No facets
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'], // All facets are new
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet1:value1')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle facets with array of values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        experiment: ['historical'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        experiment: ['historical', 'rcp85', 'ssp585'], // Added two new values
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('experiment:rcp85')).toBe(true);
    expect(problematic.has('experiment:ssp585')).toBe(true);
    expect(problematic.has('experiment:historical')).toBe(false);
    expect(problematic.size).toBe(2);
  });

  it('should be case-sensitive when comparing facet values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['Value1'], // Different case
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Case difference should be treated as a new value
    expect(problematic.has('facet1:Value1')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle whitespace differences in facet values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: [' value1 '], // With extra whitespace
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Whitespace difference should be treated as different
    expect(problematic.has('facet1: value1 ')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle special characters in facet names and values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        'facet-with-dash': ['value.with.dots'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        'facet-with-dash': ['value.with.dots', 'value:with:colons'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet-with-dash:value:with:colons')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle complex real-world CMIP6 scenario', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      project: rawProjectFixture({ name: 'CMIP6' }),
      activeFacets: {
        source_id: ['CESM2', 'GFDL-ESM4'],
        experiment_id: ['historical'],
        variable: ['tas'],
        frequency: ['mon'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      project: rawProjectFixture({ name: 'CMIP6' }),
      activeFacets: {
        source_id: ['CESM2', 'GFDL-ESM4', 'INVALID-MODEL'], // Added invalid model
        experiment_id: ['historical', 'ssp585'], // Added new experiment
        variable: ['tas'],
        frequency: ['mon'],
        // realm removed, which is fine
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('source_id:INVALID-MODEL')).toBe(true);
    expect(problematic.has('experiment_id:ssp585')).toBe(true);
    expect(problematic.size).toBe(2);
  });

  it('should handle when current query has subset of successful facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2', 'value3'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // Subset of successful values
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Using a subset shouldn't be problematic
    expect(problematic.size).toBe(0);
  });

  it('should correctly format facet identifiers with colon separator', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {},
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        model: ['CESM2'],
        institution: ['NCAR'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Verify the format is "facetKey:facetValue"
    const problematicArray = Array.from(problematic);
    expect(problematicArray).toContain('model:CESM2');
    expect(problematicArray).toContain('institution:NCAR');
    expect(problematic.size).toBe(2);
  });

  it('should handle empty arrays for facet values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: [],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Empty array in last successful means value1 is new
    expect(problematic.has('facet1:value1')).toBe(true);
    expect(problematic.size).toBe(1);
  });
});

describe('Search Helper Functions', () => {
  describe('convertObjectToHash', () => {
    it('should generate consistent hash for same object', () => {
      const obj = { a: 1, b: 'test', c: [1, 2, 3] };
      const hash1 = convertObjectToHash(obj);
      const hash2 = convertObjectToHash(obj);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different objects', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 2, b: 'test' };
      const hash1 = convertObjectToHash(obj1);
      const hash2 = convertObjectToHash(obj2);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle complex nested objects', () => {
      const obj = {
        project: { name: 'CMIP6', pk: '123' },
        activeFacets: { model: ['CESM2'], experiment: ['historical'] },
        textInputs: [],
      };
      const hash = convertObjectToHash(obj);
      expect(typeof hash).toBe('number');
    });
  });

  describe('searchesMatch', () => {
    it('should return true for identical searches', () => {
      const search1: ActiveSearchQuery = {
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: null,
        maxVersionDate: null,
        filenameVars: [],
        activeFacets: { model: ['CESM2'] },
        textInputs: [],
        globusOnly: false,
      };

      const search2 = { ...search1 };
      expect(searchesMatch(search1, search2)).toBe(true);
    });

    it('should return false for different searches', () => {
      const search1: ActiveSearchQuery = {
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: null,
        maxVersionDate: null,
        filenameVars: [],
        activeFacets: { model: ['CESM2'] },
        textInputs: [],
        globusOnly: false,
      };

      const search2: ActiveSearchQuery = {
        ...search1,
        activeFacets: { model: ['GFDL-ESM4'] },
      };

      expect(searchesMatch(search1, search2)).toBe(false);
    });

    it('should detect version date changes', () => {
      const search1: ActiveSearchQuery = {
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: '2020-01-01',
        maxVersionDate: null,
        filenameVars: [],
        activeFacets: {},
        textInputs: [],
        globusOnly: false,
      };

      const search2: ActiveSearchQuery = {
        ...search1,
        minVersionDate: '2021-01-01',
      };

      expect(searchesMatch(search1, search2)).toBe(false);
    });
  });

  describe('searchAlreadyExists', () => {
    it('returns true if search with same uuid exists', () => {
      const existingSearches = [
        {
          uuid: '123',
          search: { project: { name: 'CMIP6' }, activeFacets: {} },
        },
        {
          uuid: '456',
          search: { project: { name: 'CMIP5' }, activeFacets: {} },
        },
      ] as unknown as UserSearchQueries;

      const newSearch = {
        uuid: '123',
        search: { project: { name: 'CMIP6' }, activeFacets: { activity_id: ['CFMIP'] } },
      } as unknown as UserSearchQuery;

      expect(searchAlreadyExists(existingSearches, newSearch)).toBe(true);
    });

    it('returns false if search does not exist', () => {
      const existingSearches = [
        {
          uuid: '123',
          search: { project: { name: 'CMIP6' }, activeFacets: {} },
        },
      ] as unknown as UserSearchQueries;

      const newSearch = {
        uuid: '789',
        search: { project: { name: 'E3SM' }, activeFacets: {} },
      } as unknown as UserSearchQuery;

      expect(searchAlreadyExists(existingSearches, newSearch)).toBe(false);
    });
  });

  // describe('STAC cache functions', () => {
  //   beforeEach(() => {
  //     // Clear localStorage before each test
  //     localStorage.clear();
  //   });

  //   it('should cache and retrieve STAC batches', () => {
  //     const stacData = {
  //       results: [{ id: '1' }, { id: '2' }],
  //       nextToken: 'token123',
  //       projectName: 'CMIP6',
  //       totalMatched: 100,
  //     };

  //     cacheStacBatches(stacData);
  //     const retrieved = getCachedStacBatches();

  //     expect(retrieved).toBeDefined();
  //     expect((retrieved as any).results).toEqual(stacData.results);
  //     expect((retrieved as any).nextToken).toBe(stacData.nextToken);
  //   });

  //   it('should return null if cache is expired', () => {
  //     const stacData = { results: [], nextToken: undefined };

  //     // Manually set an expired cache
  //     localStorage.setItem(
  //       'cachedStacBatches',
  //       JSON.stringify({
  //         batches: stacData,
  //         expires: Date.now() - 1000, // Expired 1 second ago
  //       }),
  //     );

  //     const retrieved = getCachedStacBatches();
  //     expect(retrieved).toBeNull();
  //   });

  //   it('should clear STAC batches cache', () => {
  //     const stacData = { results: [], nextToken: undefined };
  //     cacheStacBatches(stacData);

  //     expect(getCachedStacBatches()).not.toBeNull();

  //     clearCachedStacBatches();
  //     expect(localStorage.getItem('cachedStacBatches')).toBeFalsy();
  //   });
  // });
});
