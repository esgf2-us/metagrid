import React from 'react';
import { render, waitFor } from '@testing-library/react';

import mockAxios from 'axios';
import Citation, { CitationInfo } from './Citation';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Citation component', () => {
  let data;

  beforeEach(() => {
    data = {
      identifier: { id: 'an_id', identifierType: 'DOI' },
      creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
      titles: ['title'],
      publisher: 'Earth System Grid Federation',
      publicationYear: 2020,
    };
  });

  it('renders component', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const url = 'https://foo.bar|.json';
    const { getByRole, getByText } = render(<Citation url={url} />);

    // Check for skeleton header, which indicates loading
    const skeletonHeading = getByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await waitFor(() => getByText('Bob; Tom'));
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders Alert error fetching citation data ', async () => {
    const errorMessage = 'Network Error';
    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    const url = 'https://foo.bar|.json';
    const { getByRole } = render(<Citation url={url} />);

    // Wait for Alert error to render
    const alert = await waitFor(() =>
      getByRole('img', { name: 'close-circle' })
    );
    expect(alert).toBeTruthy();
  });
});

describe('test CitationInfo component', () => {
  it('returns component', () => {
    const { getByText } = render(
      <CitationInfo title="title">children</CitationInfo>
    );

    // Check title in the document
    const title = getByText('title', { exact: false });
    expect(title).toBeInTheDocument();

    // Check children in the document
    const children = getByText('children');
    expect(children).toBeInTheDocument();
  });
});
