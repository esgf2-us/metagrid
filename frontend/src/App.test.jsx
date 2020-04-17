import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act, render, cleanup, wait } from '@testing-library/react';

import App from './App';

// Can add to Jest config to clean up
afterEach(cleanup);

test('App renders without crashing at "/"', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <Router>
        <App />
      </Router>
    );

    expect(getByTestId('nav-bar'));
    expect(getByTestId('footer'));

    await wait(() => getByTestId('facets'));
    expect(getByTestId('search'));
  });
});
