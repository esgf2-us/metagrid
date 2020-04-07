import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col } from 'antd';

import SearchTag from './SearchTag';
import SearchTable from './SearchTable';
import jsonData from '../../mocks/db.json';

/**
 * Fetch the results based on the project and user's applied free-text and facets
 * TODO: Call an API instead of mock data
 * @param {string} project - The selected project
 * @param {arrayOf(string)} textInputs - The free-text inputs
 * @param {arrayOf(objectOf(*))} appliedFacets - The applied facets
 */
function fetchResults(project) {
  return JSON.parse(JSON.stringify(jsonData[project].response.docs));
}

function Search({
  project,
  textInputs,
  appliedFacets,
  cart,
  onRemoveTag,
  onClearTags,
  handleCart,
}) {
  Search.propTypes = {
    project: PropTypes.string.isRequired,
    textInputs: PropTypes.arrayOf(PropTypes.string).isRequired,
    appliedFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any))
      .isRequired,
    cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
    onRemoveTag: PropTypes.func.isRequired,
    onClearTags: PropTypes.func.isRequired,
    handleCart: PropTypes.func.isRequired,
  };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    setLoading(true);

    const id = window.setTimeout(() => {
      if (project) {
        setResults(fetchResults(project));
      }
      setLoading(false);
    }, 1000);

    return () => {
      window.clearTimeout(id);
      setLoading(true);
    };
  }, [project, textInputs, appliedFacets]);

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
      <Row>
        <h4>Selected Project:</h4>

        {project !== '' ? (
          <SearchTag
            input={project}
            onClose={() => onRemoveTag(project, 'project')}
          ></SearchTag>
        ) : (
          <p>N/A</p>
        )}
      </Row>
      <Row>
        <h4>Applied Constraints: </h4>
        {Object.keys(appliedFacets).length !== 0 ? (
          Object.keys(appliedFacets).map((key) => {
            return appliedFacets[key].map((value) => {
              return (
                <SearchTag
                  key={key}
                  input={value}
                  onClose={onRemoveTag}
                ></SearchTag>
              );
            });
          })
        ) : (
          <p></p>
        )}
        {textInputs.length !== 0 &&
          textInputs.map((input) => {
            return (
              <SearchTag
                key={input}
                input={input}
                onClose={onRemoveTag}
              ></SearchTag>
            );
          })}
      </Row>
      {results.length !== 0 && (
        <Button type="link" onClick={() => onClearTags()}>
          Clear All
        </Button>
      )}

      {results.length !== 0 && (
        <Button onClick={() => handleCart(selectedItems, 'add')}>
          Add Selected to Cart
        </Button>
      )}

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <SearchTable
            loading={loading}
            results={results}
            cart={cart}
            handleCart={handleCart}
            onSelect={handleSelect}
          />
        </Col>
      </Row>
    </div>
  );
}

export default Search;
