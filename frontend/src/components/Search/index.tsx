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
  alternateFetchSearchResults,
  generateSearchURLQuery,
  ResponseError,
} from '../../api';
import {
  copySearchOptionsTargets,
  searchTableTargets,
} from '../../common/joyrideTutorials/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import {
  baseSearchResponse,
  basePagination,
  // cachePagination,
  createEsgpullCommand,
  createIntakeEsgfSearch,
  createSearchRouteURL,
  // getCachedPagination,
  getStyle,
  getUrlFromSearch,
  // isEqual,
  objectIsEmpty,
  projectBaseQuery,
  showError,
  showNotice,
  isEqual,
} from '../../common/utils';
import { UserCart, UserSearchQuery } from '../Cart/types';
import { Tag, TagType, TagValue } from '../DataDisplay/Tag';
import { ParsedFacets, RawFacets, RawProject } from '../Facets/types';
import Button from '../General/Button'; // Note, tooltips do not work for this button
import Table from './Table';
import {
  ActiveSearchQuery,
  NonStacResponse,
  Pagination,
  RawSearchResult,
  RawSearchResults,
  SearchResponse,
  StacFeature,
  StacResponse,
  TextInputs,
} from './types';
import { AuthContext } from '../../contexts/AuthContext';
import { convertStacToRawSearchResult, stringifyApiRequest } from '../../common/STAC';
import DownloadModal from '../Downloads/DownloadModal';
import {
  checkFiltersExist,
  convertActiveSearchToHash,
  // clearCachedSearchResults,
  // deriveCachedSearchData,
  // getCachedSearchResults,
  identifyProblematicFacets,
  // memoizedCacheSearchResults,
  parseFacets,
  SEARCH_BATCH_SIZE,
  searchAlreadyExists,
  searchesMatch,
} from './searchHelpers';

const MAX_NON_STAC_RESULTS = 10000;

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

