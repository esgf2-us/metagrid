import { StacAggregations, StacFeature } from '../components/Search/types';
import {
  aggregationsToFacetsData,
  convertStacToRawSearchResult,
  createEqualsFilter,
  createAndFilter,
  createOrFilter,
  convertSearchParamsIntoStacFilter,
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
      },
      assets: {
        data: { href: 'https://example.org/file.nc', 'file:size': 1024, name: 'data' },
        thumb: { href: 'https://example.org/thumb.png', 'file:size': 0, title: 'thumb' },
        globus: { href: 'globus://endpoint/collection', 'file:size': 0, name: 'globus' },
      },
    } as unknown as StacFeature;

    const res = convertStacToRawSearchResult(stacFeature);
    expect(res.id).toBe('test-item');
    expect(res.assets).toBeDefined();
    expect(Object.keys(res.assets || {})).toContain('data');
    // number_of_files excludes 'globus' asset
    expect(res.number_of_files).toBe(2);
    // size should be sum of file:size values (1024 + 0)
    expect(res.size).toBe(1024);
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
});
