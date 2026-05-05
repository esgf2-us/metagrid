import { within, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import SubFilesTable, { Props } from './SubFilesTable';
import customRender from '../../test/custom-render';
import { stacAssetFixture } from '../../test/mock/fixtures';
import { StacAsset } from './types';

const user = userEvent.setup();

// Mock clipboard API
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
});

const defaultProps: Props = {
  alternate: {
    'node-a.example.com': stacAssetFixture({
      id: 'file1',
      'alternate:name': 'node-a.example.com',
      description: 'File at node A',
      href: 'https://node-a.example.com/file1.nc',
      type: 'application/netcdf',
      'file:size': 1024,
    }),
    'node-b.example.com': stacAssetFixture({
      id: 'file2',
      'alternate:name': 'node-b.example.com',
      description: 'File at node B',
      href: 'https://node-b.example.com/file2.nc',
      type: 'application/netcdf',
      'file:size': 2048,
    }),
  },
};

describe('SubFilesTable component', () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  it('renders the table with files data', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const table = await screen.findByTestId('filesTable');
    expect(table).toBeTruthy();
  });

  it('displays all alternate nodes', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('node-a.example.com')).toBeTruthy();
      expect(screen.getByText('node-b.example.com')).toBeTruthy();
    });
  });

  it('displays node descriptions', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('File at node A')).toBeTruthy();
      expect(screen.getByText('File at node B')).toBeTruthy();
    });
  });

  it('displays file types', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const fileTypes = await screen.findAllByText('application/netcdf');
    expect(fileTypes.length).toBe(2);
  });

  it('renders download buttons for each row', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    // Download buttons are rendered as Button components with download icon
    const downloadIcons = await screen.findAllByRole('img', { name: 'download' });
    expect(downloadIcons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders copy buttons for each row', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const copyButtons = await screen.findAllByRole('button', { name: 'copy' });
    expect(copyButtons.length).toBe(2);
  });

  it('handles clicking download button', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row

    const downloadLink = within(firstDataRow).getByRole('link', { name: 'download' });
    expect(downloadLink).toBeTruthy();

    // Check that the link has the correct href
    expect(downloadLink).toHaveAttribute('href', 'https://node-a.example.com/file1.nc');
    expect(downloadLink).toHaveAttribute('target', '_blank');
  });

  it('handles clicking copy button and copies URL to clipboard', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);

    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const copyBtn = within(firstDataRow).getByRole('button', { name: 'copy' });
    await user.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith('https://node-a.example.com/file1.nc');

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('URL copied to clipboard!')).toBeTruthy();
    });
  });

  it('handles clipboard copy error gracefully', async () => {
    const error = new Error('Clipboard error');
    mockWriteText.mockRejectedValueOnce(error);

    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const copyBtn = within(firstDataRow).getByRole('button', { name: 'copy' });
    await user.click(copyBtn);

    // Verify writeText was called even though it failed
    expect(mockWriteText).toHaveBeenCalledWith('https://node-a.example.com/file1.nc');
  });

  it('renders expandable icon for each row', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const expandIcons = await screen.findAllByRole('img', { name: 'right-circle' });
    expect(expandIcons.length).toBe(2);
  });

  it('expands row to show metadata when expand icon is clicked', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    // Find and click expand icon
    const expandIcon = within(firstDataRow).getByRole('img', { name: 'right-circle' });
    await user.click(expandIcon);

    // Check that expanded content appears with metadata
    await waitFor(() => {
      expect(screen.getByText(/id/)).toBeTruthy();
      expect(screen.getByText(/href/)).toBeTruthy();
    });

    // Icon should change to down-circle
    const collapseIcon = within(firstDataRow).getByRole('img', { name: 'down-circle' });
    expect(collapseIcon).toBeTruthy();
  });

  it('collapses row when collapse icon is clicked', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    // Expand first
    const expandIcon = within(firstDataRow).getByRole('img', { name: 'right-circle' });
    await user.click(expandIcon);

    await waitFor(() => {
      expect(screen.getByText(/id/)).toBeTruthy();
    });

    // Then collapse
    const collapseIcon = within(firstDataRow).getByRole('img', { name: 'down-circle' });
    await user.click(collapseIcon);

    // Icon should change back to right-circle
    await waitFor(() => {
      const expandIconAgain = within(firstDataRow).getByRole('img', { name: 'right-circle' });
      expect(expandIconAgain).toBeTruthy();
    });
  });

  it('displays metadata fields in expanded row', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const expandIcon = within(firstDataRow).getByRole('img', { name: 'right-circle' });
    await user.click(expandIcon);

    // Check for various metadata fields
    await waitFor(() => {
      expect(screen.getByText(/alternate:name/)).toBeTruthy();
      expect(screen.getByText(/description/)).toBeTruthy();
      expect(screen.getByText(/file:size/)).toBeTruthy();
    });
  });

  it('renders N/A when node name is empty', async () => {
    const propsWithEmptyNode: Props = {
      alternate: {
        '': stacAssetFixture({
          'alternate:name': '',
          description: 'No node name',
          href: 'https://example.com/file.nc',
        }),
      },
    };

    customRender(<SubFilesTable {...propsWithEmptyNode} />);

    const naElements = await screen.findAllByText('N/A');
    // Should have N/A for both node name and potentially file type if not provided
    expect(naElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders N/A when file type is empty', async () => {
    const propsWithEmptyType: Props = {
      alternate: {
        'node.example.com': stacAssetFixture({
          'alternate:name': 'node.example.com',
          description: 'Test file',
          type: '',
          href: 'https://example.com/file.nc',
        }),
      },
    };

    customRender(<SubFilesTable {...propsWithEmptyType} />);

    const naElements = await screen.findAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty alternate object', async () => {
    customRender(<SubFilesTable alternate={{}} />);

    const table = await screen.findByTestId('filesTable');
    expect(table).toBeTruthy();

    // Should render table with header and empty placeholder row
    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(1); // At least header row
  });

  it('handles single alternate entry', async () => {
    const singleAlternate: Props = {
      alternate: {
        'single-node.example.com': stacAssetFixture({
          'alternate:name': 'single-node.example.com',
          description: 'Single node file',
          href: 'https://single-node.example.com/file.nc',
        }),
      },
    };

    customRender(<SubFilesTable {...singleAlternate} />);

    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBe(2); // Header + 1 data row

    expect(screen.getByText('single-node.example.com')).toBeTruthy();
  });

  it('displays download tooltip on hover', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const downloadLink = within(firstDataRow).getByRole('link', { name: 'download' });

    // Hover over download link
    await user.hover(downloadLink);

    await waitFor(() => {
      expect(screen.getByText(/Download the data file via Http/i)).toBeTruthy();
    });
  });

  it('displays copy tooltip on hover', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const copyBtn = within(firstDataRow).getByRole('button', { name: 'copy' });

    // Hover over copy button
    await user.hover(copyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Copy the HTTP URL to the clipboard/i)).toBeTruthy();
    });
  });

  it('displays metadata tooltip on expand icon hover', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const expandIcon = within(firstDataRow).getByRole('img', { name: 'right-circle' });

    await user.hover(expandIcon);

    await waitFor(() => {
      expect(screen.getByText(/View this file's metadata/i)).toBeTruthy();
    });
  });

  it('each row has correct test id', async () => {
    customRender(<SubFilesTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('search-items-row-0')).toBeTruthy();
      expect(screen.getByTestId('search-items-row-1')).toBeTruthy();
    });
  });

  it('does not show null or "null" string values in expanded metadata', async () => {
    const assetWithNulls: Props = {
      alternate: {
        'node.example.com': {
          ...stacAssetFixture({
            'alternate:name': 'node.example.com',
            description: 'Test',
          }),
          someNullField: null,
          someNullStringField: 'null',
        } as unknown as StacAsset,
      },
    };

    customRender(<SubFilesTable {...assetWithNulls} />);

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    const expandIcon = within(firstDataRow).getByRole('img', { name: 'right-circle' });
    await user.click(expandIcon);

    // The null and "null" fields should not be rendered
    await waitFor(() => {
      expect(screen.queryByText(/someNullField/)).toBeFalsy();
      expect(screen.queryByText(/someNullStringField/)).toBeFalsy();
    });
  });
});
