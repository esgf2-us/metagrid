import React from 'react';
import { Popover as PopoverD } from 'antd';

type Props = {
  content: React.ReactNode;
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
    | 'rightBottom'
    | undefined;
  trigger?: string | string[] | undefined;
  children: React.ReactElement;
};

const Popover: React.FC<Props> = ({
  content,
  placement = 'top',
  trigger = 'hover',
  children,
}) => (
  <PopoverD placement={placement} trigger={trigger} content={content}>
    {children}
  </PopoverD>
);

export default Popover;
