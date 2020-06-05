import React from 'react';
import { Card as CardD } from 'antd';

type Props = {
  title: string | React.ReactNode;
  hoverable?: boolean;
  actions?: Array<React.ReactNode>;
  children: React.ReactNode;
};

const Card: React.FC<Props> = ({ title, hoverable, actions, children }) => {
  return (
    <CardD title={title} hoverable={hoverable} actions={actions}>
      {children}
    </CardD>
  );
};

export default Card;
