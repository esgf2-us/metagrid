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
  project,
  textInputs,
  appliedFacets,
  cart,
  onRemoveTag,
  onClearTags,
  handleCart,
}) {
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

  return (
    <div data-testid="search">
      <div style={styles.summary}>
        <div style={styles.summary.leftSide}>
          {!isEmpty(results) ? (
            <h4>
              {results.response.numFound} results found for {project}
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
          Object.keys(appliedFacets).map((key) => {
            return appliedFacets[key].map((value) => {
              return <Tag key={key} input={value} onClose={onRemoveTag}></Tag>;
            });
          })}
        {textInputs.length !== 0 &&
          textInputs.map((input) => {
            return <Tag key={input} input={input} onClose={onRemoveTag}></Tag>;
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
              results && !error && project !== '' ? results.response.docs : []
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
  project: PropTypes.string.isRequired,
  textInputs: PropTypes.arrayOf(PropTypes.string).isRequired,
  appliedFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any))
    .isRequired,
  cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  onClearTags: PropTypes.func.isRequired,
  handleCart: PropTypes.func.isRequired,
};

export default Search;
