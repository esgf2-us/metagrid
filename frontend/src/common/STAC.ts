/* eslint-disable @typescript-eslint/naming-convention */
import { RawProject } from '../components/Facets/types';
import {
  StacFeature,
  RawSearchResult,
  StacAsset,
  StacAggregations,
} from '../components/Search/types';

export const STAC_PROJECTS: RawProject[] = [
  {
    pk: '10',
    name: 'CMIP6 STAC',
    projectName: 'CMIP6',
    facetsUrl: 'offset=0&limit=0',
    fullName: 'Coupled Model Intercomparison Project Phase 6',
    projectUrl: 'https://pcmdi.llnl.gov/CMIP6/',
    facetsByGroup: {
      General: ['activity_id', 'mip_era'],
      Identifiers: [
        'source_id',
        'source_type',
        'instance_id',
        'institution_id',
        'experiment_id',
        'sub_experiment_id',
      ],
      Labels: ['variant_label', 'grid_label'],
      Classifications: ['table_id', 'frequency', 'variable_id', 'cf_standard_name'],
    },
    isSTAC: true,
  },
];

/** This mapping is necessary in most cases since the facet names
 * are prepended with the project name for CMIP6
 */
export const STAC_PROJECT_FACET_MAPPING: { [key: string]: Record<string, string> } = {
  CMIP6: {
    activity_id: 'properties.cmip6:activity_id',
    data_specs_version: 'properties.cmip6:data_specs_version',
    mip_era: 'properties.cmip6:mip_era',
    grid: 'properties.cmip6:grid',
    source_id: 'properties.cmip6:source_id',
    source_type: 'properties.cmip6:source_type',
    instance_id: 'properties.instance_id',
    institution_id: 'properties.cmip6:institution_id',
    experiment_id: 'properties.cmip6:experiment_id',
    sub_experiment_id: 'properties.cmip6:sub_experiment_id',
    variant_label: 'properties.cmip6:variant_label',
    grid_label: 'properties.cmip6:grid_label',
    experiment_title: 'properties.experiment',
    table_id: 'properties.cmip6:table_id',
    frequency: 'properties.cmip6:frequency',
    variable_id: 'properties.cmip6:variable_id',
    cf_standard_name: 'properties.cf_standard_name',
    variable_units: 'properties.variable_units',
  },
};

export const STAC_AGGREGATION_FACETS: { [key: string]: string[] } = {
  // Values taken from 'aggregations' list : https://api.stac.esgf.ceda.ac.uk/collections/CMIP6
  CMIP6: [
    'cmip6_activity_id_frequency',
    'cmip6_data_specs_version_frequency',
    'cmip6_frequency_frequency',
    'cmip6_further_info_url_frequency',
    'cmip6_grid_frequency',
    'cmip6_grid_label_frequency',
    'cmip6_institution_id_frequency',
    'cmip6_mip_era_frequency',
    'cmip6_source_id_frequency',
    'cmip6_source_type_frequency',
    'cmip6_experiment_id_frequency',
    'cmip6_sub_experiment_id_frequency',
    'cmip6_nominal_resolution_frequency',
    'cmip6_table_id_frequency',
    'cmip6_variable_id_frequency',
    'cmip6_variant_label_frequency',
    'cmip6_realm_frequency',
    // 'cmip6_Conventions_frequency',
    'cmip6_experiment_frequency',
    // 'cmip6_forcing_index_frequency', These caused a 500 error
    // 'cmip6_initialization_index_frequency', These caused a 500 error
    // 'cmip6_realization_index_frequency', These caused a 500 error
    // 'cmip6_physics_index_frequency', These caused a 500 error
    // 'cmip6_institution_frequency',
    // 'cmip6_license_frequency',
    // 'cmip6_source_frequency',
    'cmip6_sub_experiment_frequency',
    // 'cmip6_tracking_id_frequency',
  ],
};

