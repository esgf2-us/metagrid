import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';

function SearchTag({ input, onClose }) {
  SearchTag.propTypes = {
    input: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      ),
    ]).isRequired,
    onClose: PropTypes.func.isRequired,
  };

  return (
    <Tag closable onClose={() => onClose(input)}>
      {input.constructor === Array ? input[0] : input}
    </Tag>
  );
}

export default SearchTag;
