import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import Citation, { CitationInfo } from './Citation';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Citation component', () => {
  it('renders component', async () => {
    const { getByRole, getByText } = render(<Citation url="citation_url" />);

    // Check for skeleton header, which indicates loading
    const skeletonHeading = getByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await waitFor(() => getByText('Bob; Tom'));
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders component with 3 creators, no et al.', async () => {
    const { getByRole, getByText } = render(
      <Citation url="citation_url?variant=a" />
    );

    // Check for skeleton header, which indicates loading
    const skeletonHeading = getByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await waitFor(() =>
      getByText('Bobby; Tommy; Joey')
    );
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders component with three creators and et al.', async () => {
    const { getByRole, getByText } = render(
      <Citation url="citation_url?variant=b" />
    );

    // Check for skeleton header, which indicates loading
    const skeletonHeading = getByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await waitFor(() =>
      getByText('Bobby; Tommy; Timmy; et al.')
    );
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders Alert error fetching citation data ', async () => {
    server.use(
      // ESGF Citation API (uses dummy link)
      rest.get(apiRoutes.citation.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    const { getByRole } = render(<Citation url="citation_url" />);

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

  it('returns component with max of 3 creators', () => {
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
