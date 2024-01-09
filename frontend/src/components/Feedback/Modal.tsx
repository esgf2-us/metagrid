import { Button, Modal as ModalD } from 'antd';
import React, { CSSProperties } from 'react';

type Props = {
  open: boolean;
  title?: React.ReactNode;
  closeText: string;
  onClose?: () => void;
  centered?: boolean;
  children: React.ReactNode;
  style?: CSSProperties;
};

const Modal: React.FC<React.PropsWithChildren<Props>> = ({
  open,
  title,
  onClose,
  closeText,
  centered,
  children,
  style,
}) => (
  <ModalD
    style={style}
    open={open}
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
