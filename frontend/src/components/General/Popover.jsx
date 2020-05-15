import React from 'react';
import PropTypes from 'prop-types';
import { Popover as PopoverD } from 'antd';

function Popover({ content, children }) {
  return <PopoverD content={content}>{children}</PopoverD>;
}

Popover.propTypes = {
  content: PropTypes.elementType.isRequired,
  children: PropTypes.node,
};

Popover.defaultProps = {
  children: undefined,
};

export default Popover;
