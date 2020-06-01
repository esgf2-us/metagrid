import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Popconfirm from './Popconfirm';

it('renders component with default exclamation circle', () => {
  const { getByText, getByRole } = render(
    <Popconfirm onConfirm={jest.fn}>
      <p>Click here</p>
    </Popconfirm>
  );

  // Check component renders
  const text = getByText('Click here');
  expect(text).toBeTruthy();
  fireEvent.click(text);

  //   Check icon defaults to exclamation circle
  const icon = getByRole('img', { name: 'exclamation-circle' });
  expect(icon).toBeTruthy();
});
