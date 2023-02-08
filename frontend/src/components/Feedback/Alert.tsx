import { Alert as AlertD } from 'antd';
import React from 'react';

type Props = {
  message: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error' | undefined;
  showIcon?: boolean;
};

const Alert: React.FC<React.PropsWithChildren<Props>> = ({
  message,
  description,
  type,
  showIcon = true,
}) => (
  <AlertD
    message={message}
    description={description}
    type={type}
    showIcon={showIcon}
  />
);

export default Alert;
