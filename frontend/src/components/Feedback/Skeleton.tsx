import React from 'react';
import { Skeleton as SkeletonD } from 'antd';

type Props = {
  active?: boolean;
};

const Skeleton: React.FC<Props> = ({ active = false }) => {
  return (
    <div data-testid="skeleton">
      <SkeletonD active={active} />
    </div>
  );
};

export default Skeleton;
