import { Empty as EmptyD } from 'antd';
import React from 'react';

type Props = {
  description: string;
};

const Empty: React.FC<React.PropsWithChildren<Props>> = ({ description }) => (
  <EmptyD description={description} />
);

export default Empty;
