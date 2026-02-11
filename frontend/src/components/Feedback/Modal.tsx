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
  styles?: {
    mask?: CSSProperties;
    wrapper?: CSSProperties;
    body?: CSSProperties;
  };
  transitionName?: string;
  maskTransitionName?: string;
};

const Modal: React.FC<React.PropsWithChildren<Props>> = ({
  open,
  title,
  onClose,
  closeText,
  centered,
  children,
  style,
  styles,
  transitionName,
  maskTransitionName,
}) => (
  <ModalD
    style={style}
    styles={styles}
    open={open}
    title={title}
    onCancel={onClose}
    centered={centered}
    transitionName={transitionName}
    maskTransitionName={maskTransitionName}
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
