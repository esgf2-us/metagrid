import React from 'react';
import { PropTypes } from 'prop-types';
import { Skeleton as SkeletonD } from 'antd';

const Skeleton = ({ active }) => {
  return (
    <div data-testid="skeleton">
      <SkeletonD active={active} />
    </div>
  );
};

Skeleton.propTypes = {
  active: PropTypes.bool,
};

Skeleton.defaultProps = {
  active: false,
};

export default Skeleton;
