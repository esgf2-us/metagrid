import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";

import SearchTag from "./SearchTag";
import SearchResultsTable from "./SearchResultsTable";
import jsonData from "../../mock.json";


function Search({ project, textInputs, onRemoveTag }) {
  Search.propTypes = {
    project: PropTypes.string.isRequired,
    textInputs: PropTypes.array.isRequired,
    onRemoveTag: PropTypes.func.isRequired
  };

  const [facets, setFacets] = useState({});
  const [results, setResults] = useState([]);

  const fetchResults = () => {
    const data = JSON.parse(JSON.stringify(jsonData));
    setResults(data);
  };

  useEffect(() => {
    if (textInputs.length !== 0 && project !== "") {
      fetchResults();
    }
  }, [project, textInputs]);

  const handleSubmitFacet = facet => {
    // TODO: Implement this method
    setFacets({ ...facets, ...facet });
  };

  return (
    <div>
      {/* Top bar */}
      <Row>
        {project !== "" && <SearchTag input={project}></SearchTag>}
        {textInputs.length !== 0 &&
          textInputs.map((input, index) => {
            return (
              <SearchTag
                key={index}
                input={input}
                onClose={onRemoveTag}
              ></SearchTag>
            );
          })}
      </Row>
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
