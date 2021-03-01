import { Button as ButtonD } from 'antd';
import React from 'react';

type Props = {
  type?:
    | 'link'
    | 'ghost'
    | 'default'
    | 'primary'
    | 'dashed'
    | 'text'
    | undefined;
  className?: string | undefined;
  href?: string | undefined;
  target?: string | undefined;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  icon?: React.ReactNode;
  onClick?:
    | ((event: React.MouseEvent<HTMLElement, MouseEvent>) => void)
    | undefined;
  disabled?: boolean | undefined;
  danger?: boolean;
  children?: React.ReactElement | React.ReactNode | string;
  loading?: boolean;
  shape?: 'circle' | 'round';
  size?: 'large' | 'middle' | 'small';
};

const Button: React.FC<Props> = ({
  type = 'primary',
  className,
  href,
  target,
  icon,
  htmlType,
  onClick,
  disabled = false,
  danger = false,
  loading = false,
  children,
  shape,
  size,
}) => (
  <ButtonD
    type={type}
    className={className}
    href={href}
    target={target}
    htmlType={htmlType}
    icon={icon}
    onClick={onClick}
    disabled={disabled}
    danger={danger}
    loading={loading}
    shape={shape}
    size={size}
  >
    {children}
  </ButtonD>
);

export default Button;
