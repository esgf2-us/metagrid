import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col } from 'antd';

import SearchTag from './SearchTag';
import SearchTable from './SearchTable';
import jsonData from '../../mocks/cmip6.json';

function fetchResults() {
  // TODO: Call an API instead of mock data
  return JSON.parse(JSON.stringify(jsonData.response.docs));
}

function Search({
  project,
  textInputs,
  appliedFacets,
  cart,
  onRemoveTag,
  onClearTags,
  onAddCart,
}) {
  Search.propTypes = {
    project: PropTypes.string.isRequired,
    textInputs: PropTypes.arrayOf(PropTypes.string).isRequired,
    appliedFacets: PropTypes.objectOf(PropTypes.string).isRequired,
    cart: PropTypes.arrayOf(PropTypes.object).isRequired,
    onRemoveTag: PropTypes.func.isRequired,
    onClearTags: PropTypes.func.isRequired,
    onAddCart: PropTypes.func.isRequired,
  };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setItemsToCart] = useState([]);

  useEffect(() => {
    setLoading(true);

    const id = window.setTimeout(() => {
      setResults(fetchResults());
      setLoading(false);
    }, 1000);

    return () => {
      window.clearTimeout(id);
      setLoading(true);
    };
  }, [project, textInputs]);

  /**
   * Handles when the user selectes individual items and adds to the cart
   * This function filters out items that have been already added to the cart,
   * which is indicated as disabled on the UI.
   * @param {*} record
   * @param {*} selected
   * @param {*} selectedRows
   */
  const handleSelect = (record, selected, selectedRows) => {
    setItemsToCart(() => {
      return selectedRows;
    });
  };

  return (
    <div>
      {/* Top bar */}
      <Row>
        <h4>Applied Constraints: </h4>
        {project !== '' && <SearchTag input={project}></SearchTag>}

        {appliedFacets !== {} &&
          Object.keys(appliedFacets).map((key, facet) => {
            return appliedFacets[facet].map((value) => {
              return (
                <SearchTag
                  key={value}
                  input={value}
                  onClose={onRemoveTag}
                ></SearchTag>
              );
            });
          })}

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
        <Button onClick={() => onAddCart(selectedItems)}>
          Add Selected to Cart
        </Button>
      )}

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <SearchTable
            loading={loading}
            results={results}
            cart={cart}
            onSelect={handleSelect}
          />
        </Col>
      </Row>
    </div>
  );
}

export default Search;
