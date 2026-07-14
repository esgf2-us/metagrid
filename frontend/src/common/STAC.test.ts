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
  getReplicaNodelsList,
  getNodesListByDownloadType,
  STAC_PROJECTS,
} from './STAC';
import { rawSearchResultFixture, stacAssetFixture } from '../test/mock/fixtures';

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

    const result = aggregationsToFacetsData('CMIP6', aggregations);
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
    const filterMulti = convertSearchParamsIntoStacFilter(urlMulti, STAC_PROJECTS[0]);
    expect(filterMulti).toEqual({
      op: 'or',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CDRMIP'] },
      ],
    });

    const urlAnd = 'https://example.com/search?activity_id=CFMIP&source_id=ACCESS-ESM1-5';
    const filterAnd = convertSearchParamsIntoStacFilter(urlAnd, STAC_PROJECTS[0]);
    expect(filterAnd).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '=', args: [{ property: 'properties.cmip6:source_id' }, 'ACCESS-ESM1-5'] },
      ],
    });
  });

  it('convertSearchParamsIntoStacFilter handles multiple facets with multiple values', () => {
    // Test case where we have multiple facets AND one of them has multiple values
    // This covers line 234 in STAC.ts where values.length > 1 inside validFacets.length > 1
    const urlMultiFacetsMultiValues =
      'https://example.com/search?activity_id=CFMIP,CDRMIP&source_id=ACCESS-ESM1-5,CESM2';
    const filter = convertSearchParamsIntoStacFilter(urlMultiFacetsMultiValues, STAC_PROJECTS[0]);
    expect(filter).toEqual({
      op: 'and',
      args: [
        {
          op: 'or',
          args: [
            { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
            { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CDRMIP'] },
          ],
        },
        {
          op: 'or',
          args: [
            { op: '=', args: [{ property: 'properties.cmip6:source_id' }, 'ACCESS-ESM1-5'] },
            { op: '=', args: [{ property: 'properties.cmip6:source_id' }, 'CESM2'] },
          ],
        },
      ],
    });
  });

  it('convertSearchParamsIntoStacFilter handles version parameters', () => {
    const urlMinVersion = 'https://example.com/search?activity_id=CFMIP&min_version=20200101';
    const filterMin = convertSearchParamsIntoStacFilter(urlMinVersion, STAC_PROJECTS[0]);
    expect(filterMin).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '>=', args: [{ property: 'version' }, '20200101'] },
      ],
    });

    const urlMaxVersion = 'https://example.com/search?activity_id=CFMIP&max_version=20220101';
    const filterMax = convertSearchParamsIntoStacFilter(urlMaxVersion, STAC_PROJECTS[0]);
    expect(filterMax).toEqual({
      op: 'and',
      args: [
        { op: '=', args: [{ property: 'properties.cmip6:activity_id' }, 'CFMIP'] },
        { op: '<=', args: [{ property: 'version' }, '20220101'] },
      ],
    });

    const urlBothVersions = 'https://example.com/search?min_version=20200101&max_version=20220101';
    const filterBoth = convertSearchParamsIntoStacFilter(urlBothVersions, STAC_PROJECTS[0]);
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
    const filter = convertSearchParamsIntoStacFilter(urlGlobusOnly, STAC_PROJECTS[0]);
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

  describe('getReplicaNodelsList', () => {
    it('returns data_node for non-STAC items', () => {
      const nonStacItem = rawSearchResultFixture({
        data_node: 'aims3.llnl.gov',
        isStac: false,
      });

      const nodes = getReplicaNodelsList(nonStacItem);
      expect(nodes).toEqual(['aims3.llnl.gov']);
    });

    it('returns empty array for non-STAC item without data_node', () => {
      const nonStacItem = rawSearchResultFixture({
        data_node: undefined,
        isStac: false,
      });

      const nodes = getReplicaNodelsList(nonStacItem);
      expect(nodes).toEqual([]);
    });

    it('returns nodes from STAC assets', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          asset1: stacAssetFixture({
            alternateName: 'node-a.example.com',
            'alternate:name': 'node-a.example.com',
          }),
          asset2: stacAssetFixture({
            alternateName: 'node-b.example.com',
            'alternate:name': 'node-b.example.com',
          }),
        },
      });

      const nodes = getReplicaNodelsList(stacItem);
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).toContain('node-b.example.com');
    });

    it('returns nodes from STAC asset alternates', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          asset1: stacAssetFixture({
            alternateName: 'node-a.example.com',
            'alternate:name': 'node-a.example.com',
            alternate: {
              'node-b.example.com': stacAssetFixture({
                alternateName: 'node-b.example.com',
                'alternate:name': 'node-b.example.com',
                href: 'https://node-b.example.com/file.nc',
              }),
              'node-c.example.com': stacAssetFixture({
                alternateName: 'node-c.example.com',
                'alternate:name': 'node-c.example.com',
                href: 'https://node-c.example.com/file.nc',
              }),
            },
          }),
        },
      });

      const nodes = getReplicaNodelsList(stacItem);
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).toContain('node-b.example.com');
      expect(nodes).toContain('node-c.example.com');
    });

    it('returns empty array for STAC item without assets', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: undefined,
      });

      const nodes = getReplicaNodelsList(stacItem);
      expect(nodes).toEqual([]);
    });

    it('works with StacAsset directly', () => {
      const asset = stacAssetFixture({
        alternateName: 'node-a.example.com',
        'alternate:name': 'node-a.example.com',
      });

      const nodes = getReplicaNodelsList(asset);
      expect(nodes).toContain('node-a.example.com');
    });

    it('works with StacAssetDict', () => {
      const assets = {
        asset1: stacAssetFixture({
          alternateName: 'node-a.example.com',
          'alternate:name': 'node-a.example.com',
        }),
        asset2: stacAssetFixture({
          alternateName: 'node-b.example.com',
          'alternate:name': 'node-b.example.com',
        }),
      };

      const nodes = getReplicaNodelsList(assets);
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).toContain('node-b.example.com');
    });
  });

  describe('getNodesListByDownloadType', () => {
    it('returns data_node for non-STAC items regardless of download type', () => {
      const nonStacItem = rawSearchResultFixture({
        data_node: 'aims3.llnl.gov',
        isStac: false,
      });

      expect(getNodesListByDownloadType(nonStacItem, 'wget')).toEqual(['aims3.llnl.gov']);
      expect(getNodesListByDownloadType(nonStacItem, 'Globus')).toEqual(['aims3.llnl.gov']);
      expect(getNodesListByDownloadType(nonStacItem, 'esgpull')).toEqual(['aims3.llnl.gov']);
    });

    it('returns empty array for non-STAC item without data_node', () => {
      const nonStacItem = rawSearchResultFixture({
        data_node: undefined,
        isStac: false,
      });

      expect(getNodesListByDownloadType(nonStacItem, 'wget')).toEqual([]);
      expect(getNodesListByDownloadType(nonStacItem, 'Globus')).toEqual([]);
    });

    it('returns nodes with .nc files for wget download type', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          asset1: stacAssetFixture({
            alternateName: 'node-a.example.com',
            'alternate:name': 'node-a.example.com',
            href: 'https://node-a.example.com/file.nc',
          }),
          asset2: stacAssetFixture({
            alternateName: 'node-b.example.com',
            'alternate:name': 'node-b.example.com',
            href: 'https://node-b.example.com/metadata.json',
          }),
        },
      });

      const nodes = getNodesListByDownloadType(stacItem, 'wget');
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).not.toContain('node-b.example.com');
    });

    it('returns nodes with Globus URLs for Globus download type', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          asset1: stacAssetFixture({
            alternateName: 'node-a.example.com',
            'alternate:name': 'node-a.example.com',
            href: 'https://app.globus.org/file-manager?origin_id=abc123',
          }),
          asset2: stacAssetFixture({
            alternateName: 'node-b.example.com',
            'alternate:name': 'node-b.example.com',
            href: 'https://node-b.example.com/file.nc',
          }),
        },
      });

      const nodes = getNodesListByDownloadType(stacItem, 'Globus');
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).not.toContain('node-b.example.com');
    });

    it('returns nodes from alternates for wget', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          asset1: stacAssetFixture({
            alternateName: 'node-a.example.com',
            'alternate:name': 'node-a.example.com',
            href: 'https://node-a.example.com/file.nc',
            alternate: {
              'node-b.example.com': stacAssetFixture({
                alternateName: 'node-b.example.com',
                'alternate:name': 'node-b.example.com',
                href: 'https://node-b.example.com/file.nc',
              }),
              'node-c.example.com': stacAssetFixture({
                alternateName: 'node-c.example.com',
                'alternate:name': 'node-c.example.com',
                href: 'https://node-c.example.com/metadata.json',
              }),
            },
          }),
        },
      });

      const nodes = getNodesListByDownloadType(stacItem, 'wget');
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).toContain('node-b.example.com');
      expect(nodes).not.toContain('node-c.example.com');
    });

    it('includes dedicated globus asset for Globus download type', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          globus: stacAssetFixture({
            alternateName: 'globus-node.example.com',
            'alternate:name': 'globus-node.example.com',
            href: 'https://app.globus.org/file-manager?origin_id=xyz789',
          }),
          data: stacAssetFixture({
            alternateName: 'http-node.example.com',
            'alternate:name': 'http-node.example.com',
            href: 'https://http-node.example.com/file.nc',
          }),
        },
      });

      const nodes = getNodesListByDownloadType(stacItem, 'Globus');
      expect(nodes).toContain('globus-node.example.com');
      expect(nodes).not.toContain('http-node.example.com');
    });

    it('returns all nodes for esgpull download type', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: {
          asset1: stacAssetFixture({
            alternateName: 'node-a.example.com',
            'alternate:name': 'node-a.example.com',
            href: 'https://node-a.example.com/file.nc',
          }),
          asset2: stacAssetFixture({
            alternateName: 'node-b.example.com',
            'alternate:name': 'node-b.example.com',
            href: 'https://node-b.example.com/metadata.json',
          }),
        },
      });

      const nodes = getNodesListByDownloadType(stacItem, 'esgpull');
      expect(nodes).toContain('node-a.example.com');
      expect(nodes).toContain('node-b.example.com');
    });

    it('returns empty array for STAC item without assets', () => {
      const stacItem = rawSearchResultFixture({
        isStac: true,
        assets: undefined,
      });

      expect(getNodesListByDownloadType(stacItem, 'wget')).toEqual([]);
      expect(getNodesListByDownloadType(stacItem, 'Globus')).toEqual([]);
    });
  });

  describe('generateWgetScriptSTAC with node selection', () => {
    it('filters files by selected node when string is provided', () => {
      const mockDownload = vi.fn();
      const originalDownload = global.URL.createObjectURL;
      global.URL.createObjectURL = mockDownload;

      const searchResults = [
        {
          id: 'test1',
          assets: {
            data1: {
              alternateName: 'node-a.example.com',
              'alternate:name': 'node-a.example.com',
              href: 'https://node-a.example.com/file1.nc',
              'file:size': 1024,
            },
            data2: {
              alternateName: 'node-b.example.com',
              'alternate:name': 'node-b.example.com',
              href: 'https://node-b.example.com/file2.nc',
              'file:size': 2048,
            },
          },
        },
      ] as any[];

      const result = generateWgetScriptSTAC(
        searchResults,
        'https://example.com/search',
        'node-a.example.com',
      );
      expect(result).toBe(true);

      global.URL.createObjectURL = originalDownload;
    });

    it('filters files by node map when object is provided', () => {
      const mockDownload = vi.fn();
      const originalDownload = global.URL.createObjectURL;
      global.URL.createObjectURL = mockDownload;

      const searchResults = [
        {
          id: 'test1',
          assets: {
            data1: {
              alternateName: 'node-a.example.com',
              'alternate:name': 'node-a.example.com',
              href: 'https://node-a.example.com/file1.nc',
              'file:size': 1024,
            },
            data2: {
              alternateName: 'node-b.example.com',
              'alternate:name': 'node-b.example.com',
              href: 'https://node-b.example.com/file2.nc',
              'file:size': 2048,
            },
          },
        },
        {
          id: 'test2',
          assets: {
            data3: {
              alternateName: 'node-c.example.com',
              'alternate:name': 'node-c.example.com',
              href: 'https://node-c.example.com/file3.nc',
              'file:size': 512,
            },
          },
        },
      ] as any[];

      const nodeMap = {
        test1: 'node-a.example.com',
        test2: 'node-c.example.com',
      };

      const result = generateWgetScriptSTAC(searchResults, undefined, nodeMap);
      expect(result).toBe(true);

      global.URL.createObjectURL = originalDownload;
    });

    it('includes files from alternates when node matches', () => {
      const mockDownload = vi.fn();
      const originalDownload = global.URL.createObjectURL;
      global.URL.createObjectURL = mockDownload;

      const searchResults = [
        {
          id: 'test1',
          assets: {
            data1: {
              alternateName: 'node-a.example.com',
              'alternate:name': 'node-a.example.com',
              href: 'https://node-a.example.com/file1.nc',
              'file:size': 1024,
              alternate: {
                'node-b.example.com': {
                  href: 'https://node-b.example.com/file1.nc',
                  'file:size': 1024,
                },
              },
            },
          },
        },
      ] as any[];

      const result = generateWgetScriptSTAC(
        searchResults,
        undefined,
        'node-b.example.com',
      );
      expect(result).toBe(true);

      global.URL.createObjectURL = originalDownload;
    });
  });
});
