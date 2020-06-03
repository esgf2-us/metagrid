import React from 'react';
import { Empty as EmptyD } from 'antd';

type Props = {
  description: string;
};

const Empty: React.FC<Props> = ({ description }) => {
  return <EmptyD description={description} />;
};

export default Empty;
