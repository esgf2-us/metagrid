import { render } from '@testing-library/react';
import React from 'react';
import MessageCard from './MessageCard';

it.only('renders message component with default markdown when file is wrong.', () => {
  const { getByText } = render(
    <MessageCard title="test title" fileName="badFile.md" />
  );

  // Check component renders
  const text = getByText('Content is empty.');
  expect(text).toBeTruthy();
});
