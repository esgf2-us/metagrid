import { Button, Modal as ModalD } from 'antd';
import React from 'react';

type Props = {
  visible: boolean;
  title?: React.ReactNode;
  onClose?: () => void;
  centered?: boolean;
  children: React.ReactNode;
};

const Modal: React.FC<Props> = ({
  visible,
  title,
  onClose,
  centered,
  children,
}) => (
  <ModalD
    visible={visible}
    title={title}
    onCancel={onClose}
    centered={centered}
    footer={[
      <Button key="submit" type="primary" onClick={onClose}>
        Close
      </Button>,
    ]}
  >
    {children}
  </ModalD>
);

export default Modal;
