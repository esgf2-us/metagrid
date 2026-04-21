/* eslint-disable @typescript-eslint/naming-convention */
import { FacetsByGroup, RawProject } from '../components/Facets/types';
import {
  StacFeature,
  RawSearchResult,
  StacAsset,
  StacAggregations,
  StacAssetDict,
  isStacAsset,
} from '../components/Search/types';
import STAC_PROJECT_LIST, { STAC_DEFAULT_PROJECT, StacProject } from './STAC_Projects';
import { downloadFileForUser, formatBytes } from './utils';

// This is the pk for the first stac project assuming we have 8 non-stac projects listed before it.
const FirstStacPK = 9;

// Creates a RawProject from pk and StacProject data, using a default project
function buildStacProject(
  pk: string,
  { name, fullName, projectUrl, projectName, facetsByGroup }: StacProject,
): RawProject {
  const mergedFacetsByGroup: FacetsByGroup = {
    ...STAC_DEFAULT_PROJECT.facetsByGroup,
  };

  Object.keys(facetsByGroup).forEach((groupName) => {
    mergedFacetsByGroup[groupName] = [
      ...(mergedFacetsByGroup[groupName] ?? []),
      ...(facetsByGroup[groupName] ?? []),
    ];
  });

  return {
    ...STAC_DEFAULT_PROJECT,
    pk,
    name,
    fullName,
    facetsUrl: 'offset=0&limit=0',
    projectUrl,
    projectName,
    facetsByGroup: mergedFacetsByGroup,
    isSTAC: true,
  };
}

export const STAC_PROJECTS = STAC_PROJECT_LIST.map((project, idx) => {
  const newPK: string = `${FirstStacPK + idx}`;
  return buildStacProject(newPK, project);
});

export function getStacProject(projectName: string): RawProject {
  const stacProject = STAC_PROJECTS.find((project) => (project.projectName || '') === projectName);

  return stacProject || STAC_PROJECTS[0];
}

export function getFacetFilterName(projectName: string | undefined, facetName: string): string {
  // Exceptions defined here
  switch (facetName) {
    case 'data_node':
      return 'alternate:name';
    case 'latest':
      return 'properties.latest';
    default:
      return `properties.${projectName?.toLowerCase() || 'cmip6'}:${facetName}`;
  }
}

export function getAggregationsList(projectName: string): string[] {
  const { facetsByGroup } = getStacProject(projectName);
  return Object.values(facetsByGroup)
    .flat()
    .map((element) => {
      if (typeof element === 'string') {
        return `${projectName.toLowerCase()}_${element}_frequency`;
      }

      // Exceptions defined here
      switch (element.facet) {
        case 'alternate_name':
          return 'alternate_name_frequency';
        default:
          return `${projectName.toLowerCase()}_${element.facet}_frequency`;
      }
    });
}

export const getStacGlobusHref = (
  assets: { [name: string]: StacAsset } | undefined,
): string | null => {
  if (assets && assets.globus && assets.globus.href) {
    return assets.globus.href;
  }
  return null;
};

// Function to extract nodes from STAC assets
const getNodesFromStacAsset = (assets: StacAssetDict | StacAsset): string[] => {
  const nodesSet = new Set<string>();

  // If it's a single asset, process it
  if (isStacAsset(assets)) {
    const asset = assets;
    const name = asset.alternateName || (asset['alternate:name'] as string);
    if (name) {
      nodesSet.add(name);
    }

    // Add alternate nodes
    const alternates = asset.alternate;
    if (alternates && typeof alternates === 'object') {
      Object.keys(alternates).forEach((altKey) => nodesSet.add(altKey));
    }
  } else {
    // It's a StacAssetDict - iterate through ALL assets to collect nodes
    Object.values(assets).forEach((asset: StacAsset) => {
      const name = asset.alternateName || (asset['alternate:name'] as string);
      if (name) {
        nodesSet.add(name);
      }

      // Add alternate nodes from this asset
      const alternates = asset.alternate;
      if (alternates && typeof alternates === 'object') {
        Object.keys(alternates).forEach((altKey) => nodesSet.add(altKey));
      }
    });
  }

  return Array.from(nodesSet);
};

// Type guard to check if obj is a RawSearchResult
const isRawSearchResult = (obj: unknown): obj is RawSearchResult => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'master_id' in obj &&
    ('isStac' in obj || 'data_node' in obj)
  );
};

