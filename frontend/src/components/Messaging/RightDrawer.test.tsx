import React from 'react';
import RightDrawer from './RightDrawer';
import { customRenderKeycloak } from '../../test/custom-render';

it('renders right drawer component.', () => {
  const { getByText } = customRenderKeycloak(
    <RightDrawer open onClose={() => {}} />
  );

  // Check component renders
  const text = getByText('Notifications');
  expect(text).toBeTruthy();
});
