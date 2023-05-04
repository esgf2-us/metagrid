import { Button, Modal as ModalD } from 'antd';
import React, { CSSProperties } from 'react';

type Props = {
  visible: boolean;
  title?: React.ReactNode;
  closeText: string;
  onClose?: () => void;
  centered?: boolean;
  children: React.ReactNode;
  style?: CSSProperties;
};

const Modal: React.FC<Props> = ({
  visible,
  title,
  onClose,
  closeText,
  centered,
  children,
  style,
}) => (
  <ModalD
    style={style}
    visible={visible}
    title={title}
    onCancel={onClose}
    centered={centered}
    footer={[
      <Button key="submit" type="primary" onClick={onClose}>
        {closeText}
      </Button>,
    ]}
  >
    {children}
  </ModalD>
);

export default Modal;
