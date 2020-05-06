import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Button, Row, Col } from 'antd';

import Alert from '../Feedback/Alert';
import SearchTable from './SearchTable';

import Tag from '../General/Tag';
import { fetchResults } from '../../utils/api';
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
  appliedFacets,
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
  const [selectedItems, setSelectedItems] = React.useState([]);
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      run(activeProject.facets_url, textInputs, appliedFacets);
    }
  }, [run, activeProject, textInputs, appliedFacets]);

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
              style={styles.addButton}
              onClick={() => handleCart(selectedItems, 'add')}
            >
              Add Selected to Cart
            </Button>
          )}
        </div>
      </div>
      <Row>
        {isEmpty(appliedFacets) && textInputs.length === 0 && (
          <Alert message="No constraints applied" type="info" showIcon />
        )}
        {(!isEmpty(appliedFacets) || textInputs.length > 0) && (
          <h4 style={{ marginRight: '0.5em' }}>Applied Constraints: </h4>
        )}

        {Object.keys(appliedFacets).length !== 0 &&
          Object.keys(appliedFacets).map((facet) => {
            return appliedFacets[facet].map((variable) => {
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

        {!isEmpty(appliedFacets) ||
          (textInputs.length > 0 && (
            <Button type="link" onClick={() => onClearTags()}>
              Clear All
            </Button>
          ))}
      </Row>

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <SearchTable
            loading={isLoading}
            results={
              results && !error && !isEmpty(activeProject)
                ? results.response.docs
                : []
            }
            cart={cart}
            handleCart={handleCart}
            onSelect={handleSelect}
          />
        </Col>
      </Row>
    </div>
  );
}

Search.propTypes = {
  activeProject: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  textInputs: PropTypes.arrayOf(PropTypes.string).isRequired,
  appliedFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any))
    .isRequired,
  cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  onClearTags: PropTypes.func.isRequired,
  handleCart: PropTypes.func.isRequired,
  setAvailableFacets: PropTypes.func.isRequired,
};

export default Search;
