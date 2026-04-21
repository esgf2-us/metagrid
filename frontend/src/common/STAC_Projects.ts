import { FacetsByGroup } from '../components/Facets/types';

export type StacProject = {
  name: string;
  fullName: string;
  projectUrl: string;
  projectName: string;
  facetsByGroup: FacetsByGroup;
};

export const STAC_DEFAULT_PROJECT: StacProject = {
  name: 'DEFAULT',
  projectName: '',
  fullName: '',
  projectUrl: '',
  facetsByGroup: {
    General: [{ title: 'data_node', facet: 'alternate_name' }],
    Identifiers: [
      'activity_id',
      'source_id',
      'source_type',
      'instance_id',
      'institution_id',
      'experiment_id',
      'sub_experiment_id',
    ],
    Labels: ['variant_label', 'grid_label'],
    Classifications: [
      'frequency',
      'variable_id',
      { title: 'cf_standard_name', facet: 'variable_cf_standard_name' },
    ],
  },
};

const STAC_PROJECT_LIST: StacProject[] = [
  {
    name: 'CMIP6 STAC',
    projectName: 'CMIP6',
    fullName: 'Coupled Model Intercomparison Project Phase 6',
    projectUrl: 'https://wcrp-cmip.org/cmip-phases/cmip6/',
    facetsByGroup: {
      General: ['mip_era'],
      Classifications: ['table_id'],
    },
  },
  {
    name: 'CMIP7',
    projectName: 'CMIP7',
    fullName: 'Coupled Model Intercomparison Project Phase 7',
    projectUrl: 'https://wcrp-cmip.org/cmip-phases/cmip7/',
    facetsByGroup: {
      General: ['mip_era'],
      Classifications: [
        'table_id',
        { title: 'variable_suffix', facet: 'variable_branding_suffix' },
      ],
      Labels: ['area_label', 'vertical_label', 'temporal_label', 'horizontal_label'],
    },
  },
  {
    name: 'CORDEX-CMIP6',
    projectName: 'CORDEX-CMIP6',
    fullName: 'Coordinated Regional Climate Downscaling Experiment from CMIP6',
    projectUrl: 'https://cordex.org/',
    facetsByGroup: {
      General: ['mip_era'],
      Classifications: ['domain', 'domain_id', 'version_realisation'],
      DrivingIDs: ['driving_experiment_id', 'driving_source_id',
         'driving_institution_id', 'driving_variant_label']
    },
  },
];

export default STAC_PROJECT_LIST;
