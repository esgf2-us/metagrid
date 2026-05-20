import {
  BookOutlined,
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExportOutlined,
  SaveOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Alert, Col, Dropdown, message, Row, Space, Tooltip, Typography } from 'antd';
import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import { v4 as uuidv4 } from 'uuid';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  activeSearchQueryAtom,
  availableFacetsAtom,
  currentProjectAtom,
  currentRequestQueryAtom,
  isDarkModeAtom,
  userCartAtom,
  userSearchQueriesAtom,
} from '../../common/atoms';
import {
  addUserSearchQuery,
  fetchSearchResults,
  generateSearchURLQuery,
  ResponseError,
  STAC_BATCH_SIZE,
} from '../../api';
import {
  copySearchOptionsTargets,
  searchTableTargets,
} from '../../common/joyrideTutorials/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import {
  cachePagination,
  cacheSearchResults,
  cacheStacBatches,
  clearCachedSearchResults,
  clearCachedStacBatches,
  createEsgpullCommand,
  createIntakeEsgfSearch,
  createSearchRouteURL,
  getCachedPagination,
  getCachedSearchResults,
  getCachedStacBatches,
  getStyle,
  getUrlFromSearch,
  isEqual,
  objectIsEmpty,
  projectBaseQuery,
  searchAlreadyExists,
  showError,
  showNotice,
} from '../../common/utils';
import { UserCart, UserSearchQuery } from '../Cart/types';
import { Tag, TagType, TagValue } from '../DataDisplay/Tag';
import { ActiveFacets, ParsedFacets, RawFacets, RawProject } from '../Facets/types';
import Button from '../General/Button'; // Note, tooltips do not work for this button
import Table from './Table';
import {
  ActiveSearchQuery,
  Pagination,
  RawSearchResult,
  RawSearchResults,
  StacFeature,
  StacResponse,
  TextInputs,
} from './types';
import { AuthContext } from '../../contexts/AuthContext';
import { convertStacToRawSearchResult, stringifyApiRequest } from '../../common/STAC';
import DownloadModal from '../Downloads/DownloadModal';

const tooltipText = {
  featureNotAvailableInStac: 'This feature is not compatible with STAC projects.',
  metagridSearchLink: 'Copy a shareable Metagrid search URL to your clipboard.',
  copyEsgpullSearch:
    'Convert your search into an Esgpull search query (search results may vary, not all facets are supported in Esgpull) and save it to your clipboard.',
  copyEsgpullDownload:
    'Convert your search into a download command for Esgpull. We HIGHLY recommended you verify the search results with the Esgpull search query, before running this download command.',
  copyIntakeEsgfSearch:
    'Converts your search into Intake ESGF python code and copies it to your clipboard so it can be run in a python shell.',
};

const styles: CSSinJS = {
  summary: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  subtitles: { fontWeight: 'bold' },
  facetTag: { fontWeight: 'bold' },
  resultsHeader: { fontWeight: 'bold' },
  filtersContainer: {
    marginBottom: 10,
  },
};
/**
 * Joins adjacent elements of the facets obj into a tuple using reduce().
 * https://stackoverflow.com/questions/37270508/javascript-function-that-converts-array-to-array-of-2-tuples
 */
export const parseFacets = (facets: RawFacets): ParsedFacets => {
  const res = facets as unknown as ParsedFacets;
  const keys: string[] = Object.keys(facets);

  keys.forEach((key) => {
    res[key] = res[key].reduce(
      (r, a, i) => {
        if (i % 2) {
          r[r.length - 1].push(a as unknown as number);
        } else {
          r.push([a] as never);
        }
        return r;
      },
      [] as unknown as [string, number][],
    );
  });
  return res;
};

export const checkFiltersExist = (
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs,
): boolean => !(objectIsEmpty(activeFacets) && textInputs.length === 0);

export type Props = {
  onUpdateCart: (selectedItems: RawSearchResults, operation: 'add' | 'remove') => void;
};