// Overloaded function signature
export function getReplicaNodelsList(record: RawSearchResult): string[];
export function getReplicaNodelsList(assets: StacAssetDict | StacAsset): string[];
export function getReplicaNodelsList(
  recordOrAssets: RawSearchResult | StacAssetDict | StacAsset,
): string[] {
  if (isRawSearchResult(recordOrAssets)) {
    const record = recordOrAssets;

    // Handle non-STAC items
    if (!record.isStac) {
      const dataNode = record.data_node as string | undefined;
      if (dataNode && typeof dataNode === 'string') {
        return [dataNode];
      }
      return [];
    }

    // Handle STAC items
    const { assets } = record;
    if (!assets) {
      return [];
    }
    return getNodesFromStacAsset(assets);
  }

  // StacAssetDict or StacAsset use helper function to get nodes
  return getNodesFromStacAsset(recordOrAssets);
}

export const aggregationsToFacetsData = (
  projectName: string,
  aggregations: StacAggregations,
): {
  [x: string]: [string, number][];
} => {
  const facetsData: { [x: string]: [string, number][] } = {};
  aggregations.aggregations.forEach((aggregation) => {
    const facetName = aggregation.name
      .replace(`${projectName.toLocaleLowerCase()}_`, '')
      .replace('_frequency', '');
    const facetValues = aggregation.buckets.map(
      (bucket) => [bucket.key, bucket.frequency] as [string, number],
    );
    facetsData[facetName] = facetValues;
  });

  let updatedFacets = { ...facetsData };

  // Rename some facets
  /* istanbul ignore next -- @preserve */
  if ('alternate_name' in updatedFacets) {
    const { alternate_name, ...rest } = updatedFacets;
    updatedFacets = { ...rest, data_node: alternate_name };
  }

  // Filter out facets that were empty
  const cleanedFacetsData = Object.fromEntries(
    Object.entries(updatedFacets).filter(([, value]) => Array.isArray(value) && value.length > 0),
  );

  return cleanedFacetsData;
};

export const convertStacToRawSearchResult = (stacResult: StacFeature): RawSearchResult => {
  const { id, assets, bbox, geometry, links, properties, stac_version, type } = stacResult;
  const { access, citation_url, further_info_url, version, project } = properties;

  const numberOfFiles = Object.values(assets).reduce(
    (acc, asset) => acc + (asset['file:size'] > 0 ? 1 : 0),
    0,
  );
  const size = Object.values(assets).reduce((acc, asset) => acc + (asset['file:size'] || 0), 0);

  const updatedAssets: {
    [name: string]: StacAsset;
  } = {};

  Object.entries(assets).forEach(([key, value]) => {
    // Sometimes the asset has no name, title or id, in which case we'll use the key as a fallback
    /* istanbul ignore next -- @preserve */
    updatedAssets[key] = { ...value, id: value.name || value.title || key, access };
  });

  let versionProperty;
  /* istanbul ignore else -- @preserve */
  if (project && typeof project === 'string') {
    const projVersion = properties[`${project.toLowerCase()}:version`];
    versionProperty = typeof projVersion === 'string' ? projVersion : undefined;
  }
  /* istanbul ignore next -- @preserve */
  const versionStr = version || versionProperty || 'N/A';

  const result: RawSearchResult = {
    id,
    master_id: id,
    access,
    assets: updatedAssets,
    bbox,
    citation_url: /* istanbul ignore next -- @preserve */ citation_url ? [citation_url] : undefined,
    further_info_url: [further_info_url],
    geometry,
    links,
    number_of_files: numberOfFiles,
    version: versionStr,
    properties,
    retracted: properties.retracted,
    stac_version,
    type,
    size,
    isStac: true,
  };
  /* istanbul ignore next -- @preserve */
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
  project: RawProject,
): { op: string; args: unknown } | undefined => {
  const params: URLSearchParams = new URLSearchParams(reqUrlStr.split('?')[1] || '');

  const paramKeys = Array.from(params.keys());

  const facetsByGroup = project.facetsByGroup as Record<string, string[]>;
  const allFacets: string[] = Object.values(facetsByGroup).flat();
  const validFacets = paramKeys.filter((key) => allFacets.includes(key));

  /* istanbul ignore next -- @preserve */
  if (paramKeys.includes('latest')) {
    validFacets.push('latest');
  }

  const globusOnly = params.get('globusOnly');
  const versionParams = paramKeys.filter((key) => ['min_version', 'max_version'].includes(key));

  const mainFilters = [];

  // Create a filter for facets, if there are valid facets
  if (validFacets.length > 0) {
    // If there are more than one valid params, create an AND filter between each
    if (validFacets.length > 1) {
      mainFilters.push(
        createAndFilter(
          validFacets.map((param) => {
            /* istanbul ignore next -- @preserve */
            const values = params.get(param)?.split(',') || [];
            /* istanbul ignore next -- @preserve */
            const filterParam = getFacetFilterName(project.projectName, param);

            if (values.length > 1) {
              // If there are multiple values for a parameter, create an OR filter
              return createOrFilter(values.map((value) => createEqualsFilter(filterParam, value)));
            }
            return createEqualsFilter(filterParam, values[0]);
          }),
        ),
      );
    } else {
      const param = validFacets[0];
      /* istanbul ignore next -- @preserve */
      const filterParam = getFacetFilterName(project.projectName, param);

      /* istanbul ignore next -- @preserve */
      const values = params.get(param)?.split(',') || [];

      if (values.length > 1) {
        // If there are multiple values for a parameter, create an OR filter
        mainFilters.push(
          createOrFilter(values.map((value) => createEqualsFilter(filterParam, value))),
        );
      } else {
        mainFilters.push(createEqualsFilter(filterParam, values[0]));
      }
    }
  }

  // Create a filter for version range, if version params exist
  if (versionParams.length > 0) {
    // If there are more than one version params, create an AND filter between each
    if (versionParams.length > 1) {
      const minVersion = params.get('min_version');
      const maxVersion = params.get('max_version');
      mainFilters.push(
        createAndFilter([
          { op: '>=', args: [{ property: 'version' }, minVersion] },
          { op: '<=', args: [{ property: 'version' }, maxVersion] },
        ]),
      );
    } else {
      const param = versionParams[0];
      const value = params.get(param);
      if (param === 'min_version' && value) {
        mainFilters.push({ op: '>=', args: [{ property: 'version' }, value] });
      }
      if (param === 'max_version' && value) {
        mainFilters.push({ op: '<=', args: [{ property: 'version' }, value] });
      }
    }
  }

  // Create a filter for globusOnly if specified
  if (globusOnly && globusOnly === 'true') {
    mainFilters.push(createEqualsFilter('properties.access', 'Globus'));
  }

  if (mainFilters.length > 1) {
    return createAndFilter(mainFilters.filter((f) => f !== undefined));
  }

  /* istanbul ignore else -- @preserve */
  if (mainFilters.length === 1) {
    return mainFilters[0];
  }

  /* istanbul ignore next -- @preserve */
  return undefined;
};

