import {
  BookOutlined,
  ExportOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import humps from 'humps';
import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import {
  convertResultTypeToReplicaParam,
  fetchSearchResults,
  generateSearchURLQuery,
} from '../../api';
import { clickableRoute } from '../../api/routes';
import { searchTableTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import { objectIsEmpty } from '../../common/utils';
import { UserCart } from '../Cart/types';
import { Tag, TagType, TagValue } from '../DataDisplay/Tag';
import {
  ActiveFacets,
  ParsedFacets,
  RawFacets,
  RawProject,
} from '../Facets/types';
import Alert from '../Feedback/Alert';
import Button from '../General/Button'; // Note, tooltips do not work for this button
import { NodeStatusArray } from '../NodeStatus/types';
import Table from './Table';
import {
  ActiveSearchQuery,
  Pagination,
  RawSearchResult,
  RawSearchResults,
  ResultType,
  TextInputs,
  VersionDate,
  VersionType,
} from './types';

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
  const res = (facets as unknown) as ParsedFacets;
  const keys: string[] = Object.keys(facets);

  keys.forEach((key) => {
    res[key] = res[key].reduce((r, a, i) => {
      if (i % 2) {
        r[r.length - 1].push((a as unknown) as number);
      } else {
        r.push([a] as never);
      }
      return r;
    }, ([] as unknown) as [string, number][]);
  });
  return res;
};

/**
 * Stringifies the active filters to output in a formatted structure.
 * Example: '(Text Input = 'Solar') AND (source_type = AER OR AOGCM OR BGC)'
 */
export const stringifyFilters = (
  versionType: VersionType,
  resultType: ResultType,
  minVersionDate: VersionDate,
  maxVersionDate: VersionDate,
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs | []
): string => {
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
      filtersArr.push(
        `(${humps.decamelize(key)} = ${(activeFacets as ActiveFacets)[key].join(
          ' OR '
        )})`
      );
    });
  }

  const filtersStr =
    filtersArr.length > 0
      ? `${filtersArr.join(' AND ')}`
      : 'No filters applied';
  return filtersStr;
};

export const checkFiltersExist = (
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs
): boolean => !(objectIsEmpty(activeFacets) && textInputs.length === 0);

export type Props = {
  activeSearchQuery: ActiveSearchQuery;
  userCart: UserCart | [];
  nodeStatus?: NodeStatusArray;
  onRemoveFilter: (removedTag: TagValue, type: TagType) => void;
  onClearFilters: () => void;
  onUpdateCart: (
    selectedItems: RawSearchResults,
    operation: 'add' | 'remove'
  ) => void;
  onUpdateAvailableFacets: (parsedFacets: ParsedFacets) => void;
  onSaveSearchQuery: (url: string) => void;
  onShareSearchQuery: () => void;
};

