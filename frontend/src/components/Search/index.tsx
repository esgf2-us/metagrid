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
import humps from 'humps';
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
  convertResultTypeToReplicaParam,
  fetchSearchResults,
  generateSearchURLQuery,
  ResponseError,
} from '../../api';
import {
  copySearchOptionsTargets,
  searchTableTargets,
} from '../../common/joyrideTutorials/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import {
  cachePagination,
  cacheSearchResults,
  createEsgpullCommand,
  createIntakeEsgfSearch,
  createSearchRouteURL,
  formatBytes,
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
  ResultType,
  StacAsset,
  StacFeature,
  StacResponse,
  TextInputs,
  VersionDate,
  VersionType,
} from './types';
import { AuthContext } from '../../contexts/AuthContext';
import {
  convertSearchParamsIntoStacFilter,
  convertStacToRawSearchResult,
  getDownloadSizeFromSTACsearch,
  getFileCountFromSTACsearch,
} from '../../common/STAC';
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

/**
 * Stringifies the active filters to output in a formatted structure.
 * Example: '(Text Input = 'Solar') AND (source_type = AER OR AOGCM OR BGC)'
 */
export const stringifyFilters = (
  projectName: string | undefined,
  versionType: VersionType,
  resultType: ResultType,
  minVersionDate: VersionDate,
  maxVersionDate: VersionDate,
  activeFacets: ActiveFacets,
  textInputs: TextInputs | [],
  isSTAC: boolean = false,
  reqUrlStr: string = '',
): string => {
  if (isSTAC) {
    const stacFilter = convertSearchParamsIntoStacFilter(reqUrlStr, projectName);
    return JSON.stringify(stacFilter) || 'No filters applied';
  }

  const filtersArr: string[] = [];

  if (versionType === 'latest') {
    filtersArr.push('latest = true');
  }

  const replicaParam = convertResultTypeToReplicaParam(resultType, true);
  if (replicaParam) {
    filtersArr.push(replicaParam);
  }

  if (minVersionDate) {
    filtersArr.push(`min_version = ${minVersionDate}`);
  }

  if (maxVersionDate) {
    filtersArr.push(`max_version = ${maxVersionDate}`);
  }

  if (textInputs.length > 0) {
    filtersArr.push(`(Text Input = ${textInputs.join(' OR ')})`);
  }

  if (!objectIsEmpty(activeFacets)) {
    Object.keys(activeFacets).forEach((key: string) => {
      filtersArr.push(`(${humps.decamelize(key)} = ${activeFacets[key].join(' OR ')})`);
    });
  }

  const filtersStr = filtersArr.length > 0 ? `${filtersArr.join(' AND ')}` : 'No filters applied';
  return filtersStr;
};

