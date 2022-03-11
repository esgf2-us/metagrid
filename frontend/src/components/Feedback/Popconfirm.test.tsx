import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import Popconfirm from './Popconfirm';

it('renders component with default exclamation circle', async () => {
  const { getByText, getByRole } = render(
    <Popconfirm onConfirm={jest.fn}>
      <p>Click here</p>
    </Popconfirm>
  );

  // Check component renders
  const text = getByText('Click here');
  expect(text).toBeTruthy();
  act(() => {
    fireEvent.click(text);
  });

  //   Check icon defaults to exclamation circle
  const icon = await waitFor(() =>
    getByRole('img', { name: 'exclamation-circle' })
  );
  expect(icon).toBeTruthy();
});