export type StacBatchLoading = {
  results: RawSearchResults;
  nextToken: string | undefined;
  projectName: string;
  totalMatched: number;
  searchQuery: ActiveSearchQuery | null;
  cacheRestored: boolean;
};

const Search: React.FC<React.PropsWithChildren<Props>> = ({ onUpdateCart }) => {
  // Global states
  const setAvailableFacets = useSetAtom(availableFacetsAtom);

  const userCart = useAtomValue<UserCart>(userCartAtom);

  const [userSearchQueries, setUserSearchQueries] = useAtom(userSearchQueriesAtom);

  const [activeSearchQuery, setActiveSearchQuery] = useAtom(activeSearchQueryAtom);

  const [currentRequestURL, setCurrentRequestURL] = useAtom(currentRequestQueryAtom);

  const [showDownloadAllForm, setShowDownloadAllForm] = React.useState<boolean>(false);

  const currentProject = useAtomValue(currentProjectAtom);

  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const {
    project,
    versionType,
    resultType,
    minVersionDate,
    maxVersionDate,
    filenameVars,
    activeFacets,
    textInputs,
  } = activeSearchQuery;

  const [messageApi, contextHolder] = message.useMessage();

  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  const appStyles = getStyle(isDarkMode);

  const { data, error, isLoading, run } = useAsync({
    deferFn: fetchSearchResults as unknown as DeferFn<Record<string, unknown>>,
  });
  const [filtersExist, setFiltersExist] = React.useState<boolean>(false);
  const [parsedFacets, setParsedFacets] = React.useState<ParsedFacets | Record<string, unknown>>(
    {},
  );
  const [selectedItems, setSelectedItems] = React.useState<RawSearchResults | []>([]);

  const [paginationOptions, setPaginationOptions] =
    React.useState<Pagination>(getCachedPagination());

  const [stacLoadedBatches, setStacLoadedBatches] = React.useState<StacBatchLoading>(() => {
    try {
      const cachedStac = getCachedStacBatches() as StacBatchLoading | null;

      if (
        cachedStac &&
        cachedStac.projectName &&
        Array.isArray(cachedStac.results) &&
        cachedStac.results.length > 0
      ) {
        return cachedStac;
      }
    } catch (err) {
      clearCachedStacBatches();
    }

    return {
      results: [],
      nextToken: undefined,
      projectName: '',
      totalMatched: 0,
      searchQuery: null,
      cacheRestored: false,
    };
  });

  const [isBackgroundFetch, setIsBackgroundFetch] = React.useState<boolean>(false);
  const lastPreloadedBatchRef = React.useRef<number>(-1);
  const prevProjectNameRef = React.useRef<string>('');

  const [cachedResults, setCachedResults] = React.useState<Record<string, unknown> | undefined>(
    undefined,
  );

  const results: Record<string, unknown> | undefined = data || cachedResults;
  const hasStacResults = stacLoadedBatches.results.length > 0;

  // Cache STAC batches to localStorage for navigation persistence
  React.useEffect(() => {
    if (currentProject.isSTAC && hasStacResults) {
      cacheStacBatches(stacLoadedBatches);
    }
  }, [currentProject.isSTAC, stacLoadedBatches, hasStacResults]);

  // Reset all caches and pagination when switching between projects
  React.useEffect(() => {
    const currentProjectName = (project.name as string) || '';
    const projectActuallyChanged =
      prevProjectNameRef.current !== '' && prevProjectNameRef.current !== currentProjectName;

    if (projectActuallyChanged) {
      setIsBackgroundFetch(false);
      lastPreloadedBatchRef.current = -1;
      clearCachedSearchResults();
      clearCachedStacBatches();
      setCachedResults(undefined);
      setPaginationOptions({ page: 1, pageSize: paginationOptions.pageSize });
      setAvailableFacets({});

      if (currentProject.isSTAC) {
        setStacLoadedBatches({
          results: [],
          nextToken: undefined,
          projectName: currentProjectName,
          totalMatched: 0,
          searchQuery: null,
          cacheRestored: false,
        });
      }
    }

    prevProjectNameRef.current = currentProjectName;
  }, [currentProject.isSTAC, project.name, paginationOptions.pageSize, setAvailableFacets]);

  React.useEffect(() => {
    if (!objectIsEmpty(project)) {
      cachePagination(paginationOptions);
      const reqUrl = generateSearchURLQuery(activeSearchQuery, paginationOptions);
      setCurrentRequestURL(reqUrl);
    }
  }, [activeSearchQuery, project, paginationOptions]);

  React.useEffect(() => {
    setFiltersExist(checkFiltersExist(activeFacets, textInputs));
  }, [activeFacets, textInputs]);

  // Handle STAC cache restoration and query change detection
  // When returning from another page, restore cached query once, then allow modifications
  React.useEffect(() => {
    if (currentProject.isSTAC && stacLoadedBatches.searchQuery && hasStacResults) {
      const cachedQuery = stacLoadedBatches.searchQuery;
      const currentProjectName = (project.name as string) || '';

      const queryChanged =
        !isEqual(activeSearchQuery.activeFacets, cachedQuery.activeFacets) ||
        !isEqual(activeSearchQuery.textInputs, cachedQuery.textInputs) ||
        !isEqual(activeSearchQuery.filenameVars, cachedQuery.filenameVars);

      if (queryChanged && stacLoadedBatches.projectName === currentProjectName) {
        if (!stacLoadedBatches.cacheRestored) {
          // First time after loading cache: restore the cached query to UI
          setActiveSearchQuery(cachedQuery);
          setStacLoadedBatches({
            ...stacLoadedBatches,
            cacheRestored: true,
          });
        } else {
          // After restoration: user modified query, reset batches and fetch new results
          setStacLoadedBatches({
            results: [],
            nextToken: undefined,
            projectName: currentProjectName,
            totalMatched: 0,
            searchQuery: activeSearchQuery,
            cacheRestored: false,
          });
          clearCachedStacBatches();
          setAvailableFacets({});
          setPaginationOptions({ page: 1, pageSize: paginationOptions.pageSize });
        }
      }
    }
  }, [
    currentProject.isSTAC,
    activeSearchQuery.activeFacets,
    activeSearchQuery.textInputs,
    activeSearchQuery.filenameVars,
    project.name,
    paginationOptions.pageSize,
    data,
    hasStacResults,
    stacLoadedBatches.cacheRestored,
  ]);

  React.useEffect(() => {
    if (!objectIsEmpty(project) && currentRequestURL) {
      if (currentProject.isSTAC) {
        if (!hasStacResults) {
          run(currentRequestURL);
        }
      } else {
        const cached = getCachedSearchResults();
        const cachedURL = (cached?.cachedURL as string) || '';

        if (currentRequestURL === cachedURL) {
          setCachedResults(cached);
        } else {
          setCachedResults(undefined);
          run(currentRequestURL);
        }
      }
    }
  }, [run, currentRequestURL, project, currentProject.isSTAC, hasStacResults]);

  // Process API results: cache, parse facets, and accumulate STAC batches
  React.useEffect(() => {
    if (results && currentRequestURL && !objectIsEmpty(results)) {
      cacheSearchResults(results, paginationOptions, currentRequestURL);
      if (results.facet_counts) {
        const { facet_fields: facetFields } = (
          results as {
            facet_counts: { facet_fields: RawFacets };
          }
        ).facet_counts;
        setParsedFacets(parseFacets(facetFields));
      } else {
        const { facets } = results as { facets: RawFacets };
        setParsedFacets(facets);
      }

      // For STAC: accumulate batches with cursor-based pagination
      if (currentProject.isSTAC && results.stac && results.search) {
        const stacResponse = results as StacResponse;
        const { links, features } = stacResponse.search;

        const searchData = stacResponse.search as {
          numberMatched?: number;
          numMatched?: number;
          features?: StacFeature[];
        };
        const totalMatched = searchData.numberMatched || searchData.numMatched || 0;

        const newDocs =
          features && features.length > 0
            ? features.map((stacResult: StacFeature) => convertStacToRawSearchResult(stacResult))
            : [];

        // Extract next token for fetching additional batches
        let nextToken: string | undefined;
        if (links && Array.isArray(links)) {
          const nextLink = links.find((link) => link.rel === 'next');
          nextToken = typeof nextLink?.body?.token === 'string' ? nextLink.body.token : undefined;
        }

        const loadedBatches = Math.ceil(stacLoadedBatches.results.length / STAC_BATCH_SIZE);
        const accumulatedResults =
          loadedBatches === 0 ? newDocs : [...stacLoadedBatches.results, ...newDocs];

        setStacLoadedBatches({
          results: accumulatedResults,
          nextToken,
          projectName: (project.name as string) || '',
          totalMatched,
          searchQuery: activeSearchQuery,
          cacheRestored: true,
        });
      }
    }
  }, [results]);

  React.useEffect(() => {
    if (!objectIsEmpty(parsedFacets)) {
      setAvailableFacets(parsedFacets as ParsedFacets);
    }
  }, [parsedFacets, setAvailableFacets]);

  // Auto-preload next STAC batch when user reaches last page
  React.useEffect(() => {
    if (
      !currentProject.isSTAC ||
      !hasStacResults ||
      !stacLoadedBatches.nextToken ||
      isLoading ||
      isBackgroundFetch
    ) {
      return;
    }

    const currentPage = paginationOptions.page || 1;
    const currentPageSize = paginationOptions.pageSize || 10;
    const loadedCount = stacLoadedBatches.results.length;
    const totalLoadedPages = Math.ceil(loadedCount / currentPageSize);
    const currentBatch = Math.ceil(loadedCount / STAC_BATCH_SIZE);

    // Preload next batch in background for smooth pagination
    if (currentPage === totalLoadedPages && lastPreloadedBatchRef.current !== currentBatch) {
      lastPreloadedBatchRef.current = currentBatch;
      setIsBackgroundFetch(true);
      setTimeout(() => {
        run([currentRequestURL, stacLoadedBatches.nextToken]);
      }, 100);
    }
  }, [
    currentProject.isSTAC,
    hasStacResults,
    stacLoadedBatches.nextToken,
    stacLoadedBatches.results.length,
    paginationOptions.page,
    paginationOptions.pageSize,
    isLoading,
    isBackgroundFetch,
    currentRequestURL,
    run,
  ]);

  const handleClearFilters = React.useCallback((): void => {
    setActiveSearchQuery(projectBaseQuery(activeSearchQuery.project));
  }, [activeSearchQuery.project, setActiveSearchQuery]);

  const handleSaveSearchQuery = React.useCallback(
    (url: string, numFound: number): void => {
      const savedSearch: UserSearchQuery = {
        uuid: uuidv4(),
        user: pk,
        project: activeSearchQuery.project as RawProject,
        projectId: activeSearchQuery.project.pk as string,
        versionType: activeSearchQuery.versionType,
        resultType: activeSearchQuery.resultType,
        minVersionDate: activeSearchQuery.minVersionDate,
        maxVersionDate: activeSearchQuery.maxVersionDate,
        filenameVars: activeSearchQuery.filenameVars,
        activeFacets: activeSearchQuery.activeFacets,
        textInputs: activeSearchQuery.textInputs,
        globusOnly: activeSearchQuery.globusOnly,
        url,
        resultsCount: numFound,
        searchTime: Date.now(),
      };

      if (searchAlreadyExists(userSearchQueries, savedSearch)) {
        showNotice(messageApi, 'Search query is already in your library', {
          icon: <BookOutlined style={appStyles.messageAddIcon} />,
          type: 'info',
        });
        return;
      }

      const saveSuccess = (): void => {
        setUserSearchQueries([...userSearchQueries, savedSearch]);
        showNotice(messageApi, 'Saved search query to your library', {
          icon: <BookOutlined style={appStyles.messageAddIcon} />,
        });
      };

      if (isAuthenticated) {
        addUserSearchQuery(pk, accessToken, savedSearch)
          .then(() => {
            saveSuccess();
          })
          .catch(
            /* istanbul ignore next -- @preserve */
            (respError: ResponseError) => {
              showError(messageApi, respError.message);
            },
          );
      } else {
        saveSuccess();
      }
    },
    [
      pk,
      activeSearchQuery,
      userSearchQueries,
      messageApi,
      appStyles.messageAddIcon,
      isAuthenticated,
      accessToken,
      setUserSearchQueries,
    ],
  );

  const handleShareSearchQuery = React.useCallback((): void => {
    /* istanbul ignore else -- @preserve */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(getUrlFromSearch(activeSearchQuery));
      showNotice(messageApi, 'Metagrid search URL copied to clipboard!', {
        icon: <ShareAltOutlined />,
      });
    }
  }, [activeSearchQuery, messageApi]);

  /* istanbul ignore next -- @preserve */
  const handleEsgpullSearchQuery = React.useCallback((): void => {
    /* istanbul ignore else -- @preserve */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(createEsgpullCommand(activeSearchQuery, false));
      showNotice(messageApi, 'Esgpull search query copied to clipboard!', {
        icon: <CodeOutlined />,
      });
    }
  }, [activeSearchQuery, messageApi]);

  /* istanbul ignore next -- @preserve */
  const handleEsgpullDownloadCmd = React.useCallback((): void => {
    /* istanbul ignore else -- @preserve */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(createEsgpullCommand(activeSearchQuery, true));
      showNotice(messageApi, 'Esgpull download command copied to clipboard!', {
        icon: <CodeOutlined />,
      });
    }
  }, [activeSearchQuery, messageApi]);

  const handleIntakeEsgfSearch = React.useCallback((): void => {
    /* istanbul ignore else -- @preserve */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(createIntakeEsgfSearch(activeSearchQuery));
      showNotice(messageApi, 'Intake-ESGF search command copied to clipboard!', {
        icon: <CodeOutlined />,
      });
    }
  }, [activeSearchQuery, messageApi]);

  const handleRemoveFilter = (removedTag: TagValue, type: TagType): void => {
    /* istanbul ignore else -- @preserve */
    if (type === 'text') {
      setActiveSearchQuery({
        ...activeSearchQuery,
        textInputs: activeSearchQuery.textInputs.filter((input) => input !== removedTag),
      });
    } else if (type === 'filenameVar') {
      setActiveSearchQuery({
        ...activeSearchQuery,
        filenameVars: activeSearchQuery.filenameVars.filter((input) => input !== removedTag),
      });
    } else if (type === 'facet') {
      const prevActiveFacets = activeSearchQuery.activeFacets;

      const facet = removedTag[0] as unknown as string;
      const facetOption = removedTag[1] as unknown as string;
      const updateFacet = {
        [facet]: prevActiveFacets[facet].filter((item) => item !== facetOption),
      };

      if (updateFacet[facet].length === 0) {
        delete prevActiveFacets[facet];
        setActiveSearchQuery({
          ...activeSearchQuery,
          activeFacets: { ...prevActiveFacets },
        });
      } else {
        setActiveSearchQuery({
          ...activeSearchQuery,
          activeFacets: { ...prevActiveFacets, ...updateFacet },
        });
      }
    }
  };

  const handleRowSelect = (selectedRows: RawSearchResults | []): void => {
    const rows = (selectedRows as RawSearchResults).filter(
      (row: RawSearchResult) => row !== undefined,
    );
    setSelectedItems(rows);
  };

  const handlePageChange = (page: number, pageSize: number): void => {
    setPaginationOptions({ page, pageSize });

    if (currentProject.isSTAC && stacLoadedBatches.nextToken) {
      const loadedCount = stacLoadedBatches.results.length;
      const totalLoadedPages = Math.ceil(loadedCount / pageSize);
      const currentBatch = Math.ceil(loadedCount / STAC_BATCH_SIZE);

      if (page === totalLoadedPages && lastPreloadedBatchRef.current !== currentBatch) {
        lastPreloadedBatchRef.current = currentBatch;
        setIsBackgroundFetch(true);
        setTimeout(() => {
          run([currentRequestURL, stacLoadedBatches.nextToken]);
        }, 100);
      }
    }
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

  const queryString = React.useMemo(
    () =>
      stringifyApiRequest(
        currentProject,
        currentRequestURL,
        textInputs,
        versionType,
        resultType,
        minVersionDate,
        maxVersionDate,
        activeFacets,
      ),
    [
      currentProject,
      currentRequestURL,
      textInputs,
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
      activeFacets,
    ],
  );

  const allSelectedItemsInCart = React.useMemo(
    () =>
      selectedItems.filter(
        (item: RawSearchResult) =>
          !userCart.some((dataset: RawSearchResult) => dataset.id === item.id),
      ).length === 0,
    [selectedItems, userCart],
  );

  // Used cached results if the request fails
  if (error) {
    /* istanbul ignore next -- @preserve */
    if (error.cause === 422) {
      // Handle unlikely case where the requested page is not available
      setTimeout(() => {
        window.location.reload();
      }, 5000);

      showError(messageApi, 'The requested page value was unavailable. Resetting to page 1.');
      return (
        <div data-testid="alert-fetching">
          {contextHolder}
          <Alert message="There was an issue fetching results for requested page." type="error" />
        </div>
      );
    }
    return (
      <div data-testid="alert-fetching">
        <Alert
          message="There was an issue fetching search results. Please contact support or try again later."
          type="error"
        />
      </div>
    );
  }

  let numMatched = 0;
  let docs: RawSearchResults = [];
  let paginationTotal = 0;
  type LoadedResults = {
    cachedURL: string;
    response: { docs: RawSearchResults; numFound: number };
  };

  if (currentProject.isSTAC || results) {
    if (currentProject.isSTAC) {
      const currentProjectName = (project.name as string) || '';
      const projectMatches =
        currentProjectName &&
        stacLoadedBatches.projectName === currentProjectName &&
        stacLoadedBatches.results.length > 0;

      docs = projectMatches ? stacLoadedBatches.results : [];
      const loadedCount = docs.length;
      numMatched = stacLoadedBatches.totalMatched || loadedCount;
      paginationTotal = loadedCount;
    } else if (results && results.response) {
      numMatched = (results as LoadedResults).response.numFound;
      paginationTotal = numMatched;
      docs = (results as LoadedResults).response.docs.map((doc) => ({
        ...doc,
        isStac: false,
      }));
    }
  }

  const searchActionsMenu = [
    {
      key: '1',
      label: (
        <Tooltip placement="left" title={tooltipText.metagridSearchLink}>
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copySearchLinkBtn.class()}
              onClick={handleShareSearchQuery}
              disabled={isLoading || numMatched === 0}
            >
              <ShareAltOutlined data-testid="share-search-btn" /> Copy Metagrid search URL
            </Button>
          </span>
        </Tooltip>
      ),
    },
    {
      key: '2',
      label: (
        <Tooltip placement="left" title={tooltipText.copyEsgpullSearch}>
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copyEsgpullSearchQueryBtn.class()}
              onClick={handleEsgpullSearchQuery}
              disabled={isLoading || numMatched === 0}
            >
              <CodeOutlined data-testid="copy-esgpull-search-btn" /> Copy esgpull search query
            </Button>
          </span>
        </Tooltip>
      ),
    },
    {
      key: '3',
      label: (
        <Tooltip placement="left" title={tooltipText.copyEsgpullDownload}>
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copyEsgpullDownloadCommandBtn.class()}
              onClick={handleEsgpullDownloadCmd}
              disabled={isLoading || numMatched === 0}
            >
              <CodeOutlined data-testid="copy-esgpull-download-btn" /> Copy esgpull download command
            </Button>
          </span>
        </Tooltip>
      ),
    },
    {
      key: '4',
      label: (
        <Tooltip placement="left" title={tooltipText.copyIntakeEsgfSearch}>
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copyIntakeEsgfSearchBtn.class()}
              onClick={handleIntakeEsgfSearch}
              disabled={isLoading || numMatched === 0}
            >
              <CodeOutlined data-testid="copy-intake-search-btn" /> Copy Intake-ESGF search command
            </Button>
          </span>
        </Tooltip>
      ),
    },
  ];

  /* istanbul ignore next -- @preserve */
  const setDownloadAllForm = (value: boolean) => {
    return () => {
      setShowDownloadAllForm(value);
    };
  };

  return (
    <div data-testid="search">
      {contextHolder}
      <div
        className={searchTableTargets.searchFeaturesArea.class()}
        data-testid="search-features-wrapper"
      >
        <div style={styles.summary}>
          {objectIsEmpty(project) && (
            <Alert message="Select a project to search for results" type="info" showIcon />
          )}
          <h3>
            {isLoading && !isBackgroundFetch && (
              <span style={styles.resultsHeader}>Loading latest results for </span>
            )}
            {(results || (currentProject.isSTAC && hasStacResults)) &&
              (!isLoading || isBackgroundFetch) && (
                <span
                  className={searchTableTargets.resultsFoundText.class()}
                  style={styles.resultsHeader}
                  data-testid="search-results-span"
                >
                  {numMatched.toLocaleString()} results found for{' '}
                </span>
              )}
            <span style={styles.resultsHeader}>{(project as RawProject).name}</span>
          </h3>
          <div>
            {(results || (currentProject.isSTAC && hasStacResults)) && (
              <Space>
                {currentProject.isSTAC && (
                  <>
                    <Tooltip
                      placement="bottom"
                      title="Open form to download the current search results."
                    >
                      <Button
                        type="default"
                        shape="round"
                        className={searchTableTargets.downloadSearchBtn.class()}
                        onClick={setDownloadAllForm(true)}
                        disabled={isLoading || numMatched === 0}
                      >
                        <DownloadOutlined />
                        Download All Results{' '}
                      </Button>{' '}
                    </Tooltip>
                    <DownloadModal
                      show={showDownloadAllForm}
                      hide={setDownloadAllForm(false)}
                      searchURL={getUrlFromSearch(activeSearchQuery)}
                      stacResults={
                        results
                          ? (results as StacResponse).search
                          : {
                              features: [],
                              links: [],
                              type: 'FeatureCollection',
                            }
                      }
                    />
                  </>
                )}
                <Tooltip
                  placement="bottom"
                  title="Add the selected datasets to your download cart."
                >
                  <Button
                    type="default"
                    className={searchTableTargets.addSelectedToCartBtn.class()}
                    onClick={() => onUpdateCart(selectedItems, 'add')}
                    disabled={
                      isLoading ||
                      numMatched === 0 ||
                      selectedItems.length === 0 ||
                      allSelectedItemsInCart
                    }
                  >
                    <ShoppingCartOutlined />
                    Add Selected to Cart
                  </Button>{' '}
                </Tooltip>
                <Dropdown.Button
                  data-testid="save-search-dropdown-btn"
                  className={searchTableTargets.saveSearchBtn.class()}
                  type="default"
                  onClick={() => handleSaveSearchQuery(currentRequestURL, numMatched)}
                  disabled={isLoading || numMatched === 0}
                  menu={{ items: searchActionsMenu }}
                  placement="bottom"
                  icon={<CopyOutlined className={copySearchOptionsTargets.copyMenuBtn.class()} />}
                >
                  <Tooltip
                    placement="bottom"
                    title="Saves your current search parameters to Saved Searches for later use."
                  >
                    <SaveOutlined data-testid="save-search-btn" />
                    Save Search
                  </Tooltip>
                </Dropdown.Button>{' '}
              </Space>
            )}
          </div>
        </div>
        <div>
          {(results || (currentProject.isSTAC && hasStacResults)) && (
            <p>
              <span style={styles.subtitles} data-testid="main-query-string-label">
                {currentProject.isSTAC ? 'STAC Query String' : 'Query String'}
                <Button
                  size="small"
                  style={{
                    marginLeft: '5px',
                    display: `${currentProject.isSTAC ? 'inherit' : 'none'}`,
                  }}
                  icon={
                    <Tooltip title="Copy query to clipboard">
                      <CopyOutlined style={{ fontSize: '12px' }} />
                    </Tooltip>
                  }
                  onClick={() => {
                    // copy link to clipboard
                    /* istanbul ignore else -- @preserve */
                    if (navigator && navigator.clipboard) {
                      navigator.clipboard.writeText(queryString);
                      showNotice(messageApi, 'Query copied to clipboard!', {
                        icon: <CopyOutlined style={styles.messageAddIcon} />,
                      });
                    }
                  }}
                />{' '}
                :
              </span>
              <Typography.Text className={searchTableTargets.queryString.class()} code>
                {queryString}
              </Typography.Text>
            </p>
          )}
        </div>
        {(results || (currentProject.isSTAC && hasStacResults)) && (
          <Row style={styles.filtersContainer}>
            {Object.keys(activeFacets).length !== 0 &&
              Object.keys(activeFacets).map((facet: string) =>
                activeFacets[facet].map((variable: string) => (
                  <div key={variable} data-testid={variable}>
                    <Tag value={[facet, variable]} onClose={handleRemoveFilter} type="facet">
                      {variable}
                    </Tag>
                  </div>
                )),
              )}
            {textInputs.length !== 0 &&
              (textInputs as TextInputs).map((input: string) => (
                <div key={input} data-testid={input}>
                  <Tag value={input} onClose={handleRemoveFilter} type="text">
                    {input}
                  </Tag>
                </div>
              ))}
            {filenameVars.length !== 0 &&
              (filenameVars as TextInputs).map((input: string) => (
                <div key={input} data-testid={input}>
                  <Tag value={input} onClose={handleRemoveFilter} type="filenameVar">
                    Filename Search: {input}
                  </Tag>
                </div>
              ))}
            {filtersExist && (
              <Button type="primary" danger size="small" onClick={handleClearFilters}>
                Clear All
              </Button>
            )}
          </Row>
        )}
      </div>

      <div
        style={{
          height: 'calc(100vh - 380px)',
          marginBottom: '24px',
        }}
      >
        <Row gutter={[24, 16]} justify="space-around">
          <Col lg={24}>
            <div
              data-testid="search-table"
              className={searchTableTargets.searchResultsTable.class()}
            >
              <Table
                loading={isLoading && !isBackgroundFetch}
                results={docs}
                totalResults={currentProject.isSTAC ? paginationTotal : numMatched}
                currentPage={paginationOptions.page}
                filenameVars={activeSearchQuery.filenameVars}
                isStac={currentProject.isSTAC}
                onUpdateCart={onUpdateCart}
                onRowSelect={handleRowSelect}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                scroll={{ y: 'calc(100vh - 480px)', x: 'max-content' }}
              />
            </div>
          </Col>
          {results && currentRequestURL && (
            <Col lg={24} style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button
                type="default"
                href={createSearchRouteURL(currentRequestURL)}
                target="_blank"
                icon={<ExportOutlined />}
              >
                Open as JSON
              </Button>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};

export default Search;
