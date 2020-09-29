import {
  BookOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import humps from 'humps';
import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import { fetchResults, genUrlQuery } from '../../api';
import { clickableRoute } from '../../api/routes';
import { CSSinJS } from '../../common/types';
import { objectIsEmpty } from '../../common/utils';
import { UserCart } from '../Cart/types';
import { Tag, TagType } from '../DataDisplay/Tag';
import {
  ActiveFacets,
  DefaultFacets,
  ParsedFacets,
  RawFacets,
  RawProject,
} from '../Facets/types';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Table from './Table';
import { RawSearchResults, TextInputs } from './types';

const styles: CSSinJS = {
  summary: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
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
  defaultFacets: DefaultFacets,
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs | []
): string => {
  const strFilters: string[] = [];

  Object.keys(defaultFacets).forEach((key: string) => {
    strFilters.push(`(${key} = ${defaultFacets[key].toString()})`);
  });

  if (textInputs.length > 0) {
    strFilters.push(`(Text Input = ${textInputs.join(' OR ')})`);
  }

  if (!objectIsEmpty(activeFacets)) {
    Object.keys(activeFacets).forEach((key: string) => {
      strFilters.push(
        `(${humps.decamelize(key)} = ${(activeFacets as ActiveFacets)[key].join(
          ' OR '
        )})`
      );
    });
  }

  const strResult = `${strFilters.join(' AND ')}`;
  return strResult;
};

export const checkFiltersExist = (
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs
): boolean => {
  return !(objectIsEmpty(activeFacets) && textInputs.length === 0);
};

export type Props = {
  activeProject: RawProject | Record<string, unknown>;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  userCart: UserCart | [];
  onRemoveFilter: (removedTag: TagType, type: string) => void;
  onClearFilters: () => void;
  onUpdateCart: (
    selectedItems: RawSearchResults,
    operation: 'add' | 'remove'
  ) => void;
  onUpdateProjectFacets: (parsedFacets: ParsedFacets) => void;
  onSaveSearchQuery: (url: string) => void;
};

const Search: React.FC<Props> = ({
  activeProject,
  defaultFacets,
  activeFacets,
  textInputs,
  userCart,
  onRemoveFilter,
  onClearFilters,
  onUpdateCart,
  onUpdateProjectFacets,
  onSaveSearchQuery,
}) => {
  const { data: results, error, isLoading, run } = useAsync({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deferFn: (fetchResults as unknown) as DeferFn<Record<string, any>>,
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
  const [paginationOptions, setPaginationOptions] = React.useState<{
    page: number;
    pageSize: number;
  }>({
    page: 1,
    pageSize: 10,
  });

  // Generate the current request URL based on filters
  React.useEffect(() => {
    if (!objectIsEmpty(activeProject)) {
      const reqUrl = genUrlQuery(
        (activeProject as RawProject).facetsUrl,
        defaultFacets,
        activeFacets,
        textInputs,
        paginationOptions
      );
      setCurrentRequestURL(reqUrl);
    }
  }, [
    activeProject,
    defaultFacets,
    activeFacets,
    textInputs,
    paginationOptions,
  ]);

  React.useEffect(() => {
    setFiltersExist(checkFiltersExist(activeFacets, textInputs));
  }, [activeFacets, textInputs]);

  // Fetch search results
  React.useEffect(() => {
    if (!objectIsEmpty(activeProject) && currentRequestURL) {
      run(currentRequestURL);
    }
  }, [run, currentRequestURL, activeProject]);

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
    onUpdateProjectFacets(parsedFacets as ParsedFacets);
  }, [parsedFacets, onUpdateProjectFacets]);

  const handleRowSelect = (selectedRows: RawSearchResults | []): void => {
    setSelectedItems(selectedRows);
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

  return (
    <div data-testid="search">
      <div style={styles.summary}>
        {objectIsEmpty(activeProject) && (
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
            <span style={styles.resultsHeader}>
              {numFound.toLocaleString()} results found for{' '}
            </span>
          )}
          <span style={styles.resultsHeader}>
            {(activeProject as RawProject).name}
          </span>
        </h3>
        <div>
          {results && (
            <div>
              <Button
                type="default"
                onClick={() => onSaveSearchQuery(currentRequestURL as string)}
                disabled={isLoading || numFound === 0}
              >
                <BookOutlined />
                Save Search
              </Button>{' '}
              <Button
                type="default"
                onClick={() => onUpdateCart(selectedItems, 'add')}
                disabled={
                  isLoading || numFound === 0 || !(selectedItems.length > 0)
                }
              >
                <ShoppingCartOutlined />
                Add Selected to Cart
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
              <Typography.Text code>
                {stringifyFilters(defaultFacets, activeFacets, textInputs)}
              </Typography.Text>
            </p>
          </>
        )}
      </div>

      {results && (
        <Row style={styles.filtersContainer}>
          {Object.keys(activeFacets).length !== 0 &&
            Object.keys(activeFacets).map((facet: string) => {
              return (activeFacets as ActiveFacets)[facet].map(
                (variable: string) => {
                  return (
                    <div key={variable} data-testid={variable}>
                      <Tag
                        value={[facet, variable]}
                        onClose={onRemoveFilter}
                        type="facet"
                      >
                        {variable}
                      </Tag>
                    </div>
                  );
                }
              );
            })}
          {textInputs.length !== 0 &&
            (textInputs as TextInputs).map((input: string) => {
              return (
                <div key={input} data-testid={input}>
                  <Tag value={input} onClose={onRemoveFilter} type="text">
                    {input}
                  </Tag>
                </div>
              );
            })}
          {filtersExist && (
            <Tag
              value="clearAll"
              color="#f50"
              type="close all"
              onClose={() => onClearFilters()}
            >
              Clear All
            </Tag>
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
