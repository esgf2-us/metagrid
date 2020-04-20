import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip as TooltipD } from 'antd';

function ToolTip({ title }) {
  return <TooltipD title={title}></TooltipD>;
}

ToolTip.propTypes = {
  title: PropTypes.string.isRequired,
};

export default ToolTip;
