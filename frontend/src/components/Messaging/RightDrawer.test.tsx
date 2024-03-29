import React from 'react';
import RightDrawer from './RightDrawer';
import customRender from '../../test/custom-render';

it('renders right drawer component.', () => {
  const { getByText } = customRender(<RightDrawer open onClose={() => {}} />);

  // Check component renders
  const text = getByText('Notifications');
  expect(text).toBeTruthy();
});
