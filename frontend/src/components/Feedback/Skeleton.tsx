import React from 'react';
import { Skeleton as SkeletonD } from 'antd';

type Props = {
  title?: Record<string, unknown>;
  paragraph?: Record<string, unknown>;
  active?: boolean;
};

const Skeleton: React.FC<Props> = ({ title, paragraph, active = false }) => {
  return (
    <div data-testid="skeleton">
      <SkeletonD title={title} paragraph={paragraph} active={active} />
    </div>
  );
};

export default Skeleton;
