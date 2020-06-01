import React from 'react';
import { Alert as AlertD } from 'antd';

type Props = {
  message: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error' | undefined;
  showIcon?: boolean;
};

const Alert: React.FC<Props> = ({
  message,
  description,
  type,
  showIcon = true,
}) => {
  return (
    <AlertD
      message={message}
      description={description}
      type={type}
      showIcon={showIcon}
    />
  );
};

export default Alert;
