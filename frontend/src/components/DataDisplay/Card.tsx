import { Card as CardD } from 'antd';
import React from 'react';

type Props = {
  title: string | React.ReactNode;
  hoverable?: boolean;
  actions?: Array<React.ReactNode>;
  children: React.ReactNode;
};

const Card: React.FC<Props> = ({ title, hoverable, actions, children }) => (
  <CardD title={title} hoverable={hoverable} actions={actions}>
    {children}
  </CardD>
);

export default Card;
