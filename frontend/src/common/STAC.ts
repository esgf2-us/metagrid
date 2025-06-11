/* eslint-disable @typescript-eslint/naming-convention */
import { RawProject } from '../components/Facets/types';
import { StacFeature, RawSearchResult, StacAsset } from '../components/Search/types';

// export const checkIsStac = (stac: SearchResults | RawSearchResult | undefined): boolean => {
//   if (!stac) {
//     return false;
//   }
//   console.log('This is stac');
//   console.log(stac);
//   return Object.hasOwn(stac, 'stac_version') || Object.hasOwn(stac, 'stac');
// };

export const convertStacToRawSearchResult = (stacResult: StacFeature): RawSearchResult => {
  const { id, assets, bbox, geometry, links, properties, stac_version, type } = stacResult;
  const { access, citation_url, further_info_url, version } = properties;

  const numberOfFiles = Object.keys(assets).filter((key) => key !== 'globus').length;

  const updatedAssets: {
    [name: string]: StacAsset;
  } = {};
  Object.entries(assets).forEach(([key, value]) => {
    updatedAssets[key] = { ...value, id: value.name, access };
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
  };
  if (assets && assets.globus) {
    result.globus_link = assets.globus.href;
  }
  return result;
};

export const STAC_PROJECTS: RawProject[] = [
  {
    pk: '10',
    name: 'CMIP6 STAC',
    facetsUrl: '.language=en',
    fullName: 'Coupled Model Intercomparison Project Phase 6',
    projectUrl: 'https://pcmdi.llnl.gov/CMIP6/',
    facetsByGroup: {
      General: ['activity_id', 'data_specs_version', 'mip_era', 'grid'],
      Identifiers: [
        'source_id',
        'source_type',
        'instance_id',
        'institution_id',
        'source_type',
        'experiment_id',
        'sub_experiment_id',
      ],
      Labels: ['variant_label', 'grid_label', 'experiment_title'],
      Classifications: [
        'table_id',
        'frequency',
        'variable_id',
        'cf_standard_name',
        'variable_units',
      ],
    },
    isSTAC: true,
  },
];
