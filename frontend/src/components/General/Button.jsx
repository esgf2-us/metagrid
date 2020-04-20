import React from 'react';
import PropTypes from 'prop-types';
import { Button as ButtonD } from 'antd';

function Button({
  type,
  className,
  href,
  target,
  icon,
  htmlType,
  onClick,
  children,
}) {
  return (
    <ButtonD
      type={type}
      className={className}
      href={href}
      target={target}
      htmlType={htmlType}
      icon={icon}
      onClick={onClick}
    >
      {children}
    </ButtonD>
  );
}

Button.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  icon: PropTypes.node,
  htmlType: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

Button.defaultProps = {
  className: undefined,
  href: undefined,
  target: undefined,
  icon: undefined,
  htmlType: undefined,
  onClick: undefined,
  children: undefined,
};
export default Button;
