import { Tooltip as TooltipD } from 'antd';
import React from 'react';

type Props = {
  title: string | React.ReactElement;
  trigger?: 'click' | 'contextMenu' | 'hover' | undefined;
  color?: string;
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom';
  children?: React.ReactElement;
};

const ToolTip: React.FC<Props> = ({
  title,
  trigger = 'hover',
  placement = 'top',
  color,
  children,
}) => (
  <TooltipD title={title} trigger={trigger} color={color} placement={placement}>
    {children}
  </TooltipD>
);

export default ToolTip;
