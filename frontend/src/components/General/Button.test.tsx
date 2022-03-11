import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import Button from './Button';

it('renders component', () => {
  const { getByRole } = render(<Button type="primary"></Button>);

  // Check button rendered
  const button = getByRole('button');
  expect(button).toBeTruthy();
});

it('returns string "clicked" onClick', async () => {
  const { getByRole } = render(
    <Button type="primary" onClick={jest.fn()}></Button>
  );

  // Click on the button
  const button = getByRole('button');
  act(() => {
    fireEvent.click(button);
  });
  await waitFor(() => button);
});
