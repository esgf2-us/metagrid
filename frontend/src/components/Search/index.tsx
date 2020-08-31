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
import { isEmpty } from '../../utils/utils';
import Tag from '../DataDisplay/Tag';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Table from './Table';

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
 * Stringifies the active filters
 * Example of output: '(Text Input = 'Solar') AND (source_type = AER OR AOGCM OR BGC)'
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

  if (!isEmpty(activeFacets)) {
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

/**
 * Checks if filters exist for a search
 */
export const checkFiltersExist = (
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs
): boolean => {
  return !(isEmpty(activeFacets) && textInputs.length === 0);
};

export type Props = {
  activeProject: Project | Record<string, unknown>;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  cart: Cart | [];
  onRemoveTag: (removedTag: Tag, type: string) => void;
  onClearTags: () => void;
  handleCart: (
    selectedItems: RawSearchResult[],
    operation: 'add' | 'remove'
  ) => void;
  setAvailableFacets: (parsedFacets: ParsedFacets) => void;
  handleSaveSearch: (url: string) => void;
};

const Search: React.FC<Props> = ({
  activeProject,
  defaultFacets,
  activeFacets,
  textInputs,
  cart,
  onRemoveTag,
  onClearTags,
  handleCart,
  setAvailableFacets,
  handleSaveSearch,
}) => {
  // Async function to fetch results
  const { data: results, error, isLoading, run } = useAsync({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deferFn: (fetchResults as unknown) as DeferFn<{ [key: string]: any }>,
  });

  // Filters applied by the user
  const [filters, setFilters] = React.useState<boolean>(false);
  // Parsed version of the facets from the API
  const [parsedFacets, setParsedFacets] = React.useState<
    ParsedFacets | Record<string, unknown>
  >({});
  // The current request URL generated when fetching results
  const [curReqUrl, setCurReqUrl] = React.useState<string | null>(null);
  // Items selected in the data table
  const [selectedItems, setSelectedItems] = React.useState<
    RawSearchResult[] | []
  >([]);
  // Pagination options in the data table
  const [pagination, setPagination] = React.useState<{
    page: number;
    pageSize: number;
  }>({
    page: 1,
    pageSize: 10,
  });

  // Generate the current request URL based on filters
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      const reqUrl = genUrlQuery(
        (activeProject as Project).facetsUrl,
        defaultFacets,
        activeFacets,
        textInputs,
        pagination
      );
      setCurReqUrl(reqUrl);
    }
  }, [activeProject, defaultFacets, activeFacets, textInputs, pagination]);

  React.useEffect(() => {
    setFilters(checkFiltersExist(activeFacets, textInputs));
  }, [activeFacets, textInputs]);

  // Fetch search results
  React.useEffect(() => {
    if (!isEmpty(activeProject) && curReqUrl) {
      run(curReqUrl);
    }
  }, [run, curReqUrl, activeProject]);

  // Update the available facets based on the returned results
  React.useEffect(() => {
    if (results && !isEmpty(results)) {
      const { facet_fields: facetFields } = (results as {
        facet_counts: { facet_fields: RawFacets };
      }).facet_counts;
      setParsedFacets(parseFacets(facetFields));
    }
  }, [results]);

  React.useEffect(() => {
    setAvailableFacets(parsedFacets as ParsedFacets);
  }, [parsedFacets, setAvailableFacets]);

  /**
   * Handles when the user selected individual items and adds to the cart.
   * This function filters out items that have been already added to the cart,
   * which is indicated as disabled on the UI.
   */
  const handleSelect = (selectedRows: RawSearchResult[] | []): void => {
    setSelectedItems(selectedRows);
  };

  /**
   * Handles setting the pagination options based on the Search table
   */
  const handlePagination = (page: number, pageSize: number): void => {
    setPagination({ page, pageSize });
  };

  /**
   * Handles pageSize changes and resets the current page back to the first
   */
  const handlePageSizeChange = (pageSize: number): void => {
    setPagination({ page: 1, pageSize });
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
  let docs: RawSearchResult[] = [];
  if (results) {
    numFound = (results as { response: { numFound: number } }).response
      .numFound;
    docs = (results as { response: { docs: RawSearchResult[] } }).response.docs;
  }

  return (
    <div data-testid="search">
      <div style={styles.summary}>
        {isEmpty(activeProject) && (
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
            {(activeProject as Project).name}
          </span>
        </h3>
        <div>
          {results && (
            <div>
              <Button
                type="default"
                onClick={() => handleSaveSearch(curReqUrl as string)}
                disabled={isLoading || numFound === 0}
              >
                <BookOutlined />
                Save Search
              </Button>{' '}
              <Button
                type="default"
                onClick={() => handleCart(selectedItems, 'add')}
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
                        onClose={onRemoveTag}
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
                  <Tag value={input} onClose={onRemoveTag} type="text">
                    {input}
                  </Tag>
                </div>
              );
            })}
          {filters && (
            <Tag
              value="clearAll"
              color="#f50"
              type="close all"
              onClose={() => onClearTags()}
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
                cart={cart}
                handleCart={handleCart}
                handleRowSelect={handleSelect}
                handlePagination={handlePagination}
                handlePageSizeChange={handlePageSizeChange}
              />
            ) : (
              <Table
                loading={isLoading}
                results={[]}
                totalResults={pagination.pageSize}
                cart={cart}
                handleCart={handleCart}
              />
            )}
          </div>
        </Col>
        {results && curReqUrl && (
          <Button
            type="default"
            href={clickableRoute(curReqUrl)}
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
