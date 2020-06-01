import React from 'react';
import { useAsync } from 'react-async';
import { Row, Col, Typography } from 'antd';
import { ExportOutlined } from '@ant-design/icons';

import Table from './Table';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Tag from '../General/Tag';

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
  activeFacets: ActiveFacets,
  textInputs: TextInputs
): string => {
  const strConstraints: string[] = [];
  if (textInputs.length > 0) {
    strConstraints.push(`(Text Input = ${textInputs.join(' OR ')})`);
  }
  Object.keys(activeFacets).forEach((key: string) => {
    strConstraints.push(`(${key} = ${activeFacets[key].join(' OR ')})`);
  });

  const strResult = `${strConstraints.join(' AND ')}`;
  return strResult;
};

/**
 * Checks if constraints exist
 */
export const checkConstraintsExist = (
  activeFacets: ActiveFacets | {},
  textInputs: TextInputs
): boolean => {
  return !(isEmpty(activeFacets) && textInputs.length === 0);
};

export type Props = {
  activeProject: Project | {};
  textInputs: TextInputs | [];
  activeFacets: ActiveFacets;
  cart: Cart | [];
  onRemoveTag: (removedTag: Tag, type: string) => void;
  onClearTags: () => void;
  handleCart: (selectedItems: SearchResult[], action: string) => void;
  setAvailableFacets: (parsedFacets: AvailableFacets) => void;
};

const Search: React.FC<Props> = ({
  activeProject,
  textInputs,
  activeFacets,
  cart,
  onRemoveTag,
  onClearTags,
  handleCart,
  setAvailableFacets,
}) => {
  // Async function to fetch results
  const { data: results, error, isLoading, run } = useAsync({
    deferFn: fetchResults,
  });

  const [constraintsExist, setConstraintsExist] = React.useState<boolean>(
    false
  );
  // Parsed version of the returned facet fields
  const [parsedFacets, setParsedFacets] = React.useState<AvailableFacets | {}>(
    {}
  );
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
        textInputs,
        activeFacets,
        pagination
      );
      setCurReqUrl(reqUrl);
    }
  }, [activeProject, textInputs, activeFacets, pagination]);

  React.useEffect(() => {
    setConstraintsExist(checkConstraintsExist(activeFacets, textInputs));
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
      setParsedFacets(parseFacets(results.facet_counts.facet_fields));
    }
  }, [results]);

  React.useEffect(() => {
    setAvailableFacets(parsedFacets);
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

  return (
    <div data-testid="search">
      <div style={styles.summary}>
        {isEmpty(activeProject) && (
          <Alert
            message="Search for a project to display results"
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
            {constraintsExist && (
              <Typography.Text code>
                {stringifyConstraints(activeFacets, textInputs)}
              </Typography.Text>
            )}
          </h3>
        )}

        {results && !isLoading && (
          <h3>
            <span style={styles.resultsHeader}>
              {results.response.numFound}{' '}
            </span>
            results found for{' '}
            <span style={styles.resultsHeader}>
              {(activeProject as Project).name}
            </span>{' '}
            {constraintsExist && (
              <Typography.Text code>
                {stringifyConstraints(activeFacets, textInputs)}
              </Typography.Text>
            )}
          </h3>
        )}
        <div>
          {results && results.response.numFound > 0 && (
            <Button
              type="primary"
              onClick={() => handleCart(selectedItems, 'add')}
              disabled={!(selectedItems.length > 0)}
            >
              Add Selected to Cart
            </Button>
          )}
        </div>
      </div>

      <Row>
        {!constraintsExist ? (
          <Alert message="No constraints applied" type="info" showIcon />
        ) : (
          <h4 style={{ marginRight: '0.5em' }}>Applied Constraints: </h4>
        )}

        {Object.keys(activeFacets).length !== 0 &&
          Object.keys(activeFacets).map((facet: string) => {
            return [
              <p key={facet} style={styles.facetTag}>
                {humanize(facet)}: &nbsp;
              </p>,
              activeFacets[facet].map((variable: string) => {
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
            ];
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
        {constraintsExist && (
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
                results={results.response.docs}
                totalResults={results.response.numFound}
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
