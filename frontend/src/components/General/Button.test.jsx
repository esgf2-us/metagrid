import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Button from './Button';

it('renders component', () => {
  const { getByRole } = render(<Button type="primary"></Button>);

  // Check button rendered
  const button = getByRole('button');
  expect(button).toBeTruthy();
});

it('returns string "clicked" onClick', () => {
  const { getByRole } = render(
    <Button type="primary" onClick={jest.fn()}></Button>
  );

  // Click on the button
  const button = getByRole('button');
  fireEvent.click(button);
});
