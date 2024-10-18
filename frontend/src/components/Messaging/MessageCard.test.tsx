import React from 'react';
import { screen } from '@testing-library/react';
import MessageCard from './MessageCard';
import customRender from '../../test/custom-render';

it('renders message component with default markdown when file is wrong.', async () => {
  customRender(<MessageCard title="test title" fileName="badFile.md" />);

  // Check component renders
  const text = await screen.findByText('Content is empty.');
  expect(text).toBeTruthy();
});
