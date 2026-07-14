import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import TableExpandIcon from './TableExpandIcon';
import customRender from '../../test/custom-render';
import { RawSearchResult } from './types';

// Mock record for testing
const mockRecord: RawSearchResult = {
  id: 'test-record-id',
  title: 'Test Record',
  project: 'test-project',
} as unknown as RawSearchResult;

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

describe('test TableExpandIcon component', () => {
  it('renders collapsed icon (RightCircleOutlined) when not expanded', () => {
    const mockOnExpand = vi.fn();
    customRender(
      <TableExpandIcon
        expanded={false}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
      />,
    );

    // Check that the right circle icon is rendered (collapsed state)
    const icon = screen.getByRole('img', { name: /right/i });
    expect(icon).toBeInTheDocument();
  });

  it('renders expanded icon (DownCircleOutlined) when expanded', () => {
    const mockOnExpand = vi.fn();
    customRender(
      <TableExpandIcon
        expanded={true}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
      />,
    );

    // Check that the down circle icon is rendered (expanded state)
    const icon = screen.getByRole('img', { name: /down/i });
    expect(icon).toBeInTheDocument();
  });

  it('renders collapsed icon inside Tooltip component', () => {
    const mockOnExpand = vi.fn();
    const { container } = customRender(
      <TableExpandIcon
        expanded={false}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
      />,
    );

    // Check that the icon is rendered (which is wrapped in Tooltip)
    const icon = screen.getByRole('img', { name: /right/i });
    expect(icon).toBeInTheDocument();

    // Verify the icon is present in the container (tooltip wraps it)
    expect(container.querySelector('.anticon-right-circle')).toBeInTheDocument();
  });

  it('calls onExpand when collapsed icon is clicked', async () => {
    const mockOnExpand = vi.fn();
    const user = userEvent.setup();

    customRender(
      <TableExpandIcon
        expanded={false}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
      />,
    );

    const icon = screen.getByRole('img', { name: /right/i });
    await user.click(icon);

    expect(mockOnExpand).toHaveBeenCalledTimes(1);
    expect(mockOnExpand).toHaveBeenCalledWith(mockRecord, expect.any(Object));
  });

  it('calls onExpand when expanded icon is clicked', async () => {
    const mockOnExpand = vi.fn();
    const user = userEvent.setup();

    customRender(
      <TableExpandIcon
        expanded={true}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
      />,
    );

    const icon = screen.getByRole('img', { name: /down/i });
    await user.click(icon);

    expect(mockOnExpand).toHaveBeenCalledTimes(1);
    expect(mockOnExpand).toHaveBeenCalledWith(mockRecord, expect.any(Object));
  });

  it('applies contractClass when expanded', () => {
    const mockOnExpand = vi.fn();
    customRender(
      <TableExpandIcon
        expanded={true}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
        contractClass="custom-contract-class"
      />,
    );

    const icon = screen.getByRole('img', { name: /down/i });
    expect(icon).toHaveClass('custom-contract-class');
  });

  it('applies expandClass when collapsed', () => {
    const mockOnExpand = vi.fn();
    customRender(
      <TableExpandIcon
        expanded={false}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={true}
        expandClass="custom-expand-class"
      />,
    );

    const icon = screen.getByRole('img', { name: /right/i });
    expect(icon).toHaveClass('custom-expand-class');
  });

  it('renders nothing when not expandable', () => {
    const mockOnExpand = vi.fn();
    customRender(
      <TableExpandIcon
        expanded={false}
        onExpand={mockOnExpand}
        record={mockRecord}
        expandable={false}
      />,
    );

    // Component should return null, so no expand icons should be present
    const rightIcon = screen.queryByRole('img', { name: /right/i });
    const downIcon = screen.queryByRole('img', { name: /down/i });
    expect(rightIcon).not.toBeInTheDocument();
    expect(downIcon).not.toBeInTheDocument();
  });
});
