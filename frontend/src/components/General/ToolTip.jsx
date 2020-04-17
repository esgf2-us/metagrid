import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip as TooltipD } from 'antd';

function ToolTip({ title }) {
  ToolTip.propTypes = {
    title: PropTypes.string.isRequired,
  };
  return <TooltipD title={title}></TooltipD>;
}

export default ToolTip;