export const aggregationsToFacetsData = (
  aggregations: StacAggregations,
): {
  [x: string]: [string, number][];
} => {
  const facetsData: { [x: string]: [string, number][] } = {};
  aggregations.aggregations.forEach((aggregation) => {
    const facetName = aggregation.name.replace('cmip6_', '').replace('_frequency', '');
    const facetValues = aggregation.buckets.map(
      (bucket) => [bucket.key, bucket.frequency] as [string, number],
    );
    facetsData[facetName] = facetValues;
  });
  return facetsData;
};

export const convertStacToRawSearchResult = (stacResult: StacFeature): RawSearchResult => {
  const { id, assets, bbox, geometry, links, properties, stac_version, type } = stacResult;
  const { access, citation_url, further_info_url, version } = properties;

  const numberOfFiles = Object.keys(assets).filter((key) => key !== 'globus').length;
  const size = Object.values(assets).reduce((acc, asset) => acc + (asset['file:size'] || 0), 0);

  const updatedAssets: {
    [name: string]: StacAsset;
  } = {};
  Object.entries(assets).forEach(([key, value]) => {
    // Sometimes the asset has no name, title or id, in which case we'll use the key as a fallback
    updatedAssets[key] = { ...value, id: value.name || value.title || key, access };
  });

  const result: RawSearchResult = {
    id,
    master_id: id,
    access,
    assets: updatedAssets,
    bbox,
    citation_url: citation_url ? [citation_url] : undefined,
    further_info_url: [further_info_url],
    geometry,
    links,
    number_of_files: numberOfFiles,
    version,
    properties,
    stac_version,
    type,
    size,
    isStac: true,
  };
  if (assets && assets.globus) {
    result.globus_link = assets.globus.href;
  }
  return result;
};

export const createEqualsFilter = (
  key: string,
  value: unknown,
): { op: string; args: unknown[] } => {
  return {
    op: '=',
    args: [{ property: key }, value],
  };
};

export const createAndFilter = (
  filters: { op: string; args: unknown[] }[],
): { op: string; args: unknown[] } => {
  return {
    op: 'and',
    args: filters,
  };
};

export const createOrFilter = (
  filters: { op: string; args: unknown[] }[],
): { op: string; args: unknown[] } => {
  return {
    op: 'or',
    args: filters,
  };
};

export const convertSearchParamsIntoStacFilter = (
  reqUrlStr: string,
  projectName: string | undefined,
): { op: string; args: unknown } | undefined => {
  const params: URLSearchParams = new URLSearchParams(reqUrlStr.split('?')[1] || '');

  const paramKeys = Array.from(params.keys());

  const stacProject =
    STAC_PROJECTS.find((project) => project.projectName === projectName) || STAC_PROJECTS[0];
  const facetsByGroup = stacProject.facetsByGroup as Record<string, string[]>;
  const allFacets: string[] = Object.values(facetsByGroup).flat();
  const validParams = paramKeys.filter((key) => allFacets.includes(key));

  // Create a filter if there are valid params
  if (validParams.length > 0) {
    // If there are more than one valid params, create an AND filter between each
    if (validParams.length > 1) {
      return createAndFilter(
        validParams.map((param) => {
          const values = params.get(param)?.split(',') || [];
          const mappedParam = STAC_PROJECT_FACET_MAPPING.CMIP6[param] || param;
          if (values.length > 1) {
            // If there are multiple values for a parameter, create an OR filter
            return createOrFilter(values.map((value) => createEqualsFilter(mappedParam, value)));
          }
          return createEqualsFilter(mappedParam, values[0]);
        }),
      );
    }

    const param = validParams[0];
    const mappedParam = STAC_PROJECT_FACET_MAPPING.CMIP6[param] || param;
    const values = params.get(param)?.split(',') || [];

    if (values.length > 1) {
      // If there are multiple values for a parameter, create an OR filter
      return createOrFilter(values.map((value) => createEqualsFilter(mappedParam, value)));
    }
    return createEqualsFilter(mappedParam, values[0]);
  }

  return { op: '=', args: [{ property: 'properties.retracted' }, false] };
};
