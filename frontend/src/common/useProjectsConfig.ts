import { useEffect, useState } from 'react';
import { FacetsByGroup } from '../components/Facets/types';

export type StacProject = {
  name: string;
  fullName: string;
  projectUrl: string;
  projectName: string;
  facetsByGroup: FacetsByGroup;
  stacApiUrl?: string;
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

// In-memory cache for projects.json to prevent duplicate fetches
const projectsJsonCache: {
  promise?: Promise<ProjectsConfig | null>;
  result?: ProjectsConfig;
  timestamp?: number;
} = {};

const PROJECTS_JSON_CACHE_TTL = 60000; // 1 minute

/**
 * Fetches projects.json with in-memory caching to prevent duplicate requests.
 * This helps avoid redundant network calls on page refresh or component re-mounts.
 */
const fetchProjectsJson = (): Promise<ProjectsConfig | null> => {
  const now = Date.now();

  // Return cached result if still valid
  if (
    projectsJsonCache.result &&
    projectsJsonCache.timestamp &&
    now - projectsJsonCache.timestamp < PROJECTS_JSON_CACHE_TTL
  ) {
    return Promise.resolve(projectsJsonCache.result);
  }

  // Return in-flight promise if already fetching
  if (projectsJsonCache.promise) {
    return projectsJsonCache.promise;
  }

  // Start new fetch and cache the promise
  projectsJsonCache.promise = fetch('/projects/projects.json', {
    cache: 'no-cache',
  })
    .then((response) => {
      if (!response.ok) {
        // File not found or other HTTP error - use defaults
        return null;
      }
      return response.json() as Promise<ProjectsConfig>;
    })
    .then((data: ProjectsConfig | null) => {
      // Cache the result
      projectsJsonCache.result = data || DEFAULT_CONFIG;
      projectsJsonCache.timestamp = Date.now();
      projectsJsonCache.promise = undefined;
      return data;
    })
    .catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.warn('Failed to load projects.json, using defaults:', err);
      projectsJsonCache.result = DEFAULT_CONFIG;
      projectsJsonCache.timestamp = Date.now();
      projectsJsonCache.promise = undefined;
      return null;
    });

  return projectsJsonCache.promise;
};

export const useProjectsConfig = () => {
  const [config, setConfig] = useState<ProjectsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsJson()
      .then((data: ProjectsConfig | null) => {
        if (data) {
          setConfig({
            additionalProjects: data.additionalProjects || [],
            whitelist: data.whitelist || [],
            blacklist: data.blacklist || [],
          });
        } else {
          setConfig(DEFAULT_CONFIG);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback to defaults if promise rejects
        setConfig(DEFAULT_CONFIG);
        setLoading(false);
      });
  }, []);

  return { config, loading };
};
