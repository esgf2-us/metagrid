import React from 'react';
import { screen } from '@testing-library/react';
import RightDrawer from './RightDrawer';
import customRender from '../../test/custom-render';

it('renders right drawer component.', async () => {
  customRender(<RightDrawer open onClose={() => {}} />);

  // Check component renders
  const text = await screen.findByText('Notifications');
  expect(text).toBeTruthy();
});
