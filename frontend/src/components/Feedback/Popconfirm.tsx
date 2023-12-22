import React from 'react';
import { Popconfirm as PopconfirmD } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

type Props = {
  title?: string;
  icon?: React.ReactNode;
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
  onConfirm: () => void;
  children: React.ReactElement;
};

const Popconfirm: React.FC<React.PropsWithChildren<Props>> = ({
  title = 'Are you sure?',
  icon = <ExclamationCircleOutlined />,
  placement = 'top',
  onConfirm,
  children,
}) => (
  <PopconfirmD
    title={title}
    icon={icon}
    placement={placement}
    onConfirm={onConfirm}
  >
    {children}
  </PopconfirmD>
);

export default Popconfirm;
