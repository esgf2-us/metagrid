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
  clearCachedSearchResults,
  createEsgpullCommand,
  createIntakeEsgfSearch,
  createSearchRouteURL,
  getCachedPagination,
  getStyle,
  getUrlFromSearch,
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
  loadedBatches: number;
  loadNextBatch: boolean;
  totalMatched: number;
  loading: boolean;
  loaded: boolean;
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

  // STAC pagination state
  const [stacLoadedBatches, setStacLoadedBatches] = React.useState<StacBatchLoading>({
    results: [],
    nextToken: undefined,
    projectName: '',
    loadedBatches: 0,
    loadNextBatch: false,
    totalMatched: 0,
    loading: false,
    loaded: false,
  });

  // Track whether current fetch is background (silent) or user-initiated (show loading)
  const [isBackgroundFetch, setIsBackgroundFetch] = React.useState<boolean>(false);

  const results: Record<string, unknown> | undefined = data;

  // Reset STAC state when project changes
  React.useEffect(() => {
    if (currentProject.isSTAC) {
      const currentProjectName = (project.name as string) || '';
      setIsBackgroundFetch(false);

      clearCachedSearchResults();
      setStacLoadedBatches({
        results: [],
        nextToken: undefined,
        projectName: currentProjectName,
        loadedBatches: 0,
        loadNextBatch: false,
        totalMatched: 0,
        loading: false,
        loaded: false,
      });

      // Reset pagination to page 1
      setPaginationOptions({ page: 1, pageSize: paginationOptions.pageSize });
    }
  }, [activeSearchQuery, currentProject.isSTAC, project.name, paginationOptions.pageSize]);

  // Generate the current request URL based on filters
  React.useEffect(() => {
    if (!objectIsEmpty(project)) {
      // Cache the pagination options in case they were changed
      cachePagination(paginationOptions);

      // Generate the search URL
      const reqUrl = generateSearchURLQuery(activeSearchQuery, paginationOptions);
      setCurrentRequestURL(reqUrl);
    }
  }, [activeSearchQuery, project, paginationOptions]);

  React.useEffect(() => {
    setFiltersExist(checkFiltersExist(activeFacets, textInputs));
  }, [activeFacets, textInputs]);

  // Fetch search results
  React.useEffect(() => {
    if (!objectIsEmpty(project) && currentRequestURL) {
      if (currentProject.isSTAC) {
        // For STAC: Only fetch initial batch, other batches triggered from handlers
        if (stacLoadedBatches.results.length < 1 && !stacLoadedBatches.loading) {
          run(currentRequestURL);
        }
      } else {
        // For non-STAC, fetch normally on URL change
        run(currentRequestURL);
      }
    }
  }, [run, currentRequestURL, project, currentProject.isSTAC]);

  // Update the available facets based on the returned results
  React.useEffect(() => {
    if (results && currentRequestURL && !objectIsEmpty(results)) {
      cacheSearchResults(results, paginationOptions, currentRequestURL);
      /* istanbul ignore else -- @preserve */
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

      // Extract STAC pagination tokens and accumulate results
      if (currentProject.isSTAC && results.stac && results.search) {
        const stacResponse = results as StacResponse;
        const { links, features } = stacResponse.search;

        // Get total matched count
        const searchData = stacResponse.search as {
          numberMatched?: number;
          numMatched?: number;
          features?: StacFeature[];
        };
        const totalMatched = searchData.numberMatched || searchData.numMatched || 0;

        // Convert STAC features to our format
        const newDocs =
          features && features.length > 0
            ? features.map((stacResult: StacFeature) => convertStacToRawSearchResult(stacResult))
            : [];

        // Extract next token
        let nextToken: string | undefined;
        if (links && Array.isArray(links)) {
          const nextLink = links.find((link) => link.rel === 'next');
          nextToken = typeof nextLink?.body?.token === 'string' ? nextLink.body.token : undefined;
        }

        console.log('[Result Processing] Batch received, count:', newDocs.length);
        console.log('[Result Processing] First ID:', newDocs[0]?.id);
        console.log('[Result Processing] Last ID:', newDocs[newDocs.length - 1]?.id);
        console.log('[Result Processing] Next token:', nextToken?.substring(0, 30));

        // Accumulate results: append new batch to existing results
        const currentBatch = stacLoadedBatches.loadedBatches;
        const accumulatedResults =
          currentBatch === 0 ? newDocs : [...stacLoadedBatches.results, ...newDocs];

        console.log('[Result Processing] Current batch number:', currentBatch);
        console.log('[Result Processing] Total accumulated:', accumulatedResults.length);

        // Update state with accumulated results
        setStacLoadedBatches({
          results: accumulatedResults,
          nextToken,
          projectName: (project.name as string) || '',
          loadedBatches: currentBatch + 1,
          loadNextBatch: false,
          totalMatched,
          loading: false,
          loaded: true,
        });

        // Auto-preload next batch if user is approaching end of loaded data
        const currentPage = paginationOptions.page || 1;
        const currentPageSize = paginationOptions.pageSize || 10;
        const currentEndIndex = currentPage * currentPageSize;
        const loadedDataCount = accumulatedResults.length;

        // Preload if user is within 1 batch (100 records) of the end of loaded data
        const isApproachingEnd = currentEndIndex > loadedDataCount - STAC_BATCH_SIZE;

        if (nextToken && isApproachingEnd) {
          console.log('[Auto-preload] Preloading next batch in background');
          setIsBackgroundFetch(true);
          setTimeout(() => {
            run([currentRequestURL, nextToken]);
          }, 100);
        }
      }

      // Original commented code below
      // if (results.stac && results.search) {
      //   const stacResponse = results as StacResponse;
      //   const { links, features } = stacResponse.search;

      //   // Store total matched count
      //   const searchData = stacResponse.search as {
      //     numberMatched?: number;
      //     numMatched?: number;
      //     features?: StacFeature[];
      //   };
      //   const totalMatched = searchData.numberMatched || searchData.numMatched || 0;
      //   setStacTotalMatched(totalMatched);

      //   // Convert and accumulate results
      //   let loadedBatch = -1;
      //   let shouldPreloadNext = false;

      //   if (features && features.length > 0) {
      //     // IMPORTANT: Check if these results are for the current project
      //     // Compare the project in the current activeSearchQuery with what's accumulated
      //     const currentProjectName = (project.name as string) || '';
      //     const previousProjectName = accumulatedResultsProjectRef.current || '';

      //     // Simple rule: only accumulate if no previous project or same project
      //     const canAccumulate = !previousProjectName || previousProjectName === currentProjectName;

      //     if (!canAccumulate) {
      //       // These results are from a different project, skip accumulation
      //       return;
      //     }

      //     const newDocs = features.map((stacResult: StacFeature) =>
      //       convertStacToRawSearchResult(stacResult),
      //     );

      //     // Use stacLoadingBatch to determine where these results belong
      //     loadedBatch = stacLoadingBatch;

      //     // If stacLoadingBatch is still -1 (hasn't updated yet), treat as batch 0
      //     if (loadedBatch === -1) {
      //       loadedBatch = 0;
      //     }

      //     // Check if we've already processed this batch
      //     if (loadedBatch > stacHighestBatchLoaded || loadedBatch === 0) {
      //       // Accumulate results - append sequentially as batches load
      //       setStacLoadedBatches((prev) => {
      //         const startIndex = loadedBatch * STAC_BATCH_SIZE;

      //         if (loadedBatch === 0) {
      //           // First batch - just set it
      //           return newDocs;
      //         }
      //         if (prev.length === startIndex) {
      //           // Next sequential batch - append it
      //           return [...prev, ...newDocs];
      //         }
      //         if (prev.length > startIndex) {
      //           // Already have data at this position - replace it
      //           const newAccumulated = [...prev];
      //           newAccumulated.splice(startIndex, newDocs.length, ...newDocs);
      //           return newAccumulated;
      //         }
      //         // Gap exists - this means we skipped batches (shouldn't happen with sequential loading)
      //         // Just append to avoid null placeholders
      //         return [...prev, ...newDocs];
      //       });

      //       // Track that these accumulated results belong to the current project AND URL
      //       accumulatedResultsProjectRef.current = (project.name as string) || '';
      //       setStacAccumulatedProject((project.name as string) || ''); // Update state too
      //       lastFetchedUrlRef.current = currentRequestURL || '';
      //     }

      //     // Update highest batch loaded
      //     setStacHighestBatchLoaded((prev) => Math.max(prev, loadedBatch));

      //     // Determine if we should preload next batch
      //     // Only preload if the user is close to viewing the data we just loaded
      //     // Check current pagination to see if we're approaching the end of loaded data
      //     const currentPage = paginationOptions.page || 1;
      //     const currentPageSize = paginationOptions.pageSize || 10;
      //     const currentEndIndex = currentPage * currentPageSize;
      //     const loadedDataCount = (loadedBatch + 1) * STAC_BATCH_SIZE;

      //     // Preload if user is within 1 batch (100 records) of the end of loaded data
      //     const isApproachingEnd = currentEndIndex > loadedDataCount - STAC_BATCH_SIZE;

      //     shouldPreloadNext = loadedBatch >= stacHighestBatchLoaded && isApproachingEnd;
      //   }

      //   // Extract next token and handle auto-preload
      //   if (links && Array.isArray(links)) {
      //     const nextLink = links.find((link) => link.rel === 'next');
      //     const nextToken = nextLink?.body?.token;

      //     setStacNextToken(typeof nextToken === 'string' ? nextToken : undefined);

      //     // Auto-preload next batch in background for better UX
      //     // Only if: we have token, we loaded features, we should preload, and haven't already triggered this batch
      //     const nextBatch = loadedBatch + 1;
      //     const willPreload =
      //       nextToken &&
      //       typeof nextToken === 'string' &&
      //       shouldPreloadNext &&
      //       loadedBatch >= 0 &&
      //       preloadTriggeredRef.current !== nextBatch;

      //     if (willPreload) {
      //       // Mark this batch as triggered
      //       preloadTriggeredRef.current = nextBatch;
      //       // Trigger next batch load immediately
      //       setStacLoadingBatch(nextBatch);
      //       setStacTokenToUse(nextToken);
      //     } else {
      //       // Not preloading - just update loading batch to indicate we're done
      //       setStacLoadingBatch(loadedBatch);
      //     }
      //   } else {
      //     // No links means we're at the end or there's only one page
      //     setStacNextToken(undefined);
      //     setStacLoadingBatch(loadedBatch);
      //   }
      // } else {
      //   // Clear tokens if not a STAC search
      //   setStacNextToken(undefined);
      //   setStacTokenToUse(undefined);
      // }
    }
  }, [results]);

  React.useEffect(() => {
    // Only update availableFacets if parsedFacets is not empty
    // This prevents clearing facets UI when navigating back to search page
    if (!objectIsEmpty(parsedFacets)) {
      setAvailableFacets(parsedFacets as ParsedFacets);
    }
  }, [parsedFacets, setAvailableFacets]);

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
    // If you select rows on one page of the table, then go to another page
    // and select more rows, the rows from the previous page transform from
    // objects to undefined in the array. To work around this, filter out the
    // undefined values.
    // https://github.com/ant-design/ant-design/issues/24243
    const rows = (selectedRows as RawSearchResults).filter(
      (row: RawSearchResult) => row !== undefined,
    );
    setSelectedItems(rows);
  };

  const handlePageChange = (page: number, pageSize: number): void => {
    setPaginationOptions({ page, pageSize });

    // For STAC: Check if we need to load more data
    if (currentProject.isSTAC) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const loadedCount = stacLoadedBatches.results.length;

      // Need more data if the page requires data beyond what we've loaded
      const needsMore = endIndex > loadedCount && stacLoadedBatches.nextToken;

      if (needsMore && !stacLoadedBatches.loading) {
        // User-initiated fetch - show loading indicator
        const token = stacLoadedBatches.nextToken;
        console.log('[Page Change] User clicked page, fetching next batch');
        setIsBackgroundFetch(false);
        run([currentRequestURL, token]);
      }
    }
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

  // Memoize stringifyApiRequest to avoid recalculating on every render
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

  // Memoize allSelectedItemsInCart check
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

  if (results) {
    /* istanbul ignore else -- @preserve */
    if (currentProject.isSTAC) {
      const currentProjectName = (project.name as string) || '';

      // Check if loaded results match current project
      const projectMatches =
        currentProjectName &&
        stacLoadedBatches.projectName === currentProjectName &&
        stacLoadedBatches.results.length > 0;

      docs = projectMatches ? stacLoadedBatches.results : [];
      const loadedCount = docs.length;
      const hasMore = !!stacLoadedBatches.nextToken;

      // Use total matched from API for display
      numMatched = stacLoadedBatches.totalMatched || loadedCount;

      // For pagination: show loaded data + one more batch if token exists
      // This allows the user to click the next page to trigger loading
      if (hasMore) {
        paginationTotal = loadedCount + STAC_BATCH_SIZE;
      } else {
        paginationTotal = loadedCount;
      }

      // Cap at actual total if known
      if (stacLoadedBatches.totalMatched > 0 && paginationTotal > stacLoadedBatches.totalMatched) {
        paginationTotal = stacLoadedBatches.totalMatched;
      }
    } else if (results.response) {
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

  const isLoadingInBackground = currentProject.isSTAC && isBackgroundFetch;

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
            {results && (!isLoading || isBackgroundFetch) && (
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
            {results && (
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
                      stacResults={(results as StacResponse).search}
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
          {results && (
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
        {results && (
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
              {results && (!isLoading || isLoadingInBackground) ? (
                <Table
                  loading={false}
                  results={docs}
                  totalResults={currentProject.isSTAC ? paginationTotal : numMatched}
                  filenameVars={activeSearchQuery.filenameVars}
                  isStac={currentProject.isSTAC}
                  onUpdateCart={onUpdateCart}
                  onRowSelect={handleRowSelect}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  scroll={{ y: 'calc(100vh - 480px)', x: 'max-content' }}
                />
              ) : (
                <Table
                  loading={isLoading}
                  results={[]}
                  totalResults={paginationOptions.pageSize}
                  onUpdateCart={onUpdateCart}
                  scroll={{ y: 'calc(100vh - 480px)', x: 'max-content' }}
                />
              )}
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
