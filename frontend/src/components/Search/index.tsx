import React, { ReactElement } from 'react';
import { useAsync, DeferFn } from 'react-async';
import { Row, Col, Typography } from 'antd';
import {
  ExportOutlined,
  BookOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

import Table from './Table';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Tag from '../DataDisplay/Tag';

import { fetchResults, genUrlQuery } from '../../utils/api';
import { isEmpty, humanize } from '../../utils/utils';

const styles = {
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    leftSide: {
      display: 'flex',
    },
  } as React.CSSProperties,
  facetTag: { fontWeight: 'bold' } as React.CSSProperties,
  resultsHeader: { fontWeight: 'bold' } as React.CSSProperties,
  filtersContainer: {
    marginBottom: 10,
  },
};
/**
 * Joins adjacent elements of the facets obj into a tuple using reduce().
 * https://stackoverflow.com/questions/37270508/javascript-function-that-converts-array-to-array-of-2-tuples
 */
export const parseFacets = (facets: FetchedFacets): AvailableFacets => {
  const res = (facets as unknown) as AvailableFacets;
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
 * Stringifies the active constraints
 * Example of output: '(Text Input = 'Solar') AND (source_type = AER OR AOGCM OR BGC)'
 */
export const stringifyConstraints = (
  defaultFacets: DefaultFacets,
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs | []
): string => {
  const strConstraints: string[] = [];

  Object.keys(defaultFacets).forEach((key: string) => {
    strConstraints.push(`(${key} = ${defaultFacets[key].toString()})`);
  });

  if (textInputs.length > 0) {
    strConstraints.push(`(Text Input = ${textInputs.join(' OR ')})`);
  }

  if (!isEmpty(activeFacets)) {
    Object.keys(activeFacets).forEach((key: string) => {
      strConstraints.push(
        `(${key} = ${(activeFacets as ActiveFacets)[key].join(' OR ')})`
      );
    });
  }

  const strResult = `${strConstraints.join(' AND ')}`;
  return strResult;
};

/**
 * Checks if constraints exist
 */
export const checkConstraintsExist = (
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
  handleCart: (selectedItems: SearchResult[], action: string) => void;
  setAvailableFacets: (parsedFacets: AvailableFacets) => void;
  handleSaveSearch: (numResults: number) => void;
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

  const [constraintsApplied, setConstraintsApplied] = React.useState<boolean>(
    false
  );
  // Parsed version of the returned facet fields
  const [parsedFacets, setParsedFacets] = React.useState<
    AvailableFacets | Record<string, unknown>
  >({});
  // The current request URL generated when fetching results
  const [curReqUrl, setCurReqUrl] = React.useState<string | null>(null);
  // Items selected in the data table
  const [selectedItems, setSelectedItems] = React.useState<SearchResult[] | []>(
    []
  );
  // Pagination options in the data table
  const [pagination, setPagination] = React.useState<{
    page: number;
    pageSize: number;
  }>({
    page: 1,
    pageSize: 10,
  });

  // Generate the current request URL based on constraints
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      const reqUrl = genUrlQuery(
        (activeProject as Project).facets_url,
        defaultFacets,
        activeFacets,
        textInputs,
        pagination
      );
      setCurReqUrl(reqUrl);
    }
  }, [activeProject, defaultFacets, activeFacets, textInputs, pagination]);

  React.useEffect(() => {
    setConstraintsApplied(checkConstraintsExist(activeFacets, textInputs));
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
        facet_counts: { facet_fields: FetchedFacets };
      }).facet_counts;
      setParsedFacets(parseFacets(facetFields));
    }
  }, [results]);

  React.useEffect(() => {
    setAvailableFacets(parsedFacets as AvailableFacets);
  }, [parsedFacets, setAvailableFacets]);

  /**
   * Handles when the user selectes individual items and adds to the cart
   * This function filters out items that have been already added to the cart,
   * which is indicated as disabled on the UI.
   */
  const handleSelect = (selectedRows: SearchResult[] | []): void => {
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

  // Destructure the results object if it exists
  // TODO: Figure out a better way annotate type for 'results'
  let numFound = 0;
  let docs: SearchResult[] = [];
  if (results) {
    numFound = (results as { response: { numFound: number } }).response
      .numFound;
    docs = (results as { response: { docs: SearchResult[] } }).response.docs;
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
        {isLoading && (
          <h3>
            <span style={styles.resultsHeader}>Loading </span> results for{' '}
            <span style={styles.resultsHeader}>
              {(activeProject as Project).name}
            </span>{' '}
            <Typography.Text code>
              {stringifyConstraints(defaultFacets, activeFacets, textInputs)}
            </Typography.Text>
          </h3>
        )}
        {results && !isLoading && (
          <h3>
            <span style={styles.resultsHeader}>{numFound} </span>
            results found for{' '}
            <span style={styles.resultsHeader}>
              {(activeProject as Project).name}
            </span>{' '}
            <Typography.Text code>
              {stringifyConstraints(defaultFacets, activeFacets, textInputs)}
            </Typography.Text>
          </h3>
        )}
        <div>
          {results && (
            <div>
              <Button
                type="primary"
                onClick={() => handleSaveSearch(numFound)}
                disabled={isLoading || numFound === 0}
              >
                <BookOutlined />
                Save Search Criteria
              </Button>{' '}
              <Button
                type="primary"
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

      <Row style={styles.filtersContainer}>
        {!constraintsApplied ? (
          <Alert
            message="No project constraints applied"
            type="info"
            showIcon
          />
        ) : (
          <h4 style={{ marginRight: '0.5em' }}>Applied Constraints: </h4>
        )}

        {Object.keys(activeFacets).length !== 0 &&
          Object.keys(activeFacets).map((facet: string) => {
            return [
              <p key={facet} style={styles.facetTag}>
                {humanize(facet)}: &nbsp;
              </p>,
              (activeFacets as ActiveFacets)[facet].map((variable: string) => {
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
              }),
            ] as ReactElement[];
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
        {constraintsApplied && (
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
        {curReqUrl && (
          <Button
            type="primary"
            href={curReqUrl}
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
