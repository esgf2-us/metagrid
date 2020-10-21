import { Tooltip as TooltipD } from 'antd';
import React from 'react';

type Props = {
  title: string | React.ReactElement;
  trigger?: string;
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
}) => {
  return (
    <TooltipD
      title={title}
      trigger={trigger}
      color={color}
      placement={placement}
    >
      {children}
    </TooltipD>
  );
};

export default ToolTip;
