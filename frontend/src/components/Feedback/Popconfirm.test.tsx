import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Popconfirm from './Popconfirm';
import customRender from '../../test/custom-render';

it('renders component with default exclamation circle', async () => {
  customRender(
    <Popconfirm onConfirm={jest.fn}>
      <p>Click here</p>
    </Popconfirm>
  );

  // Check component renders
  const text = await screen.findByText('Click here');
  expect(text).toBeTruthy();

  await act(async () => {
    await userEvent.click(text);
  });

  //   Check icon defaults to exclamation circle
  const icon = await screen.findByRole('img', { name: 'exclamation-circle' });
  expect(icon).toBeTruthy();
});
