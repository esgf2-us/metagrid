import React from 'react';
import PropTypes from 'prop-types';
import { Popconfirm as PopconfirmD } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

function Popconfirm({ title, icon, onConfirm, children }) {
  return (
    <PopconfirmD title={title} icon={icon} onConfirm={onConfirm}>
      {children}
    </PopconfirmD>
  );
}

Popconfirm.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.elementType,
  onConfirm: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

Popconfirm.defaultProps = {
  title: 'Are you sure?',
  icon: <ExclamationCircleOutlined />,
};

export default Popconfirm;
