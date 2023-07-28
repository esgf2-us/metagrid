import { render } from '@testing-library/react';
import React from 'react';
import RightDrawer from './RightDrawer';

it('renders right drawer component.', () => {
  const { getByText } = render(<RightDrawer open onClose={() => {}} />);

  // Check component renders
  const text = getByText('Notifications');
  expect(text).toBeTruthy();
});