export const checkFiltersExist = (
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs,
): boolean => !(objectIsEmpty(activeFacets) && textInputs.length === 0);

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

  const results: Record<string, unknown> | undefined = data;

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
      // Fetch search results (cached or not)
      run(currentRequestURL);

      // Update displayed pagination in case the cachedPagination was changed
      setPaginationOptions(getCachedPagination());
    }
  }, [run, currentRequestURL, project]);

  // Update the available facets based on the returned results
  React.useEffect(() => {
    if (results && currentRequestURL && !objectIsEmpty(results)) {
      cacheSearchResults(results, paginationOptions, currentRequestURL);
      /* istanbul ignore else */
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
    }
  }, [results]);

  React.useEffect(() => {
    setAvailableFacets(parsedFacets as ParsedFacets);
  }, [parsedFacets, setAvailableFacets]);

  const handleClearFilters = (): void => {
    setActiveSearchQuery(projectBaseQuery(activeSearchQuery.project));
  };

  const handleSaveSearchQuery = (url: string, numFound: number): void => {
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
          /* istanbul ignore next */
          (respError: ResponseError) => {
            showError(messageApi, respError.message);
          },
        );
    } else {
      saveSuccess();
    }
  };

  const handleShareSearchQuery = (): void => {
    /* istanbul ignore else */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(getUrlFromSearch(activeSearchQuery));
      showNotice(messageApi, 'Metagrid search URL copied to clipboard!', {
        icon: <ShareAltOutlined />,
      });
    }
  };

  const handleEsgpullSearchQuery = (): void => {
    /* istanbul ignore else */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(createEsgpullCommand(activeSearchQuery, false));
      showNotice(messageApi, 'Esgpull search query copied to clipboard!', {
        icon: <CodeOutlined />,
      });
    }
  };

  const handleEsgpullDownloadCmd = (): void => {
    /* istanbul ignore else */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(createEsgpullCommand(activeSearchQuery, true));
      showNotice(messageApi, 'Esgpull download command copied to clipboard!', {
        icon: <CodeOutlined />,
      });
    }
  };

  const handleIntakeEsgfSearch = (): void => {
    /* istanbul ignore else */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(createIntakeEsgfSearch(activeSearchQuery));
      showNotice(messageApi, 'Intake-ESGF search command copied to clipboard!', {
        icon: <CodeOutlined />,
      });
    }
  };

  const handleDownloadAllSearchResults = (fileCount: number, totalFilesSize: number): void => {
    const stacResults = (results as StacResponse).search;
    const rawSearchResults = stacResults.features.map((feature: StacFeature) =>
      convertStacToRawSearchResult(feature),
    );

    // setShowDownloadAllForm(true);

    if (stacResults.features.length > 0) {
      const assets: { [id: string]: StacAsset } = {};
      const hrefsSet: Set<string> = new Set();
      const globusHrefsSet: Set<string> = new Set();
      stacResults.features.forEach((feature: StacFeature, idx: number) => {
        if (feature.assets) {
          // const globusHref = getStacGlobusHref(feature.assets);
          // if (feature.assets.globus) {
          //   globusAssets.push(feature.assets.globus);
          //   globusHrefsSet.add(feature.assets.globus.href);
          // }
          Object.values(feature.assets).forEach((asset, innerIdx) => {
            assets[`asset_${idx}_${innerIdx}`] = {
              ...asset,
              id: `asset_${idx}_${innerIdx}`,
            };
            if (asset.type && asset.type === 'text/html') {
              globusHrefsSet.add(asset.href);
            } else if (asset.href && asset.href.startsWith('http') && asset.href.endsWith('.nc')) {
              hrefsSet.add(asset.href);
            }
          });
        }
      });

      // const assets: {
      //   [name: string]: StacAsset;
      // } = {};
      // globusAssets.forEach((asset, idx) => {
      //   assets[`globus_link_${idx}`] = {
      //     ...asset,
      //     id: `globus_link_${idx}`,
      //     title: `Globus Asset ${idx}`,
      //   };
      // });

      const singleSTACitem: RawSearchResult = {
        id: 'all_search_results',
        master_id: `Search Results (${fileCount.toLocaleString()} Files - Size: ${formatBytes(totalFilesSize)})`,
        size: totalFilesSize,
        number_of_files: fileCount,
        access: ['Globus'],
        isStac: true,
        assets,
        wgetHrefs: hrefsSet,
        globusHrefs: globusHrefsSet,
        title: `All search results for ${getUrlFromSearch(activeSearchQuery)}`,
      };

      onUpdateCart([singleSTACitem], 'add');
    }

    // generateWgetScriptSTAC(
    //   stacResults.features.map((feature: StacFeature) => convertStacToRawSearchResult(feature)),
    //   getUrlFromSearch(activeSearchQuery),
    // );
  };

  const handleRemoveFilter = (removedTag: TagValue, type: TagType): void => {
    /* istanbul ignore else */
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
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

  // Used cached results if the request fails
  if (error) {
    /* istanbul ignore next */
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

  let numFound = 0;
  let fileCount = 0;
  let totalFilesSize = 0;
  let docs: RawSearchResults = [];
  type LoadedResults = {
    cachedURL: string;
    response: { docs: RawSearchResults; numFound: number };
  };
  if (results) {
    if (currentProject.isSTAC) {
      const searchResults = results as StacResponse;
      if (searchResults.search) {
        const stacResults = searchResults.search;

        if (stacResults.features && stacResults.features.length > 0) {
          numFound = stacResults.features.length;
          docs = stacResults.features.map((stacResult: StacFeature) =>
            convertStacToRawSearchResult(stacResult),
          );
          fileCount = getFileCountFromSTACsearch(stacResults.features);
          totalFilesSize = getDownloadSizeFromSTACsearch(stacResults.features);
        }
      }
    } else if (results.response) {
      numFound = (results as LoadedResults).response.numFound;
      docs = (results as LoadedResults).response.docs.map((doc) => ({
        ...doc,
        isStac: false,
      }));
    }
  }

  const allSelectedItemsInCart =
    selectedItems.filter(
      (item: RawSearchResult) =>
        !userCart.some(
          /* istanbul ignore next */
          (dataset: RawSearchResult) => dataset.id === item.id,
        ),
    ).length === 0;

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
              disabled={isLoading || numFound === 0}
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
        <Tooltip
          placement="left"
          title={
            currentProject.isSTAC
              ? tooltipText.featureNotAvailableInStac
              : tooltipText.copyEsgpullSearch
          }
        >
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copyEsgpullSearchQueryBtn.class()}
              onClick={handleEsgpullSearchQuery}
              disabled={isLoading || numFound === 0 || currentProject.isSTAC}
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
        <Tooltip
          placement="left"
          title={
            currentProject.isSTAC
              ? tooltipText.featureNotAvailableInStac
              : tooltipText.copyEsgpullDownload
          }
        >
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copyEsgpullDownloadCommandBtn.class()}
              onClick={handleEsgpullDownloadCmd}
              disabled={isLoading || numFound === 0 || currentProject.isSTAC}
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
        <Tooltip
          placement="left"
          title={
            currentProject.isSTAC
              ? tooltipText.featureNotAvailableInStac
              : tooltipText.copyIntakeEsgfSearch
          }
        >
          <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
            <Button
              type="default"
              className={copySearchOptionsTargets.copyIntakeEsgfSearchBtn.class()}
              onClick={handleIntakeEsgfSearch}
              disabled={isLoading || numFound === 0 || currentProject.isSTAC}
            >
              <CodeOutlined data-testid="copy-intake-search-btn" /> Copy Intake-ESGF search command
            </Button>
          </span>
        </Tooltip>
      ),
    },
  ];

  return (
    <div data-testid="search" className={searchTableTargets.searchResultsTable.class()}>
      {contextHolder}
      <div style={styles.summary}>
        {objectIsEmpty(project) && (
          <Alert message="Select a project to search for results" type="info" showIcon />
        )}
        <h3>
          {isLoading && <span style={styles.resultsHeader}>Loading latest results for </span>}
          {results && !isLoading && (
            <span
              className={searchTableTargets.resultsFoundText.class()}
              style={styles.resultsHeader}
              data-testid="search-results-span"
            >
              {numFound.toLocaleString()} results found for{' '}
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
                    title="Generates a wget download script for the current search results. The total file count and total download size are shown on the button."
                  >
                    <Button
                      type="default"
                      shape="round"
                      className={searchTableTargets.downloadSearchBtn.class()}
                      onClick={() => {
                        handleDownloadAllSearchResults(fileCount, totalFilesSize);
                      }}
                      disabled={isLoading || numFound === 0}
                    >
                      <DownloadOutlined />
                      Download All Results ({fileCount.toLocaleString()} Files - Size:{' '}
                      {formatBytes(totalFilesSize)})
                    </Button>{' '}
                  </Tooltip>
                  <DownloadModal
                    show={showDownloadAllForm}
                    hide={() => setShowDownloadAllForm(false)}
                  />
                </>
              )}
              <Tooltip placement="bottom" title="Add the selected datasets to your download cart.">
                <Button
                  type="default"
                  className={searchTableTargets.addSelectedToCartBtn.class()}
                  onClick={() => onUpdateCart(selectedItems, 'add')}
                  disabled={
                    isLoading ||
                    numFound === 0 ||
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
                onClick={() => handleSaveSearchQuery(currentRequestURL, numFound)}
                disabled={isLoading || numFound === 0}
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
              {currentProject.isSTAC ? 'STAC Filter String:' : 'Query String:'}{' '}
            </span>
            <Typography.Text className={searchTableTargets.queryString.class()} code>
              {stringifyFilters(
                currentProject.name,
                versionType,
                resultType,
                minVersionDate,
                maxVersionDate,
                activeFacets,
                textInputs,
                currentProject.isSTAC,
                currentRequestURL,
              )}
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

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <div data-testid="search-table">
            {results && !isLoading ? (
              <Table
                loading={false}
                results={docs}
                totalResults={numFound}
                filenameVars={activeSearchQuery.filenameVars}
                onUpdateCart={onUpdateCart}
                onRowSelect={handleRowSelect}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            ) : (
              <Table
                loading={isLoading}
                results={[]}
                totalResults={paginationOptions.pageSize}
                onUpdateCart={onUpdateCart}
              />
            )}
          </div>
        </Col>
        {results && currentRequestURL && (
          <Button
            type="default"
            href={createSearchRouteURL(currentRequestURL)}
            target="_blank"
            icon={<ExportOutlined />}
          >
            Open as JSON
          </Button>
        )}
      </Row>
    </div>
  );
};

export default Search;