const Search: React.FC<Props> = ({
  activeSearchQuery,
  userCart,
  nodeStatus,
  onRemoveFilter,
  onClearFilters,
  onUpdateCart,
  onUpdateAvailableFacets,
  onSaveSearchQuery,
  onShareSearchQuery,
}) => {
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

  const { data: results, error, isLoading, run } = useAsync({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deferFn: (fetchSearchResults as unknown) as DeferFn<Record<string, any>>,
  });
  const [filtersExist, setFiltersExist] = React.useState<boolean>(false);
  const [parsedFacets, setParsedFacets] = React.useState<
    ParsedFacets | Record<string, unknown>
  >({});
  const [currentRequestURL, setCurrentRequestURL] = React.useState<
    string | null
  >(null);
  const [selectedItems, setSelectedItems] = React.useState<
    RawSearchResults | []
  >([]);

  const [paginationOptions, setPaginationOptions] = React.useState<Pagination>({
    page: 1,
    pageSize: 10,
  });

  // Generate the current request URL based on filters
  React.useEffect(() => {
    if (!objectIsEmpty(project)) {
      const reqUrl = generateSearchURLQuery(
        activeSearchQuery,
        paginationOptions
      );
      setCurrentRequestURL(reqUrl);
    }
  }, [activeSearchQuery, project, paginationOptions]);

  React.useEffect(() => {
    setFiltersExist(checkFiltersExist(activeFacets, textInputs));
  }, [activeFacets, textInputs]);

  // Fetch search results
  React.useEffect(() => {
    if (!objectIsEmpty(project) && currentRequestURL) {
      run(currentRequestURL);
    }
  }, [run, currentRequestURL, project]);

  // Update the available facets based on the returned results
  React.useEffect(() => {
    if (results && !objectIsEmpty(results)) {
      const { facet_fields: facetFields } = (results as {
        facet_counts: { facet_fields: RawFacets };
      }).facet_counts;
      setParsedFacets(parseFacets(facetFields));
    }
  }, [results]);

  React.useEffect(() => {
    onUpdateAvailableFacets(parsedFacets as ParsedFacets);
  }, [parsedFacets, onUpdateAvailableFacets]);

  const handleRowSelect = (selectedRows: RawSearchResults | []): void => {
    // If you select rows on one page of the table, then go to another page
    // and select more rows, the rows from the previous page transform from
    // objects to undefined in the array. To work around this, filter out the
    // undefined values.
    // https://github.com/ant-design/ant-design/issues/24243
    const rows = (selectedRows as RawSearchResults).filter(
      (row: RawSearchResult) => row !== undefined
    );
    setSelectedItems(rows);
  };

  const handlePageChange = (page: number, pageSize: number): void => {
    setPaginationOptions({ page, pageSize });
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

  if (error) {
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
  let docs: RawSearchResults = [];
  if (results) {
    numFound = (results as { response: { numFound: number } }).response
      .numFound;
    docs = (results as { response: { docs: RawSearchResults } }).response.docs;
  }

  const allSelectedItemsInCart =
    selectedItems.filter(
      (item: RawSearchResult) =>
        !userCart.some(
          /* istanbul ignore next */
          (dataset: RawSearchResult) => dataset.id === item.id
        )
    ).length === 0;

  return (
    <div
      data-testid="search"
      className={searchTableTargets.getClass('searchResultsTable')}
    >
      <div style={styles.summary}>
        {objectIsEmpty(project) && (
          <Alert
            message="Select a project to search for results"
            type="info"
            showIcon
          />
        )}
        <h3>
          {isLoading && (
            <span style={styles.resultsHeader}>
              Loading latest results for{' '}
            </span>
          )}
          {results && !isLoading && (
            <span
              className={searchTableTargets.getClass('resultsFoundText')}
              style={styles.resultsHeader}
            >
              {numFound.toLocaleString()} results found for{' '}
            </span>
          )}
          <span style={styles.resultsHeader}>
            {(project as RawProject).name}
          </span>
        </h3>
        <div>
          {results && (
            <div>
              <Button
                type="default"
                className={searchTableTargets.getClass('addSelectedToCartBtn')}
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
              <Button
                className={searchTableTargets.getClass('saveSearchBtn')}
                type="default"
                onClick={() => onSaveSearchQuery(currentRequestURL as string)}
                disabled={isLoading || numFound === 0}
              >
                <BookOutlined />
                Save Search
              </Button>{' '}
              <Button
                type="default"
                className={searchTableTargets.getClass('copySearchLinkBtn')}
                onClick={() => onShareSearchQuery()}
                disabled={isLoading || numFound === 0}
              >
                <ShareAltOutlined />
                Copy Search
              </Button>
            </div>
          )}
        </div>
      </div>
      <div>
        {results && (
          <>
            <p>
              <span style={styles.subtitles}>Query String: </span>
              <Typography.Text
                className={searchTableTargets.getClass('queryString')}
                code
              >
                {stringifyFilters(
                  versionType,
                  resultType,
                  minVersionDate,
                  maxVersionDate,
                  activeFacets,
                  textInputs
                )}
              </Typography.Text>
            </p>
          </>
        )}
      </div>

      {results && (
        <Row style={styles.filtersContainer}>
          {Object.keys(activeFacets).length !== 0 &&
            Object.keys(activeFacets).map((facet: string) =>
              (activeFacets as ActiveFacets)[facet].map((variable: string) => (
                <div key={variable} data-testid={variable}>
                  <Tag
                    value={[facet, variable]}
                    onClose={onRemoveFilter}
                    type="facet"
                  >
                    {variable}
                  </Tag>
                </div>
              ))
            )}
          {textInputs.length !== 0 &&
            (textInputs as TextInputs).map((input: string) => (
              <div key={input} data-testid={input}>
                <Tag value={input} onClose={onRemoveFilter} type="text">
                  {input}
                </Tag>
              </div>
            ))}
          {filenameVars.length !== 0 &&
            (filenameVars as TextInputs).map((input: string) => (
              <div key={input} data-testid={input}>
                <Tag value={input} onClose={onRemoveFilter} type="filenameVar">
                  Filename Search: {input}
                </Tag>
              </div>
            ))}
          {filtersExist && (
            <Button
              type="primary"
              danger
              size="small"
              onClick={() => onClearFilters()}
            >
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
                userCart={userCart}
                nodeStatus={nodeStatus}
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
                userCart={userCart}
                onUpdateCart={onUpdateCart}
              />
            )}
          </div>
        </Col>
        {results && currentRequestURL && (
          <Button
            type="default"
            href={clickableRoute(currentRequestURL)}
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
