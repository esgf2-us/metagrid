import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { printElementContents } from './test/jestTestFunctions';

describe('index bootstrap - frontend-config error', () => {
  beforeEach(() => {
    // Ensure a fresh module import each test
    jest.resetModules();

    // Provide a root container the index module will mount into
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('renders ErrorPage when fetch("/frontend-config.js") returns non-ok', async () => {
    // Mock fetch to return a Response-like object with ok === false to trigger the error path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        json: async () => ({}),
      }),
    );

    // Import the entrypoint (side-effect: it will perform the fetch and render ErrorPage on failure)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./index');

    // Wait for ErrorPage to render and assert on content that exists only in ErrorPage
    await waitFor(() => {
      expect(
        screen.getByText('Service Unavailable', { exact: false }),
      ).toBeInTheDocument();
      expect(screen.getByText('Service Status', { exact: false })).toBeInTheDocument();
    });
  });
});
