import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

import NavBar from './index';

test('renders without crashing', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <NavBar projects={['test', 'test2']} cartItems={0} />
    );
  });
});

test('success message on submit', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <NavBar projects={['test', 'test2']} cartItems={0} />
    );
    test.todo('placeholder');
  });
});
