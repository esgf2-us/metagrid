import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Row, Col } from "antd";

import SearchTag from "./SearchTag";
import SearchResultsTable from "./SearchResultsTable";
import jsonData from "../../mock.json";

function Search({ project, textInputs, onRemoveTag, onClearTags, onAddCart }) {
  Search.propTypes = {
    project: PropTypes.string.isRequired,
    textInputs: PropTypes.array.isRequired,
    onRemoveTag: PropTypes.func.isRequired,
    onClearTags: PropTypes.func.isRequired,
    onAddCart: PropTypes.func.isRequired
  };

  const [facets, setFacets] = useState({});
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);

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

  const handleSelect = (record, selected, selectedRows, nativeEvent) => {
    setSelected(selectedRows);
  };

  const handleSelectAll = (selected, selectedRows, changeRows) => {
    setSelected(selectedRows);
  };

  return (
    <div>
      {/* Top bar */}
      <Row>
        <h4>Applied Constraints: </h4>
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
      {results.length !== 0 && (
        <Button type="link" onClick={() => onClearTags()}>
          Clear All
        </Button>
      )}

      {results.length !== 0 && (
        <Button onClick={() => onAddCart(selected)}>
          Add Selected to Cart
        </Button>
      )}

      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <SearchResultsTable
            results={results}
            selected={selected}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />
        </Col>
      </Row>
    </div>
  );
}

export default Search;
