import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import { ExportOutlined } from '@ant-design/icons';

import Table from './Table';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Tag from '../General/Tag';

import { fetchResults, genUrlQuery } from '../../utils/api';
import { isEmpty } from '../../utils/utils';

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
  const { data: results, error, isLoading, run } = useAsync({
    deferFn: fetchResults,
    project: activeProject,
  });
  const [curReqUrl, setCurReqUrl] = React.useState(null);
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 10,
  });

  // Fetch search results
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      const reqUrl = genUrlQuery(
        activeProject.facets_url,
        textInputs,
        activeFacets,
        pagination
      );
      setCurReqUrl(reqUrl);
      run(curReqUrl);
    }
  }, [run, curReqUrl, activeProject, textInputs, activeFacets, pagination]);

  // Update the available facets based on the returned results
  React.useEffect(() => {
    if (!isEmpty(results)) {
      setAvailableFacets(results.facet_counts.facet_fields);
    }
  }, [results, setAvailableFacets]);

  /**
   * Handles when the user selectes individual items and adds to the cart
   * This function filters out items that have been already added to the cart,
   * which is indicated as disabled on the UI.
   * @param {object} record - individual dataset object
   * @param {objectOf(*)} selected - the selected row corresponding to the dataset object
   * @param {arrayOf(objectOf(*))} selectedRows - the selected rows
   */
  const handleSelect = (record, selected, selectedRows) => {
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
      <Alert
        message="There was an issue fetching search results. Please contact support or try again later."
        type="error"
      />
    );
  }

  return (
    <div data-testid="search">
      <div style={styles.summary}>
        <div style={styles.summary.leftSide}>
          {!isEmpty(results) ? (
            <h4>
              {results.response.numFound} results found for {activeProject.name}
            </h4>
          ) : (
            <Alert
              message="Search for a project to display results"
              type="info"
              showIcon
            />
          )}
        </div>
        <div>
          {results && results.response.numFound > 0 && (
            <Button
              type="primary"
              style={styles.addButton}
              onClick={() => handleCart(selectedItems, 'add')}
            >
              Add Selected to Cart
            </Button>
          )}
        </div>
      </div>
      <Row>
        {isEmpty(activeFacets) && textInputs.length === 0 && (
          <Alert message="No constraints applied" type="info" showIcon />
        )}
        {(!isEmpty(activeFacets) || textInputs.length > 0) && (
          <h4 style={{ marginRight: '0.5em' }}>Applied Constraints: </h4>
        )}

        {Object.keys(activeFacets).length !== 0 &&
          Object.keys(activeFacets).map((facet) => {
            return activeFacets[facet].map((variable) => {
              return (
                <Tag
                  key={variable}
                  value={[facet, variable]}
                  onClose={onRemoveTag}
                  type="facet"
                >
                  {variable}
                </Tag>
              );
            });
          })}
        {textInputs.length !== 0 &&
          textInputs.map((input) => {
            return (
              <Tag key={input} value={input} onClose={onRemoveTag} type="text">
                {input}
              </Tag>
            );
          })}

        {!isEmpty(activeFacets) ||
          (textInputs.length > 0 && (
            <Button type="link" onClick={() => onClearTags()}>
              Clear All
            </Button>
          ))}
      </Row>

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <Table
            loading={isLoading}
            results={
              results && !error && !isEmpty(activeProject)
                ? results.response.docs
                : []
            }
            totalResults={
              results ? results.response.numFound : pagination.pageSize
            }
            cart={cart}
            handleCart={handleCart}
            handlePagination={handlePagination}
            handlePageSizeChange={handlePageSizeChange}
            onSelect={handleSelect}
          />
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
