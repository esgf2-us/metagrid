import React from 'react';
import { Tag as TagD } from 'antd';
import PropTypes from 'prop-types';

const styles = {
  tag: { height: '2em' },
};

function Tag({ value, onClose, closable, type, color, children }) {
  return (
    <TagD
      style={styles.tag}
      closable={closable}
      onClose={() => onClose(value, type)}
      color={color}
    >
      {children}
    </TagD>
  );
}

Tag.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.string),
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    ),
  ]).isRequired,
  onClose: PropTypes.func,
  closable: PropTypes.bool,
  type: PropTypes.string.isRequired,
  color: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Tag.defaultProps = {
  onClose: undefined,
  closable: true,
  color: undefined,
};

export default Tag;
