import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';

function SearchTag({ input, onClose }) {
  SearchTag.propTypes = {
    input: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  return (
    <Tag closable onClose={() => onClose(input)}>
      {input}
    </Tag>
  );
}

export default SearchTag;
