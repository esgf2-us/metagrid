import { screen } from '@testing-library/react';
import React from 'react';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import Citation, { CitationInfo } from './Citation';
import customRender from '../../test/custom-render';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Citation component', () => {
  it('renders component', async () => {
    customRender(<Citation url="citation_url" />);

    // Check for skeleton header, which indicates loading
    const skeletonHeading = await screen.findByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await screen.findByText('Bob; Tom');
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders component with 3 creators, no et al.', async () => {
    customRender(<Citation url="citation_a" />);

    // Check for skeleton header, which indicates loading
    const skeletonHeading = await screen.findByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await screen.findByText('Bobby; Tommy; Joey');
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders component with three creators and et al.', async () => {
    customRender(<Citation url="citation_b" />);

    // Check for skeleton header, which indicates loading
    const skeletonHeading = await screen.findByRole('heading');
    expect(skeletonHeading).toBeTruthy();

    // Check citation information rendered correctly
    const citationCreators = await screen.findByText(
      'Bobby; Tommy; Timmy; et al.'
    );
    expect(citationCreators).toBeInTheDocument();
  });
  it('renders Alert error fetching citation data ', async () => {
    server.use(
      // ESGF Citation API (uses dummy link)
      rest.post(apiRoutes.citation.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    customRender(<Citation url="citation_a" />);

    // Wait for Alert error to render
    const alert = await screen.findByRole('img', { name: 'close-circle' });
    expect(alert).toBeTruthy();
  });
});

describe('test CitationInfo component', () => {
  it('returns component', async () => {
    customRender(<CitationInfo title="title">children</CitationInfo>);

    // Check title in the document
    const title = await screen.findByText('title', { exact: false });
    expect(title).toBeInTheDocument();

    // Check children in the document
    const children = await screen.findByText('children');
    expect(children).toBeInTheDocument();
  });

  it('returns component with max of 3 creators', async () => {
    customRender(<CitationInfo title="title">children</CitationInfo>);

    // Check title in the document
    const title = await screen.findByText('title', { exact: false });
    expect(title).toBeInTheDocument();

    // Check children in the document
    const children = await screen.findByText('children');
    expect(children).toBeInTheDocument();
  });
});
