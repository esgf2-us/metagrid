import { StacAggregations, StacFeature, StacAsset } from '../components/Search/types';
import {
  aggregationsToFacetsData,
  convertStacToRawSearchResult,
  createEqualsFilter,
  createAndFilter,
  createOrFilter,
  convertSearchParamsIntoStacFilter,
  getStacGlobusHref,
  getFileCountFromSTACsearch,
  getDownloadSizeFromSTACsearch,
  generateWgetScriptSTAC,
} from './STAC';

describe('STAC utilities', () => {
  it('aggregationsToFacetsData converts aggregations to facet map', () => {
    const aggregations = {
      aggregations: [
        {
          name: 'cmip6_activity_id_frequency',
          buckets: [
            { key: 'CFMIP', frequency: 5 },
            { key: 'CDRMIP', frequency: 3 },
          ],
        },
        {
          name: 'cmip6_source_id_frequency',
          buckets: [{ key: 'ACCESS-ESM1-5', frequency: 2 }],
        },
      ],
    } as unknown as StacAggregations;

    const result = aggregationsToFacetsData(aggregations);
    expect(result.activity_id).toEqual([
      ['CFMIP', 5],
      ['CDRMIP', 3],
    ]);
    expect(result.source_id).toEqual([['ACCESS-ESM1-5', 2]]);
  });

  it('convertStacToRawSearchResult converts a StacFeature into RawSearchResult shape', () => {
    const stacFeature = {
      id: 'test-item',
      type: 'Feature',
      stac_version: '1.0.0',
      bbox: [0, 0, 1, 1],
      geometry: null,
      links: [],
      properties: {
        access: ['public'],
        citation_url: 'https://example.org/cite',
        further_info_url: 'https://example.org/info',
        version: 'v1',
        project: 'cmip6',
        'cmip6:version': '123456789',
      },
      assets: {
        data: { href: 'https://example.org/file.nc', 'file:size': 1024, name: 'data' },
        thumb: { href: 'https://example.org/thumb.png', 'file:size': 24, title: 'thumb' },
        globus: { href: 'globus://endpoint/collection', 'file:size': 0, name: 'globus' },
      },
    } as unknown as StacFeature;

    const res = convertStacToRawSearchResult(stacFeature);
    expect(res.id).toBe('test-item');
    expect(res.assets).toBeDefined();
    expect(Object.keys(res.assets || {})).toContain('data');
    // number_of_files excludes 'globus' asset
    expect(res.number_of_files).toBe(2);
    // size should be sum of file:size values (1024 + 24)
    expect(res.size).toBe(1048);
    // globus_link should be set from assets.globus.href
    expect(res.globus_link).toBe('globus://endpoint/collection');
    expect(res.isStac).toBeTruthy();
  });

  it('filter creators produce correct structures', () => {
    const eq = createEqualsFilter('properties.cmip6:activity_id', 'CFMIP');
    expect(eq).toEqual({ op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] });

    const or = createOrFilter([eq, createEqualsFilter('properties.cmip6:activity_id', 'CDRMIP')]);
    expect(or).toEqual({
      op: 'or',
      args: [eq, { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CDRMIP'] }],
    });

    const and = createAndFilter([eq, createEqualsFilter('properties.cmip6:source_id', 'ACCESS')]);
    expect(and).toEqual({
      op: 'and',
      args: [eq, { op: '=', args: [{ property: 'properties.cmip6:source_id' }, 'ACCESS'] }],
    });
  });

  it('convertSearchParamsIntoStacFilter maps query params to STAC filters (OR for multi, AND for multiple params)', () => {
    const urlMulti = 'https://example.com/search?activity_id=CFMIP,CDRMIP';
    const filterMulti = convertSearchParamsIntoStacFilter(urlMulti, 'CMIP6');
    expect(filterMulti).toEqual({
      op: 'or',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CDRMIP'] },
      ],
    });

    const urlAnd = 'https://example.com/search?activity_id=CFMIP&source_id=ACCESS-ESM1-5';
    const filterAnd = convertSearchParamsIntoStacFilter(urlAnd, 'CMIP6');
    expect(filterAnd).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '=', args: [{ property: 'properties.cmip6:source_id' }, 'ACCESS-ESM1-5'] },
      ],
    });
  });

  it('convertSearchParamsIntoStacFilter handles version parameters', () => {
    const urlMinVersion = 'https://example.com/search?activity_id=CFMIP&min_version=20200101';
    const filterMin = convertSearchParamsIntoStacFilter(urlMinVersion, 'CMIP6');
    expect(filterMin).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '>=', args: [{ property: 'version' }, '20200101'] },
      ],
    });

    const urlMaxVersion = 'https://example.com/search?activity_id=CFMIP&max_version=20220101';
    const filterMax = convertSearchParamsIntoStacFilter(urlMaxVersion, 'CMIP6');
    expect(filterMax).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '<=', args: [{ property: 'version' }, '20220101'] },
      ],
    });

    const urlBothVersions = 'https://example.com/search?min_version=20200101&max_version=20220101';
    const filterBoth = convertSearchParamsIntoStacFilter(urlBothVersions, 'CMIP6');
    expect(filterBoth).toEqual({
      op: 'and',
      args: [
        { op: '>=', args: [{ property: 'version' }, '20200101'] },
        { op: '<=', args: [{ property: 'version' }, '20220101'] },
      ],
    });
  });

  it('convertSearchParamsIntoStacFilter handles globusOnly parameter', () => {
    const urlGlobusOnly = 'https://example.com/search?activity_id=CFMIP&globusOnly=true';
    const filter = convertSearchParamsIntoStacFilter(urlGlobusOnly, 'CMIP6');
    expect(filter).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '=', args: [{ property: 'properties.access' }, 'Globus'] },
      ],
    });
  });

  it('convertStacToRawSearchResult handles StacFeature without globus asset', () => {
    const stacFeature = {
      id: 'test-no-globus',
      type: 'Feature',
      stac_version: '1.0.0',
      bbox: [0, 0, 1, 1],
      geometry: null,
      links: [],
      properties: {
        access: ['HTTPServer'],
        citation_url: 'https://example.org/cite',
        further_info_url: 'https://example.org/info',
        version: 'v2',
        project: 'cmip6',
      },
      assets: {
        data: { href: 'https://example.org/file.nc', 'file:size': 2048, name: 'data' },
      },
    } as unknown as StacFeature;

    const res = convertStacToRawSearchResult(stacFeature);
    expect(res.globus_link).toBeUndefined();
    expect(res.number_of_files).toBe(1);
    expect(res.size).toBe(2048);
  });

  it('getStacGlobusHref returns globus href when available', () => {
    const assetsWithGlobus = {
      data: { href: 'https://example.org/file.nc', 'file:size': 1024 },
      globus: { href: 'globus://endpoint/path', 'file:size': 0 },
    } as unknown as { [name: string]: StacAsset };
    expect(getStacGlobusHref(assetsWithGlobus)).toBe('globus://endpoint/path');
  });

  it('getStacGlobusHref returns null when globus is not available', () => {
    const assetsWithoutGlobus = {
      data: { href: 'https://example.org/file.nc', 'file:size': 1024 },
    } as unknown as { [name: string]: StacAsset };
    expect(getStacGlobusHref(assetsWithoutGlobus)).toBeNull();
    expect(getStacGlobusHref(undefined)).toBeNull();
  });

  it('getFileCountFromSTACsearch returns total file count from features', () => {
    const features = [
      {
        assets: {
          data1: { 'file:size': 1024 },
          data2: { 'file:size': 2048 },
          globus: { 'file:size': 0 },
        },
      },
      {
        assets: {
          data3: { 'file:size': 512 },
        },
      },
    ] as unknown as StacFeature[];

    expect(getFileCountFromSTACsearch(features)).toBe(3);
  });

  it('getDownloadSizeFromSTACsearch returns total download size from features', () => {
    const features = [
      {
        assets: {
          data1: { 'file:size': 1024 },
          data2: { 'file:size': 2048 },
          globus: { 'file:size': 0 },
        },
      },
      {
        assets: {
          data3: { 'file:size': 512 },
        },
      },
    ] as unknown as StacFeature[];

    expect(getDownloadSizeFromSTACsearch(features)).toBe(3584);
  });

  it('generateWgetScriptSTAC generates script for search results', () => {
    const mockDownload = vi.fn();
    const originalDownload = global.URL.createObjectURL;
    global.URL.createObjectURL = mockDownload;

    const searchResults = [
      {
        id: 'test1',
        assets: {
          data: { href: 'https://example.org/file1.nc', 'file:size': 1024 },
          data2: { href: 'https://example.org/file2.nc', 'file:size': 2048 },
        },
      },
      {
        id: 'test2',
        assets: {
          data: { href: 'https://example.org/file3.nc', 'file:size': 512 },
        },
      },
    ] as any[];

    const result = generateWgetScriptSTAC(searchResults, 'https://example.com/search');
    expect(result).toBe(true);

    global.URL.createObjectURL = originalDownload;
  });

  it('generateWgetScriptSTAC returns false when no valid files', () => {
    const searchResults = [
      {
        id: 'test1',
        assets: {
          globus: { href: 'globus://endpoint', 'file:size': 0 },
        },
      },
    ] as any[];

    const result = generateWgetScriptSTAC(searchResults);
    expect(result).toBe(false);
  });
});
