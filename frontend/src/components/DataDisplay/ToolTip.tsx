import { Tooltip as TooltipD } from 'antd';
import React from 'react';

type Props = {
  title: string;
  trigger?: string;
  children?: React.ReactElement;
};

const ToolTip: React.FC<Props> = ({ title, trigger = 'hover', children }) => {
  return (
    <TooltipD title={title} trigger={trigger}>
      {children}
    </TooltipD>
  );
};

export default ToolTip;
