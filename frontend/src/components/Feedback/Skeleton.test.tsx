import React from 'react';
import { render } from '@testing-library/react';

import Skeleton from './Skeleton';

it('returns component', () => {
  const { getByTestId } = render(<Skeleton active />);
  const skeleton = getByTestId('skeleton');
  expect(skeleton).toBeTruthy();
});

it('returns component without active animation effect', () => {
  const { getByTestId } = render(<Skeleton />);
  const skeleton = getByTestId('skeleton');
  expect(skeleton).toBeTruthy();

  const activeClass = document.querySelector('.ant-skeleton-active');
  expect(activeClass).toBeNull();
});
