import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Row, Col } from 'antd';

import SearchResultsTable from './SearchResultsTable';
import jsonData from '../../mock.json';

function Search({ text, project }) {
  Search.propTypes = {
    text: PropTypes.array,
    project: PropTypes.string
  };

  const [facets, setFacets] = useState({});
  const [results, setResults] = useState([]);

  const fetchResults = () => {
    const data = JSON.parse(JSON.stringify(jsonData));
    setResults(data);
  };

  useEffect(() => {
    if (text.length !== 0 || project !== '') {
      fetchResults();
    }
  }, [text, project]);

  const handleSubmitFacet = facet => {
    setFacets({ ...facets, ...facet });
  };

  return (
    <div>
      <Row gutter={[24, 16]} justify="space-around">
        {/* Side bar */}
        <Col lg={4}></Col>
        {/* Body */}
        <Col lg={20}>
          {results.length !== 0 ? (
            <SearchResultsTable results={results} />
          ) : (
            <p>No results!</p>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default Search;
