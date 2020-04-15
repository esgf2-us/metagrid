import React from 'react';
import { act, render, cleanup, wait } from '@testing-library/react';

import App from './App';

// Can add to Jest config to clean up
afterEach(cleanup);

test('App renders without crashing', async () => {
  await act(async () => {
    const { getByTestId } = render(<App />);

    expect(getByTestId('nav-bar'));
    await wait(() => getByTestId('facets'));
    expect(getByTestId('search'));
  });
});
