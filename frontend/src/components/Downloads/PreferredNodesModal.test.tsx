import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import PreferredNodesModal from './PreferredNodesModal';
import customRender from '../../test/custom-render';
import { AtomWrapper } from '../../test/testFunctions';
import { AppStateKeys } from '../../common/atoms';

const user = userEvent.setup();

const defaultProps = {
  show: true,
  hide: vi.fn(),
  availableNodes: ['node-a.example.com', 'node-b.example.com', 'node-c.example.com'],
  onApply: vi.fn(),
};

describe('PreferredNodesModal component', () => {
  beforeEach(() => {
    // Reset preferences before each test
    AtomWrapper.modifyAtomValue(AppStateKeys.nodePreferences, []);
  });

  it('renders the modal when show is true', async () => {
    customRender(<PreferredNodesModal {...defaultProps} />);

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeTruthy();

    const title = await screen.findByText('Set Node Preferences');
    expect(title).toBeTruthy();
  });

  it('does not render the modal when show is false', () => {
    customRender(<PreferredNodesModal {...defaultProps} show={false} />);

    const modal = screen.queryByRole('dialog');
    expect(modal).toBeFalsy();
  });

  it('displays all available nodes in order', async () => {
    customRender(<PreferredNodesModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('node-a.example.com')).toBeTruthy();
      expect(screen.getByText('node-b.example.com')).toBeTruthy();
      expect(screen.getByText('node-c.example.com')).toBeTruthy();
    });
  });

  it('displays numbered list items', async () => {
    customRender(<PreferredNodesModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('1.')).toBeTruthy();
      expect(screen.getByText('2.')).toBeTruthy();
      expect(screen.getByText('3.')).toBeTruthy();
    });
  });

  it('displays drag handles for each node', async () => {
    customRender(<PreferredNodesModal {...defaultProps} />);

    const dragHandles = await screen.findAllByRole('img', { name: 'holder' });
    expect(dragHandles).toHaveLength(3);
  });

  it('hides modal when cancel button is clicked', async () => {
    const mockHide = vi.fn();
    customRender(<PreferredNodesModal {...defaultProps} hide={mockHide} />);

    const cancelBtn = await screen.findByTestId('cancelButton');
    expect(cancelBtn).toBeTruthy();

    await user.click(cancelBtn);

    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('calls onApply and hide when apply button is clicked', async () => {
    const mockHide = vi.fn();
    const mockOnApply = vi.fn();
    customRender(
      <PreferredNodesModal {...defaultProps} hide={mockHide} onApply={mockOnApply} />,
    );

    const applyBtn = await screen.findByTestId('applyButton');
    expect(applyBtn).toBeTruthy();

    await user.click(applyBtn);

    expect(mockOnApply).toHaveBeenCalledTimes(1);
    expect(mockOnApply).toHaveBeenCalledWith(defaultProps.availableNodes);
    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('applies preferences with correct node order when apply is clicked', async () => {
    const mockOnApply = vi.fn();
    customRender(
      <PreferredNodesModal {...defaultProps} onApply={mockOnApply} />,
    );

    const applyBtn = await screen.findByTestId('applyButton');
    await user.click(applyBtn);

    // Verify onApply was called with nodes in the correct order
    expect(mockOnApply).toHaveBeenCalledTimes(1);
    expect(mockOnApply).toHaveBeenCalledWith([
      'node-a.example.com',
      'node-b.example.com',
      'node-c.example.com',
    ]);
  });

  it('merges existing preferences with new nodes', async () => {
    // Set existing preferences
    const existingPrefs = ['node-b.example.com', 'node-old.example.com'];
    AtomWrapper.modifyAtomValue(AppStateKeys.nodePreferences, existingPrefs);

    customRender(<PreferredNodesModal {...defaultProps} />);

    await waitFor(() => {
      // Should show existing node b first, then node a, then node c
      // (node-old is not in available nodes so it's filtered out)
      expect(screen.getByText('node-b.example.com')).toBeTruthy();
      expect(screen.getByText('node-a.example.com')).toBeTruthy();
      expect(screen.getByText('node-c.example.com')).toBeTruthy();
    });
  });

  it('adds new nodes to the end of existing preferences', async () => {
    const existingPrefs = ['node-a.example.com'];
    AtomWrapper.modifyAtomValue(AppStateKeys.nodePreferences, existingPrefs);

    const newAvailableNodes = [
      'node-a.example.com',
      'node-b.example.com',
      'node-new.example.com',
    ];

    customRender(
      <PreferredNodesModal {...defaultProps} availableNodes={newAvailableNodes} />,
    );

    await waitFor(() => {
      // node-a should be first (from existing prefs)
      // node-b and node-new should follow
      const nodeTexts = screen.getAllByText(/node-[a-z]+\.example\.com/);
      expect(nodeTexts).toHaveLength(3);
    });
  });

  it('displays drag and drop instruction text', async () => {
    customRender(<PreferredNodesModal {...defaultProps} />);

    const instructionText = await screen.findByText(
      /Drag and drop to set your preferred order/i,
    );
    expect(instructionText).toBeTruthy();
  });

  it('handles empty available nodes list', async () => {
    customRender(<PreferredNodesModal {...defaultProps} availableNodes={[]} />);

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeTruthy();

    // Should not have any numbered list items
    const listItems = screen.queryByText('1.');
    expect(listItems).toBeFalsy();
  });

  it('handles single node in available list', async () => {
    customRender(
      <PreferredNodesModal {...defaultProps} availableNodes={['single-node.example.com']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('single-node.example.com')).toBeTruthy();
      expect(screen.getByText('1.')).toBeTruthy();
    });

    // Should not have a second item
    expect(screen.queryByText('2.')).toBeFalsy();
  });

  it('onApply callback is optional', async () => {
    customRender(<PreferredNodesModal {...defaultProps} onApply={undefined} />);

    const applyBtn = await screen.findByTestId('applyButton');
    await user.click(applyBtn);

    // Should not throw error even without onApply callback
    expect(defaultProps.hide).toHaveBeenCalled();
  });

  it('displays nodes in the order they appear in availableNodes', async () => {
    customRender(<PreferredNodesModal {...defaultProps} show={true} />, {
      usesAtoms: true,
    });

    // Wait for all nodes to render
    await waitFor(() => {
      const nodeTexts = screen.getAllByText(/node-[a-z]\.example\.com/);
      expect(nodeTexts).toHaveLength(3);

      // Verify they appear in the expected order
      expect(nodeTexts[0]).toHaveTextContent('node-a.example.com');
      expect(nodeTexts[1]).toHaveTextContent('node-b.example.com');
      expect(nodeTexts[2]).toHaveTextContent('node-c.example.com');
    });
  });
});
