import React from 'react';
import PropTypes from 'prop-types';
import { Popover as PopoverD } from 'antd';

function Popover({ content, placement, trigger, children }) {
  return (
    <PopoverD placement={placement} trigger={trigger} content={content}>
      {children}
    </PopoverD>
  );
}

Popover.propTypes = {
  content: PropTypes.node.isRequired,
  trigger: PropTypes.string,
  placement: PropTypes.string,
  children: PropTypes.node,
};

Popover.defaultProps = {
  trigger: 'hover',
  placement: 'top',
  children: undefined,
};

export default Popover;
