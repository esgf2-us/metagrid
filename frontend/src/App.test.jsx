import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act, render, waitFor } from '@testing-library/react';

import App from './App';

test('App renders without crashing at "/"', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <Router>
        <App />
      </Router>
    );

    expect(getByTestId('nav-bar'));
    expect(getByTestId('footer'));

    await waitFor(() => getByTestId('facets'));
    expect(getByTestId('search'));
  });
});
