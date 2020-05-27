import React from 'react';
import { Button as ButtonD } from 'antd';

type Props = {
  type?: 'link' | 'ghost' | 'default' | 'primary' | 'dashed' | undefined;
  className?: string | undefined;
  href?: string | undefined;
  target?: string | undefined;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  icon?: React.ReactNode;
  onClick?:
    | ((event: React.MouseEvent<HTMLElement, MouseEvent>) => void)
    | undefined;
  disabled?: boolean | undefined;
  children?: React.ReactElement | React.ReactNode | string;
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
  children,
}) => {
  return (
    <ButtonD
      type={type}
      className={className}
      href={href}
      target={target}
      htmlType={htmlType}
      icon={icon}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ButtonD>
  );
};

export default Button;
