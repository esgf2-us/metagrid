import React from 'react';
import ReactDOM from 'react-dom';
import { render, fireEvent, act } from '@testing-library/react';

import NavBar from './index';

test('renders without crashing', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <NavBar projects={['test', 'test2']} cartItems={0} />
    );
  });
});
