import React from 'react';
import PropTypes from 'prop-types';
import { Alert as AlertD } from 'antd';

function Alert({ message, description, type, showIcon }) {
  Alert.propTypes = {
    message: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    showIcon: PropTypes.bool,
  };

  Alert.defaultProps = {
    description: null,
    showIcon: true,
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
