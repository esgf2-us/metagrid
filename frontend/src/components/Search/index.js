import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Button, Row, Col } from 'antd';

import SearchTag from './SearchTag';
import SearchTable from './SearchTable';
import { fetchResults } from '../../utils/api';

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

  const { data: results, error, isLoading, run } = useAsync({
    deferFn: fetchResults,
    project,
  });
  const [selectedItems, setSelectedItems] = React.useState([]);

  React.useEffect(() => {
    if (project !== '') {
      run(project);
    }
  }, [run, project, textInputs, appliedFacets]);

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
  console.log(error);

  return (
    <div data-testid="search">
      <Row>
        <h4>Selected Project:</h4>
        {project ? (
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

      {appliedFacets.length !== 0 && (
        <Button type="link" onClick={() => onClearTags()}>
          Clear All
        </Button>
      )}

      {results && results.length !== 0 && (
        <Button onClick={() => handleCart(selectedItems, 'add')}>
          Add Selected to Cart
        </Button>
      )}

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <SearchTable
            loading={isLoading}
            results={results && !error ? results.response.docs : []}
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
