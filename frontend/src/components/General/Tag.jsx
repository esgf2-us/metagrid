import React from 'react';
import { Tag as TagD } from 'antd';
import PropTypes from 'prop-types';

const styles = {
  tag: { height: '2em' },
};

function Tag({ input, onClose, closable }) {
  Tag.propTypes = {
    input: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      ),
    ]).isRequired,
    onClose: PropTypes.func.isRequired,
    closable: PropTypes.bool,
  };

  Tag.defaultProps = {
    closable: true,
  };

  return (
    <TagD style={styles.tag} closable={closable} onClose={() => onClose(input)}>
      {input.constructor === Array ? input[0] : input}
    </TagD>
  );
}

export default Tag;
