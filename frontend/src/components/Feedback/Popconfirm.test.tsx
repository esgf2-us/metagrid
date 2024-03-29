import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Popconfirm from './Popconfirm';
import customRender from '../../test/custom-render';

const user = userEvent.setup();

it('renders component with default exclamation circle', async () => {
  const { getByText, getByRole } = customRender(
    <Popconfirm onConfirm={jest.fn}>
      <p>Click here</p>
    </Popconfirm>
  );

  // Check component renders
  const text = getByText('Click here');
  expect(text).toBeTruthy();

  await act(async () => {
    await user.click(text);
  });

  //   Check icon defaults to exclamation circle
  const icon = await waitFor(() =>
    getByRole('img', { name: 'exclamation-circle' })
  );
  expect(icon).toBeTruthy();
});
