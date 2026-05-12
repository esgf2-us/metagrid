import { useEffect, useState } from 'react';
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
    General: [
      // { title: 'data_node', facet: 'alternate_name' }
    ],
    Identifiers: [
      'activity_id',
      'source_id',
      'source_type',
      // 'instance_id',
      'institution_id',
      'experiment_id',
      'sub_experiment_id',
    ],
    Labels: ['variant_label', 'grid_label'],
    Classifications: [
      'frequency',
      'variable_id',
      // { title: 'cf_standard_name', facet: 'variable_cf_standard_name' },
    ],
  },
};

export const STAC_PROJECT_LIST: StacProject[] = [
  {
    name: 'CMIP6 STAC',
    projectName: 'CMIP6',
    fullName: 'Coupled Model Intercomparison Project Phase 6',
    projectUrl: 'https://pcmdi.llnl.gov/CMIP6/',
    facetsByGroup: {
      General: ['mip_era'],
      Classifications: ['table_id'],
    },
  },
  {
    name: 'CMIP7',
    projectName: 'CMIP7',
    fullName: 'Coupled Model Intercomparison Project Phase 7',
    projectUrl: 'https://WCRP_CMIP.org/CMIP7',
    facetsByGroup: {
      General: ['mip_era'],
      Classifications: [
        'table_id',
        { title: 'variable_suffix', facet: 'variable_branding_suffix' },
      ],
      Labels: ['area_label', 'vertical_label', 'temporal_label', 'horizontal_label'],
    },
  },
];

/**
 * Configuration for customizing the projects displayed in the ProjectForm dropdown.
 */
export interface ProjectsConfig {
  /**
   * Additional projects to include in the dropdown.
   * These are added to projects fetched from the backend database.
   * Projects are defined using the StacProject structure and will be built into full project objects.
   */
  additionalProjects?: StacProject[];
  /**
   * Array of project names to show in the dropdown.
   * When specified, ONLY these projects will be displayed.
   * If empty or omitted, all projects are shown (except those in the blacklist).
   */
  whitelist?: string[];
  /**
   * Array of project names to hide from the dropdown.
   * Ignored if whitelist is specified.
   */
  blacklist?: string[];
}

const DEFAULT_CONFIG: ProjectsConfig = {
  additionalProjects: [],
  whitelist: [],
  blacklist: [],
};

export const useProjectsConfig = () => {
  const [config, setConfig] = useState<ProjectsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/projects/projects.json')
      .then((response) => {
        if (!response.ok) {
          // File not found or other HTTP error - use defaults
          setConfig(DEFAULT_CONFIG);
          setLoading(false);
          return null;
        }
        return response.json() as Promise<ProjectsConfig>;
      })
      .then((data: ProjectsConfig | null) => {
        if (data) {
          setConfig({
            additionalProjects: data.additionalProjects || [],
            whitelist: data.whitelist || [],
            blacklist: data.blacklist || [],
          });
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        // eslint-disable-next-line no-console
        console.warn('Failed to load projects.json, using defaults:', err);
        setConfig(DEFAULT_CONFIG);
        setLoading(false);
      });
  }, []);

  return { config, loading };
};
