import { Modal as ModalD } from 'antd';
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
      onOk={onClose}
      onCancel={onClose}
      centered={centered}
    >
      {children}
    </ModalD>
  );

export default Modal;
