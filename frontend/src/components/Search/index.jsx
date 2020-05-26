import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
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
  },
  facetTag: { fontWeight: 'bold' },
  resultsHeader: { fontWeight: 'bold' },
};
/**
 * Joins adjacent elements of the facets obj into a tuple using reduce().
 * https://stackoverflow.com/questions/37270508/javascript-function-that-converts-array-to-array-of-2-tuples
 * @param {Object.<string, Array.<Array<string, number>>} facets
 */
export const parseFacets = (facets) => {
  const res = facets;
  const keys = Object.keys(facets);

  keys.forEach((key) => {
    res[key] = res[key].reduce((r, a, i) => {
      if (i % 2) {
        r[r.length - 1].push(a);
      } else {
        r.push([a]);
      }
      return r;
    }, []);
  });
  return res;
};

/**
 * Stringifies the active constraints
 * Example of output: '(Text Input = 'Solar') AND (source_type = AER OR AOGCM OR BGC)'
 * @param {*} activeFacets
 * @param {*} textInputs
 */
export const stringifyConstraints = (activeFacets, textInputs) => {
  const strConstraints = [];
  if (textInputs.length > 0) {
    strConstraints.push(`(Text Input = ${textInputs.join(' OR ')})`);
  }
  Object.keys(activeFacets).forEach((key) => {
    strConstraints.push(`(${key} = ${activeFacets[key].join(' OR ')})`);
  });

  const strResult = `${strConstraints.join(' AND ')}`;
  return strResult;
};

/**
 * Checks if constraints exist
 * @param {} activeFacets
 * @param {*} textInputs
 */
export const checkConstraintsExist = (activeFacets, textInputs) => {
  return !(isEmpty(activeFacets) && textInputs.length === 0);
};

function Search({
  activeProject,
  textInputs,
  activeFacets,
  cart,
  onRemoveTag,
  onClearTags,
  handleCart,
  setAvailableFacets,
}) {
  // Async function to fetch results
  const { data: results, error, isLoading, run } = useAsync({
    deferFn: fetchResults,
    project: activeProject,
  });

  const [constraintsExist, setConstraintsExist] = React.useState(false);
  // Parsed version of the returned facet fields
  const [parsedFacets, setParsedFacets] = React.useState({});
  // The current request URL generated when fetching results
  const [curReqUrl, setCurReqUrl] = React.useState(null);
  // Items selected in the data table
  const [selectedItems, setSelectedItems] = React.useState([]);
  // Pagination options in the data table
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 10,
  });

  // Generate the current request URL based on constraints
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      const reqUrl = genUrlQuery(
        activeProject.facets_url,
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
    if (!isEmpty(results)) {
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
   * @param {arrayOf(objectOf(*))} selectedRows - the selected rows
   */
  const handleSelect = (selectedRows) => {
    setSelectedItems(selectedRows);
  };

  /**
   * Handles setting the pagination options based on the Search table
   * @param {number} page
   * @param {number} pageSize
   */
  const handlePagination = (page, pageSize) => {
    setPagination({ page, pageSize });
  };

  /**
   * Handles pageSize changes and resets the current page back to the first
   * @param {number} pageSize
   */
  const handlePageSizeChange = (pageSize) => {
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
        <div style={styles.summary.leftSide}>
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
              <span style={styles.resultsHeader}>{activeProject.name}</span>{' '}
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
              <span style={styles.resultsHeader}>{activeProject.name}</span>{' '}
              {constraintsExist && (
                <Typography.Text code>
                  {stringifyConstraints(activeFacets, textInputs)}
                </Typography.Text>
              )}
            </h3>
          )}
        </div>
        <div>
          {results && results.response.numFound > 0 && (
            <Button
              type="primary"
              style={styles.addButton}
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
          Object.keys(activeFacets).map((facet) => {
            return [
              <p key={facet} style={styles.facetTag}>
                {humanize(facet)}: &nbsp;
              </p>,
              activeFacets[facet].map((variable) => {
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
          textInputs.map((input) => {
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
                handlePagination={handlePagination}
                handlePageSizeChange={handlePageSizeChange}
                onSelect={handleSelect}
              />
            ) : (
              <Table
                loading={isLoading}
                results={[]}
                totalResults={pagination.pageSize}
                cart={cart}
                handleCart={handleCart}
                handlePagination={handlePagination}
                handlePageSizeChange={handlePageSizeChange}
                onSelect={handleSelect}
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
}

Search.propTypes = {
  activeProject: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  textInputs: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any)).isRequired,
  cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  onClearTags: PropTypes.func.isRequired,
  handleCart: PropTypes.func.isRequired,
  setAvailableFacets: PropTypes.func.isRequired,
};

export default Search;
