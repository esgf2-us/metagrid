import React from 'react';
import { render } from '@testing-library/react';

import Skeleton from './Skeleton';

it('returns component', () => {
  const { getByTestId } = render(<Skeleton active />);
  const skeleton = getByTestId('skeleton');
  expect(skeleton).toBeTruthy();
});
