import { Alert as AlertD } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

function Alert({ message, description, type, showIcon }) {
  Alert.propTypes = {
    message: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    showIcon: PropTypes.bool,
  };

  Alert.defaultProps = {
    description: null,
    showIcon: false,
  };

  return (
    <AlertD
      message={message}
      description={description}
      type={type}
      showIcon={showIcon}
    />
  );
}

export default Alert;
