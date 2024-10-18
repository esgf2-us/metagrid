import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Button from './Button';
import customRender from '../../test/custom-render';

const user = userEvent.setup();

it('renders component', async () => {
  customRender(<Button type="primary"></Button>);

  // Check button rendered
  const button = await screen.findByRole('button');
  expect(button).toBeTruthy();
});

it('returns string "clicked" onClick', async () => {
  customRender(<Button type="primary" onClick={jest.fn()}></Button>);

  // Click on the button
  const button = await screen.findByRole('button');

  await act(async () => {
    await user.click(button);
  });
});
