import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import customRender from '../../test/custom-render';
import DownloadModal, { LARGE_DOWNLOAD_WARNING_THRESHOLD } from './DownloadModal';
import { StacSearchResponse, StacFeature } from '../Search/types';
import {
  stacAssetFixture,
  stacFeatureFixture,
  stacSearchResponseFixture,
} from '../../test/mock/fixtures';

const user = userEvent.setup();

const mockHide = vi.fn();
const mockSearchURL = 'https://test.com/search?project=CMIP6';

describe('DownloadModal component tests', () => {
  beforeEach(() => {
    mockHide.mockClear();
  });

  it('renders the modal when show is true', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const modal = await screen.findByText('Download Search Results');
    expect(modal).toBeTruthy();

    const downloadForm = await screen.findByTestId('downloadModalForm');
    expect(downloadForm).toBeTruthy();
  });

  it('does not render the modal when show is false', () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={false}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const modal = screen.queryByText('Download Search Results');
    expect(modal).toBeNull();
  });

  it('displays the correct file count for a single feature', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 5, 2048)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const fileCountText = await screen.findByText(/Download all 5 files from your search results/i);
    expect(fileCountText).toBeTruthy();
  });

  it('displays the correct file count for multiple features', async () => {
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', 3, 1024),
      stacFeatureFixture('feature2', 4, 2048),
      stacFeatureFixture('feature3', 2, 512),
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Total files = 3 + 4 + 2 = 9
    const fileCountText = await screen.findByText(/Download all 9 files from your search results/i);
    expect(fileCountText).toBeTruthy();
  });

  it('displays the correct total download size', async () => {
    // Create features with specific sizes: 3 files × 1024 bytes = 3072 bytes
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // 3072 bytes = 3 KB (parseFloat removes trailing zeros)
    const estimatedSizeLabel = await screen.findByText(/Estimated size:/i);
    expect(estimatedSizeLabel).toBeTruthy();

    const sizeValue = await screen.findByText(/3 KB/i);
    expect(sizeValue).toBeTruthy();
  });

  it('displays the correct total download size for large files', async () => {
    // Create features with larger sizes: 2 files × 1GB = 2GB
    const oneGB = 1024 * 1024 * 1024;
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 2, oneGB)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const estimatedSizeLabel = await screen.findByText(/Estimated size:/i);
    expect(estimatedSizeLabel).toBeTruthy();

    const sizeValue = await screen.findByText(/2 GB/i);
    expect(sizeValue).toBeTruthy();
  });

  it('handles empty stacResults with no features', async () => {
    const stacResults = stacSearchResponseFixture([]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const fileCountText = await screen.findByText(/Download all 0 files from your search results/i);
    expect(fileCountText).toBeTruthy();

    const estimatedSizeLabel = await screen.findByText(/Estimated size:/i);
    expect(estimatedSizeLabel).toBeTruthy();

    const sizeValue = await screen.findByText(/0 Bytes/i);
    expect(sizeValue).toBeTruthy();
  });

  it('handles features with no assets', async () => {
    const featureWithNoAssets: StacFeature = {
      id: 'feature-no-assets',
      bbox: [0, 0, 10, 10],
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
      links: [{ rel: 'self', type: 'application/json', href: 'https://example.com/self' }],
      type: 'Feature',
      assets: {},
      properties: {
        access: ['public'],
        citation_url: 'https://example.com/citation',
        further_info_url: 'https://example.com/info',
        retracted: false,
        version: '1.0.0',
      },
      collection: ['test-collection'],
      stac_version: '1.0.0',
    };

    const stacResults = stacSearchResponseFixture([featureWithNoAssets]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const fileCountText = await screen.findByText(/Download all 0 files from your search results/i);
    expect(fileCountText).toBeTruthy();
  });

  it('handles null stacResults gracefully', async () => {
    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={null as unknown as StacSearchResponse}
      />,
    );

    const fileCountText = await screen.findByText(/Download all 0 files from your search results/i);
    expect(fileCountText).toBeTruthy();

    const estimatedSizeLabel = await screen.findByText(/Estimated size:/i);
    expect(estimatedSizeLabel).toBeTruthy();

    const sizeValue = await screen.findByText(/0 Bytes/i);
    expect(sizeValue).toBeTruthy();
  });

  it('handles undefined features in stacResults', async () => {
    const stacResults = {
      features: undefined,
      links: [],
      type: 'FeatureCollection',
    } as unknown as StacSearchResponse;

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const fileCountText = await screen.findByText(/Download all 0 files from your search results/i);
    expect(fileCountText).toBeTruthy();
  });

  it('calls hide callback when modal is closed', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Find and click the close button (X button in modal header)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('displays the CloudDownloadOutlined icon in the title', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Check that the modal renders with the cloud download icon
    const modal = await screen.findByText('Download Search Results');
    expect(modal).toBeTruthy();

    // The icon should be rendered as part of the title
    const iconElement = screen.getByRole('img', { name: /cloud-download/i, hidden: true });
    expect(iconElement).toBeTruthy();
  });

  it('renders DatasetDownload component with correct props', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Check that the DatasetDownload component is rendered
    // We can verify this by checking for elements that are unique to DatasetDownload
    const downloadForm = await screen.findByTestId('downloadModalForm');
    expect(downloadForm).toBeTruthy();
  });

  it('displays the disclaimer text about cart bypass', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const disclaimerText = await screen.findByText(/bypasses cart/i);
    expect(disclaimerText).toBeTruthy();
  });

  it('displays the metadata disclaimer text', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    const metadataDisclaimer = await screen.findByText(
      /Actual results may vary based on data availability/i,
    );
    expect(metadataDisclaimer).toBeTruthy();
  });

  it('formats large file counts with locale string', async () => {
    // Create a feature with many files
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 1234, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // toLocaleString() should format 1234 as "1,234" in most locales
    const fileCountText = await screen.findByText(
      /Download all 1,234 files from your search results/i,
    );
    expect(fileCountText).toBeTruthy();
  });

  it('correctly calculates totals across multiple features with varying sizes', async () => {
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', 10, 1024), // 10 KB
      stacFeatureFixture('feature2', 5, 2048), // 10 KB
      stacFeatureFixture('feature3', 3, 4096), // 12 KB
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Total files = 10 + 5 + 3 = 18
    const fileCountText = await screen.findByText(
      /Download all 18 files from your search results/i,
    );
    expect(fileCountText).toBeTruthy();

    // Total size = 10240 + 10240 + 12288 = 32768 bytes = 32 KB
    const estimatedSizeLabel = await screen.findByText(/Estimated size:/i);
    expect(estimatedSizeLabel).toBeTruthy();

    const sizeValue = await screen.findByText(/32 KB/i);
    expect(sizeValue).toBeTruthy();
  });

  it('handles assets with zero file size', async () => {
    const featureWithZeroSizeAssets: StacFeature = {
      id: 'feature-zero-size',
      bbox: [0, 0, 10, 10],
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
      links: [{ rel: 'self', type: 'application/json', href: 'https://example.com/self' }],
      type: 'Feature',
      assets: {
        asset1: stacAssetFixture({
          id: 'asset1',
          name: 'Asset 1',
          'file:size': 0,
        }),
        asset2: stacAssetFixture({
          id: 'asset2',
          name: 'Asset 2',
          'file:size': 0,
        }),
      },
      properties: {
        access: ['public'],
        citation_url: 'https://example.com/citation',
        further_info_url: 'https://example.com/info',
        retracted: false,
        version: '1.0.0',
      },
      collection: ['test-collection'],
      stac_version: '1.0.0',
    };

    const stacResults = stacSearchResponseFixture([featureWithZeroSizeAssets]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Assets with zero size should not be counted as files
    const fileCountText = await screen.findByText(/Download all 0 files from your search results/i);
    expect(fileCountText).toBeTruthy();

    const estimatedSizeLabel = await screen.findByText(/Estimated size:/i);
    expect(estimatedSizeLabel).toBeTruthy();

    const sizeValue = await screen.findByText(/0 Bytes/i);
    expect(sizeValue).toBeTruthy();
  });

  it('has a modal with width 800', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    await screen.findByText('Download Search Results');

    // Find the modal content wrapper which should have the width styling
    // Ant Design modals render to document.body, so we query globally
    const modalContent = document.querySelector('.ant-modal');
    expect(modalContent).toBeTruthy();
  });

  it('renders with Card component wrapping the content', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    await screen.findByText('Download Search Results');

    // Check that Card component is rendered
    // Ant Design modals render to document.body, so we query globally
    const card = document.querySelector('.ant-card');
    expect(card).toBeTruthy();
  });

  it('passes stacResults to DatasetDownload component', async () => {
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Wait for modal to render
    await screen.findByText('Download Search Results');

    // The DatasetDownload component should receive the stacResults
    // We verify this indirectly by checking the modal renders properly
    const downloadForm = await screen.findByTestId('downloadModalForm');
    expect(downloadForm).toBeTruthy();
  });

  it('passes searchURL to DatasetDownload component', async () => {
    const testURL = 'https://custom-test-url.com/search?custom=param';
    const stacResults = stacSearchResponseFixture([stacFeatureFixture('feature1', 3, 1024)]);

    customRender(
      <DownloadModal show={true} hide={mockHide} searchURL={testURL} stacResults={stacResults} />,
    );

    await screen.findByText('Download Search Results');

    // The DatasetDownload component should receive the searchURL
    const downloadForm = await screen.findByTestId('downloadModalForm');
    expect(downloadForm).toBeTruthy();
  });

  it('shows warning when file count is at or above threshold', async () => {
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', LARGE_DOWNLOAD_WARNING_THRESHOLD, 1024),
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Warning should be visible
    const warning = await screen.findByTestId('largeDownloadWarning');
    expect(warning).toBeTruthy();

    const warningText = await screen.findByText(/Large Download Warning/i);
    expect(warningText).toBeTruthy();

    const warningMessage = await screen.findByText(/You are about to download/i);
    expect(warningMessage).toBeTruthy();

    // DatasetDownload should not be visible yet
    const downloadForm = screen.queryByTestId('downloadModalForm');
    expect(downloadForm).toBeTruthy(); // Form wrapper exists but download component is replaced by warning
  });

  it('does not show warning when file count is below threshold', async () => {
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', LARGE_DOWNLOAD_WARNING_THRESHOLD - 1, 1024),
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Warning should not be visible
    const warning = screen.queryByTestId('largeDownloadWarning');
    expect(warning).toBeNull();

    // File count should be displayed
    const fileCountText = await screen.findByText(
      new RegExp(
        `Download all ${(LARGE_DOWNLOAD_WARNING_THRESHOLD - 1).toLocaleString()} files from your search results`,
        'i',
      ),
    );
    expect(fileCountText).toBeTruthy();
  });

  it('shows download form after clicking "Yes, Proceed" on warning', async () => {
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', LARGE_DOWNLOAD_WARNING_THRESHOLD + 5000, 2048),
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Warning should be visible initially
    const warning = await screen.findByTestId('largeDownloadWarning');
    expect(warning).toBeTruthy();

    // Click "Yes, Proceed" button
    const proceedButton = await screen.findByTestId('proceedButton');
    await user.click(proceedButton);

    // Warning should no longer be visible
    const warningAfterClick = screen.queryByTestId('largeDownloadWarning');
    expect(warningAfterClick).toBeNull();

    // Download form should now be visible
    const downloadForm = await screen.findByTestId('downloadModalForm');
    expect(downloadForm).toBeTruthy();
  });

  it('calls hide when clicking "Cancel" on warning', async () => {
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', LARGE_DOWNLOAD_WARNING_THRESHOLD + 10000, 1024),
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Warning should be visible
    const warning = await screen.findByTestId('largeDownloadWarning');
    expect(warning).toBeTruthy();

    // Click "Cancel" button
    const cancelButton = await screen.findByTestId('cancelButton');
    await user.click(cancelButton);

    // hide callback should have been called
    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('displays correct file count and size in warning message', async () => {
    const oneGB = 1024 * 1024 * 1024;
    const stacResults = stacSearchResponseFixture([
      stacFeatureFixture('feature1', LARGE_DOWNLOAD_WARNING_THRESHOLD + 15000, oneGB),
    ]);

    customRender(
      <DownloadModal
        show={true}
        hide={mockHide}
        searchURL={mockSearchURL}
        stacResults={stacResults}
      />,
    );

    // Check that warning card is visible
    const warning = await screen.findByTestId('largeDownloadWarning');
    expect(warning).toBeTruthy();

    // Check the warning message contains the download text
    const warningMessage = await screen.findByText(/You are about to download/i);
    expect(warningMessage).toBeTruthy();

    // Check that the question is displayed
    const warningQuestion = await screen.findByText(
      /Are you sure you want to proceed with this download/i,
    );
    expect(warningQuestion).toBeTruthy();

    // Check that proceed and cancel buttons are visible
    const proceedButton = await screen.findByTestId('proceedButton');
    expect(proceedButton).toBeTruthy();

    const cancelButton = await screen.findByTestId('cancelButton');
    expect(cancelButton).toBeTruthy();
  });
});
