import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip as TooltipD } from 'antd';

function ToolTip({ title, trigger, children }) {
  return (
    <TooltipD title={title} trigger={trigger}>
      {children}
    </TooltipD>
  );
}

ToolTip.propTypes = {
  title: PropTypes.string.isRequired,
  trigger: PropTypes.string,
  children: PropTypes.node,
};

ToolTip.defaultProps = {
  trigger: 'hover',
  children: undefined,
};

export default ToolTip;