export function getFileCountFromSTACsearch(features: StacFeature[]): number {
  let totalCount = 0;

  features.forEach((feature: StacFeature) => {
    totalCount += Object.values(feature.assets).reduce(
      (acc, asset) => acc + (asset['file:size'] > 0 ? 1 : 0),
      0,
    );
  });

  return totalCount;
}

export function getDownloadSizeFromSTACsearch(features: StacFeature[]): number {
  let totalSize = 0;

  features.forEach((feature: StacFeature) => {
    totalSize += Object.values(feature.assets).reduce(
      (acc, asset) => acc + (asset['file:size'] > 0 ? asset['file:size'] : 0),
      0,
    );
  });

  return totalSize;
}

export function generateWgetScriptSTAC(
  searchResults: RawSearchResult[],
  searchURL?: string,
): boolean {
  const d = new Date();
  const date_string = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
  const fileName = `wget_stac_script_${date_string}.sh`;

  let script = '#!/bin/bash\n\n';
  script += '##############################################################################\n';
  script += '# ESGF wget download script\n#\n';
  if (searchURL) {
    script += `# Search URL: ${searchURL}\n#\n`;
  }
  script += `# Total Files: TOTAL_FILES\n`;
  script += `# Total Download Size: TOTAL_SIZE\n#\n`;
  script += `# Generated by Metagrid - ${new Date().toISOString()}\n`;
  script += '#\n';
  script += '##############################################################################\n\n';

  let hrefs = 0;
  let fileSize = 0;

  searchResults.forEach((result) => {
    /* istanbul ignore else -- @preserve */
    if (result.assets) {
      Object.values(result.assets).forEach((asset) => {
        const { href } = asset;
        if (href && href.startsWith('http') && href.endsWith('.nc')) {
          script += `wget ${href}\n`;
          hrefs += 1;
          /* istanbul ignore else -- @preserve */
          if (asset['file:size']) {
            fileSize += asset['file:size'];
          }
        }
      });
    }
  });

  script = script.replace('TOTAL_FILES', hrefs.toString());
  script = script.replace('TOTAL_SIZE', formatBytes(fileSize));

  if (hrefs > 0) {
    downloadFileForUser(fileName, script);
  }

  return hrefs > 0;
}