export type Props = {
  onUpdateCart: (selectedItems: RawSearchResults, operation: 'add' | 'remove') => void;
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

  const { data, error, isLoading, run } = useAsync<Record<string, unknown>>({
    deferFn: async ([search, pagination, token]) => {
      return alternateFetchSearchResults(
        search as ActiveSearchQuery,
        pagination as Pagination,
        token as string | undefined,
      );
    },
  });
  const [filtersExist, setFiltersExist] = React.useState<boolean>(false);
  const [parsedFacets, setParsedFacets] = React.useState<ParsedFacets | Record<string, unknown>>(
    {},
  );
  const [selectedItems, setSelectedItems] = React.useState<RawSearchResults | []>([]);

  // const [cachedData, setCachedData] = useAtom<FullSearchData>(cachedSearchDataAtom);

  const [paginationOptions, setPaginationOptions] = React.useState<Pagination>(
    basePagination /* getCachedPagination() */,
  );

  // const [cachedResults, setCachedResults] = React.useState<Record<string, unknown> | undefined>(
  //   () => {
  //     // Initialize from localStorage on mount
  //     const cached = getCachedSearchResults();
  //     return cached && !objectIsEmpty(cached) ? cached : undefined;
  //   },
  // );

  // Track the query that was active when making the current request
  // const currentRequestQueryRef = React.useRef<ActiveSearchQuery | null>(null);

  // State for last successful search
  // const [lastSuccessfulSearch, setLastSuccessfulSearch] = React.useState<CachedSearchData>({
  //   results: {},
  //   query: getCachedSearchResults().searchQuery,
  //   facets: {},
  //   pagination: getCachedPagination(),
  // });

  const dataResponse: SearchResponse | undefined = data as SearchResponse | undefined; // || cachedResults;

  // const {
  //   pagination: cachedPagination,
  //   expires: cacheExpires,
  //   searchQuery: cachedQuery,
  //   batchedResults: cachedResults,
  //   searchFacets: cachedFacets,
  // } = cachedData;

  // const showCachedResultsOnError = error && cachedResults && !objectIsEmpty(cachedResults);
  const resultsToDisplay = /* showCachedResultsOnError ? cachedResults : */ dataResponse;
  const { expires, status, searchQuery, searchUrl, batchedResults, searchFacets } =
    React.useMemo(() => {
      if (dataResponse && dataResponse.status === 200) {
        const facets = dataResponse.searchFacets;
        if (!objectIsEmpty(facets)) {
          setAvailableFacets(facets);
          setPaginationOptions({ page: 1, pageSize: paginationOptions.pageSize });
        }
        return dataResponse;
      }
      return baseSearchResponse;
    }, [dataResponse]);

  const { totalMatched, batches, batchSize, isStac, accumulatedResults } = React.useMemo(() => {
    return batchedResults;
  }, [batchedResults]);

  // Reset caches when switching projects
  const prevProjectRef = React.useRef<RawProject>({} as RawProject);

  // Ensures we don't re-run our requests when currentUrl was already run
  const lastActiveSearchQuery = React.useRef<ActiveSearchQuery>({} as ActiveSearchQuery);

  // Calculate the results we need to load for the current page
  const loadedPageResults: RawSearchResults = React.useMemo(() => {
    const offset = (paginationOptions.page - 1) * paginationOptions.pageSize;
    const batchRequested = Math.floor(offset / batchSize);
    const batchAlreadyLoaded = batches.find((batch) => batch.batchNumber === batchRequested);

    if (batchAlreadyLoaded) {
      const startIdx = offset % batchSize;
      const endIdx = startIdx + (paginationOptions.pageSize - 1);
      const records = accumulatedResults.slice(startIdx, endIdx);

      const searchResults: RawSearchResults = (
        isStac
          ? records.map((feature) => convertStacToRawSearchResult(feature as StacFeature))
          : records
      ) as RawSearchResults;
      return searchResults;
    }

    return [];
  }, [accumulatedResults, batches, batchSize, paginationOptions]);

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

  // Identify problematic facets by comparing with last successful query
  // const problematicFacets = React.useMemo(() => {
  //   if (error && /* fallbackQuery */) {
  //     return identifyProblematicFacets(activeSearchQuery, fallbackQuery);
  //   }
  //   return new Set<string>();
  // }, [error, activeSearchQuery, fallbackQuery]);

  // const { numMatched, resultCount, docs } = React.useMemo(() => {
  //   if (!resultsToDisplay) {
  //     return { numMatched: 0, docs: [] };
  //   }

  //   // Non-stac search results returned
  //   if (!resultsToDisplay.stac && resultsToDisplay.response) {
  //     const { docs: responseDocs, numFound } = (resultsToDisplay as NonStacResponse).response;
  //     return {
  //       numMatched: numFound,
  //       resultCount: responseDocs.length,
  //       docs: responseDocs.map((doc) => ({ ...doc, isStac: currentProject.isSTAC })),
  //     };
  //   }

  //   // STAC Search results returned
  //   if (resultsToDisplay.stac && resultsToDisplay.search) {
  //     const stacResponse = resultsToDisplay as StacResponse;
  //     const { features, links } = stacResponse.search;

  //     const searchData = stacResponse.search as {
  //       numberMatched?: number;
  //       numMatched?: number;
  //     };
  //     const totalMatched = searchData.numberMatched || searchData.numMatched || 0;

  //     const stacDocs =
  //       features && features.length > 0
  //         ? features.map((stacFeature: StacFeature) => convertStacToRawSearchResult(stacFeature))
  //         : [];

  //     return {
  //       numMatched: totalMatched,
  //       resultCount: features.length,
  //       docs: stacDocs,
  //     };
  //   }

  //   // No results returned
  //   return { numMatched: 0, docs: [] };
  // }, [resultsToDisplay, currentProject.isSTAC]);

  // Helper to fix incomplete project objects in cached queries
  // const fixProjectInQuery = React.useCallback(
  //   (derived: CachedSearchData): CachedSearchData => {
  //     if (!derived.query || !currentProject.name) return derived;

  //     const projectNamesMatch =
  //       currentProject.name === derived.query.project.name ||
  //       currentProject.name?.toLowerCase() ===
  //         (derived.query.project as RawProject).name?.toLowerCase();

  //     if (projectNamesMatch || !derived.query.project.facetsUrl) {
  //       return {
  //         ...derived,
  //         query: { ...derived.query, project: currentProject },
  //       };
  //     }
  //     return derived;
  //   },
  //   [currentProject],
  // );

  const handleClearFilters = React.useCallback((): void => {
    // setCachedResults(undefined); // Clear cache to force fresh search
    // clearCachedSearchResults();
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
  // Hidden until better clarity on facet mapping
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

  // const handleRevertToLastSuccessfulQuery = React.useCallback((): void => {
  //   if (fallbackQuery) {
  //     // Clear cache to force fresh search with reverted query
  //     setCachedResults(undefined);
  //     clearCachedSearchResults();

  //     // Merge with current project from atom to preserve full project object
  //     setActiveSearchQuery({
  //       ...fallbackQuery,
  //       project: currentProject, // Use full project object from atom
  //     });

  //     showNotice(messageApi, 'Reverted to last successful search', {
  //       icon: <BookOutlined style={appStyles.messageAddIcon} />,
  //     });
  //   }
  // }, [fallbackQuery, currentProject, setActiveSearchQuery, messageApi, appStyles.messageAddIcon]);

  // Update fallback data: multi-tier fallback (memory → localStorage → session)
  // React.useEffect(() => {
  //   if (lastSuccessfulSearch.results && !objectIsEmpty(lastSuccessfulSearch.results)) {
  //     setFallbackData(lastSuccessfulSearch);
  //     return;
  //   }

  //   const localStorageCache = getCachedSearchResults();
  //   if (localStorageCache && !objectIsEmpty(localStorageCache)) {
  //     setFallbackData(fixProjectInQuery(deriveCachedSearchData(localStorageCache)));
  //     return;
  //   }

  //   if (cachedResults && !objectIsEmpty(cachedResults)) {
  //     setFallbackData(fixProjectInQuery(deriveCachedSearchData(cachedResults)));
  //     return;
  //   }

  //   setFallbackData({ results: undefined, query: null, facets: {} });
  // }, [lastSuccessfulSearch, cachedResults, fixProjectInQuery, error]);

  // Resets the cached results, pagination, and facets, if project is changed
  // React.useEffect(() => {
  //   const projectActuallyChanged =
  //     prevProjectRef.current.pk !== '' && prevProjectRef.current.pk !== currentProject.pk;

  //   if (projectActuallyChanged) {
  //     // clearCachedSearchResults();
  //     // setCachedResults(undefined);
  //     // setCachedData(baseCachedData);
  //     // prevProjectRef.current = currentProject;
  //     // setAvailableFacets({});
  //     // setPaginationOptions({ page: 1, pageSize: paginationOptions.pageSize });
  //     setActiveSearchQuery(projectBaseQuery(currentProject));
  //   }
  // }, [project]);

  // Update facets when project is loaded

  // Update request url when activeSearchQuery, project, currentProject or pagination changes
  // React.useEffect(() => {
  //   if (!objectIsEmpty(project) && project.facetsUrl) {
  //     // cachePagination(paginationOptions);
  //     // setCachedData({ ...cachedData, pagination: paginationOptions });

  //     const queryWithCompleteProject = {
  //       ...activeSearchQuery,
  //       project: currentProject,
  //     };
  //     const reqUrl = generateSearchURLQuery(queryWithCompleteProject, paginationOptions);
  //     setCurrentRequestURL(reqUrl);
  //   }
  // }, [activeSearchQuery, project, paginationOptions, currentProject]);

  // Check if a text filter has already been applied
  React.useEffect(() => {
    setFiltersExist(checkFiltersExist(activeFacets, textInputs));
  }, [activeFacets, textInputs]);

  // Run each time activeQuery, project or paginations is changed
  React.useEffect(() => {
    const hasFullProject = project.pk !== undefined && project.name !== undefined;

    if (hasFullProject && !isEqual(activeSearchQuery, lastActiveSearchQuery.current)) {
      // Capture the current query when making the request
      // currentRequestQueryRef.current = activeSearchQuery;

      // const cached = getCachedSearchResults();
      // const cachedURL = (cached?.cachedURL as string) || '';

      // if (currentRequestURL === cachedURL) {
      //   setCachedResults(cached);
      // } else {
      //   setCachedResults(undefined);

      let newSearchQuery = activeSearchQuery;

      // If project changed, reset the active search query to base
      if (
        objectIsEmpty(lastActiveSearchQuery.current) ||
        activeSearchQuery.project.pk !== lastActiveSearchQuery.current.project.pk
      ) {
        newSearchQuery = projectBaseQuery(activeSearchQuery.project);
      }

      lastActiveSearchQuery.current = newSearchQuery;

      // Note, since we're running a new search query, we reset to page 1
      run(newSearchQuery, { ...paginationOptions, page: 1 });

      // }
    }
  }, [run, activeSearchQuery, paginationOptions, project]);

  // // Process results: cache and parse facets
  // React.useEffect(() => {
  //   if (error) {
  //     return;
  //   }

  //   if (dataResponse && !objectIsEmpty(dataResponse)) {
  //     setParsedFacets(dataResponse.searchFacets);
  //   }
  // }, [dataResponse, error]);

  // Process results: cache and parse facets
  // React.useEffect(() => {
  //   if (error) {
  //     return;
  //   }

  //   if (dataResponse && !objectIsEmpty(dataResponse)) {
  //     // memoizedCacheSearchResults(
  //     //   results,
  //     //   paginationOptions,
  //     //   currentRequestURL,
  //     //   currentRequestQueryRef.current || activeSearchQuery,
  //     // );

  //     // Non-STAC: facet_counts format
  //     if (dataResponse.facet_counts) {
  //       const { facet_fields: facetFields } = (
  //         dataResponse as {
  //           facet_counts: { facet_fields: RawFacets };
  //         }
  //       ).facet_counts;
  //       setParsedFacets(parseFacets(facetFields));
  //     }
  //     // STAC or generic facets format
  //     else if (dataResponse.facets) {
  //       const { facets } = dataResponse as { facets: ParsedFacets | Record<string, unknown> };
  //       setParsedFacets(facets);
  //     }

  //     // setCachedData({
  //     //   ...cachedData,
  //     //   searchFacets: parsedFacets,
  //     //   pagination: paginationOptions,
  //     //   searchQuery: activeSearchQuery,
  //     //   searchHash: convertActiveSearchToHash(activeSearchQuery),
  //     // });
  //   }
  // }, [dataResponse, error, currentRequestURL, paginationOptions, activeSearchQuery, project.name]);

  // Update the facets list
  // React.useEffect(() => {
  //   if (!objectIsEmpty(parsedFacets)) {
  //     setAvailableFacets(parsedFacets);
  //   }
  // }, [parsedFacets, setAvailableFacets]);

  // Update lastSuccessfulSearch only when new data arrives successfully
  // React.useEffect(() => {
  //   if (
  //     !error &&
  //     data &&
  //     !objectIsEmpty(data) &&
  //     !objectIsEmpty(parsedFacets) &&
  //     currentRequestQueryRef.current
  //   ) {
  //     setLastSuccessfulSearch({
  //       results: data,
  //       query: currentRequestQueryRef.current, // Use the query that was active when request was made
  //       facets: parsedFacets,
  //     });
  //   }
  // }, [data, error, parsedFacets]);

  // Use fallback facets on error
  // React.useEffect(() => {
  //   if (showCachedResultsOnError && !objectIsEmpty(fallbackFacets)) {
  //     setAvailableFacets(fallbackFacets);
  //   }
  // }, [showCachedResultsOnError, fallbackFacets, setAvailableFacets]);

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
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

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
              disabled={isLoading || totalMatched === 0}
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
              disabled={isLoading || totalMatched === 0}
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
              disabled={isLoading || totalMatched === 0}
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
              disabled={isLoading || totalMatched === 0}
            >
              <CodeOutlined data-testid="copy-intake-search-btn" /> Copy Intake-ESGF search command
            </Button>
          </span>
        </Tooltip>
      ),
    },
  ];

  /* istanbul ignore next -- @preserve */
  const setDownloadAllForm = (value: boolean) => () => setShowDownloadAllForm(value);

  // const errorDescription = React.useMemo(() => {
  //   if (!showCachedResultsOnError) return null;

  //   const problematicFacetsList = Array.from(problematicFacets);
  //   const is422Error = error?.cause === 422;

  //   if (problematicFacetsList.length > 0 && is422Error) {
  //     const facetList = problematicFacetsList
  //       .map((facet) => {
  //         const [key, value] = facet.split(':');
  //         return `${key}: "${value}"`;
  //       })
  //       .join(', ');

  //     return (
  //       <>
  //         Unable to fetch results. The following facet(s) may be causing the error:{' '}
  //         <strong>{facetList}</strong>. These are highlighted below.{' '}
  //         <Button type="link" size="small" onClick={handleRevertToLastSuccessfulQuery}>
  //           Revert to last successful search
  //         </Button>
  //         .
  //       </>
  //     );
  //   }

  //   return <>Unable to fetch latest results. Displaying last successful search.</>;
  // }, [
  //   showCachedResultsOnError,
  //   problematicFacets,
  //   error,
  //   fallbackQuery,
  //   handleRevertToLastSuccessfulQuery,
  // ]);

  if (error /* && !showCachedResultsOnError */) {
    const errorMessage =
      error.cause === 422
        ? 'Invalid search query. Try adjusting filters or selecting a different project.'
        : 'Failed to fetch results. Try again or select a different project.';

    return (
      <div data-testid="alert-fetching">
        {contextHolder}
        <Alert message={errorMessage} type="error" showIcon />
      </div>
    );
  }

  return (
    <div data-testid="search">
      {contextHolder}
      {/* {showCachedResultsOnError && (
        <Alert
          message="Search Error - Showing Previous Results"
          description={errorDescription}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          data-testid="cached-results-warning"
        />
      )} */}
      <div
        className={searchTableTargets.searchFeaturesArea.class()}
        data-testid="search-features-wrapper"
      >
        <div style={styles.summary}>
          {objectIsEmpty(project) && (
            <Alert message="Select a project to search for results" type="info" showIcon />
          )}
          <h3>
            {isLoading && <span style={styles.resultsHeader}>Loading latest results for </span>}
            {resultsToDisplay && !isLoading && (
              <span
                className={searchTableTargets.resultsFoundText.class()}
                style={styles.resultsHeader}
                data-testid="search-results-span"
              >
                {totalMatched.toLocaleString()} results found for{' '}
              </span>
            )}
            <span style={styles.resultsHeader}>{(project as RawProject).name}</span>
          </h3>
          <div>
            {resultsToDisplay && (
              <Space>
                {currentProject.isSTAC && (
                  <>
                    <Tooltip
                      placement="bottom"
                      title={
                        totalMatched >= 10000
                          ? 'To use the Download All feature, please narrow down your search to less than 10,000 results.'
                          : 'Open form to download the current search results.'
                      }
                    >
                      <Button
                        type="default"
                        shape="round"
                        className={searchTableTargets.downloadSearchBtn.class()}
                        onClick={setDownloadAllForm(true)}
                        disabled={isLoading || totalMatched === 0 || totalMatched >= 10000}
                      >
                        <DownloadOutlined />
                        Download All Results{' '}
                      </Button>{' '}
                    </Tooltip>
                    <DownloadModal
                      show={showDownloadAllForm}
                      hide={setDownloadAllForm(false)}
                      searchURL={getUrlFromSearch(activeSearchQuery)}
                      stacResults={isStac ? (accumulatedResults as StacFeature[]) : []}
                      totalMatched={totalMatched}
                      activeSearchQuery={activeSearchQuery}
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
                      totalMatched === 0 ||
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
                  onClick={() => handleSaveSearchQuery(currentRequestURL, totalMatched)}
                  disabled={isLoading || totalMatched === 0}
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
          {resultsToDisplay && (
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
        {resultsToDisplay /* || showCachedResultsOnError */ && (
          <Row style={styles.filtersContainer}>
            {Object.keys(activeFacets).length !== 0 &&
              Object.keys(activeFacets).map((facet: string) =>
                activeFacets[facet].map((variable: string) => {
                  const facetKey = `${facet}:${variable}`;
                  // const isProblematic = problematicFacets.has(facetKey);
                  return (
                    <div key={variable} data-testid={variable}>
                      {/* {isProblematic ? (
                        <Tooltip
                          title="This facet may be causing the search error. Try removing it to see if the search succeeds."
                          placement="top"
                        >
                          <span>
                            <Tag
                              value={[facet, variable]}
                              onClose={handleRemoveFilter}
                              type="facet"
                              color="warning"
                            >
                              {variable}
                            </Tag>
                          </span>
                        </Tooltip>
                      ) : ( */}
                      <Tag value={[facet, variable]} onClose={handleRemoveFilter} type="facet">
                        {variable}
                      </Tag>
                      {/* )} */}
                    </div>
                  );
                }),
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
                loading={isLoading}
                results={loadedPageResults}
                totalResults={Math.min(totalMatched, isStac ? batchSize : MAX_NON_STAC_RESULTS)}
                currentPage={paginationOptions.page}
                currentPageSize={paginationOptions.pageSize}
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
          {resultsToDisplay && currentRequestURL && (
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
