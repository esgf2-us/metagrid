import React from 'react';
import MessageCard from './MessageCard';
import { customRenderKeycloak } from '../../test/custom-render';

it('renders message component with default markdown when file is wrong.', () => {
  const { getByText } = customRenderKeycloak(
    <MessageCard title="test title" fileName="badFile.md" />
  );

  // Check component renders
  const text = getByText('Content is empty.');
  expect(text).toBeTruthy();
});
