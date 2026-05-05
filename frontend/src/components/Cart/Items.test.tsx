import { within, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import Items, { Props } from './Items';
import { getSearchFromUrl } from '../../common/utils';
import App from '../App/App';
import { ActiveSearchQuery, RawSearchResult } from '../Search/types';
import { AppStateKeys, CartStateKeys } from '../../common/atoms';
import { AtomWrapper } from '../../test/testFunctions';
import { rawSearchResultFixture, stacAssetFixture } from '../../test/mock/fixtures';

const defaultProps: Props = {
  onUpdateCart: vi.fn(),
};

const user = userEvent.setup();

const activeSearch: ActiveSearchQuery = getSearchFromUrl('project=test1');

describe('test the cart items component', () => {
  it('renders message that the cart is empty when no items are added', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, []);
    customRender(<Items {...defaultProps} />);

    // Check empty cart text renders
    const emptyCart = await screen.findByText('Your cart is empty');
    expect(emptyCart).toBeTruthy();
  });

  it('removes all items from the cart when confirming the popconfirm', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    expect(await screen.findByTestId('search-results-span')).toBeInTheDocument();

    // Check first row exists
    const firstRow = await screen.findByTestId('cart-items-row-1');
    expect(firstRow).toBeTruthy();

    // Switch to the cart page
    const cartBtn = await screen.findByTestId('cartPageLink');
    await user.click(cartBtn);

    // Click the Remove All Items button
    const removeAllBtn = await screen.findByTestId('clear-cart-button');
    expect(removeAllBtn).toBeTruthy();
    await user.click(removeAllBtn);

    // Check popover appears
    const popOver = await screen.findByRole('tooltip');
    expect(popOver).toBeInTheDocument();

    // Submit the popover
    const submitPopOverBtn = await screen.findByTestId('clear-all-cart-items-confirm-button');
    expect(submitPopOverBtn).toBeInTheDocument();
    await user.click(submitPopOverBtn);

    // Expect cart to now be empty
    expect(await screen.findByText('Your cart is empty')).toBeTruthy();
  });

  it('handles selecting items in the cart and downloading them via wget', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, []);
    customRender(<App searchQuery={activeSearch} />, {
      usesAtoms: true,
    });

    // Wait for results to load
    expect(await screen.findByTestId('search-results-span')).toBeInTheDocument();

    // Check first row has add button and click it
    const firstRow = await screen.findByTestId('cart-items-row-1');
    const addBtn = await screen.findByTestId('row-0-add-to-cart');
    expect(addBtn).toBeTruthy();
    await user.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = (await screen.findAllByText('Added item(s) to your cart'))[0];
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = await screen.findByTestId('cartPageLink');
    await user.click(cartBtn);

    // Check download form renders
    const downloadForm = await screen.findByTestId('downloadForm');
    expect(downloadForm).toBeTruthy();

    // Check cart items component renders
    const cartItemsComponent = await screen.findByTestId('cartItems');
    expect(cartItemsComponent).toBeTruthy();

    // Wait for cart items component to re-render
    await screen.findByTestId('cartItems');

    // Check download button exists and submit the form
    const downloadBtn = await within(firstRow).findByRole('button', {
      name: 'download',
    });
    expect(downloadBtn).toBeTruthy();
    await user.click(downloadBtn);
  });

  it('handles error selecting items in the cart and downloading them via wget', async () => {
    // Override route HTTP response
    server.use(rest.post(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404))));

    customRender(<Items {...defaultProps} />);

    // Check first row renders and click the checkbox
    const firstRow = await screen.findByTestId('cart-items-row-1');
    const firstCheckBox = await within(firstRow).findByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await userEvent.click(firstCheckBox);

    const downloadBtn = (
      await within(firstRow).findAllByRole('button', {
        name: 'download',
      })
    )[0];
    await userEvent.click(downloadBtn);

    expect(
      await screen.findByText(
        'The requested resource at the ESGF wget API service was invalid. Please contact support.',
        { exact: false },
      ),
    ).toBeTruthy();
  });

  it('extracts available nodes from cart items', async () => {
    const stacItem: RawSearchResult = rawSearchResultFixture({
      id: 'stac-item-1',
      isStac: true,
      assets: {
        asset1: stacAssetFixture({
          alternateName: 'node-a.example.com',
          'alternate:name': 'node-a.example.com',
          href: 'https://node-a.example.com/file.nc',
        }),
        asset2: stacAssetFixture({
          alternateName: 'node-b.example.com',
          'alternate:name': 'node-b.example.com',
          href: 'https://node-b.example.com/file.nc',
        }),
      },
    });

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [stacItem]);
    customRender(<Items {...defaultProps} />);

    // Check Set Preferred Nodes button is enabled (has nodes)
    const setPrefNodesBtn = await screen.findByText('Set Preferred Nodes');
    expect(setPrefNodesBtn).toBeTruthy();
    expect(setPrefNodesBtn.closest('button')).not.toBeDisabled();
  });

  it('disables Set Preferred Nodes button when no nodes available', async () => {
    const nonStacItem: RawSearchResult = rawSearchResultFixture({
      id: 'non-stac-1',
      isStac: false,
      data_node: undefined,
    });

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [nonStacItem]);
    customRender(<Items {...defaultProps} />);

    // Check Set Preferred Nodes button is disabled (no nodes)
    const setPrefNodesBtn = await screen.findByText('Set Preferred Nodes');
    expect(setPrefNodesBtn).toBeTruthy();
    expect(setPrefNodesBtn.closest('button')).toBeDisabled();
  });

  it('opens PreferredNodesModal when Set Preferred Nodes button is clicked', async () => {
    const stacItem: RawSearchResult = rawSearchResultFixture({
      id: 'stac-item-1',
      isStac: true,
      assets: {
        asset1: stacAssetFixture({
          alternateName: 'node-a.example.com',
          'alternate:name': 'node-a.example.com',
          href: 'https://node-a.example.com/file.nc',
        }),
      },
    });

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [stacItem]);
    customRender(<Items {...defaultProps} />);

    // Click Set Preferred Nodes button
    const setPrefNodesBtn = await screen.findByText('Set Preferred Nodes');
    await user.click(setPrefNodesBtn);

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByText('Set Node Preferences')).toBeTruthy();
    });
  });

  it('applies node preferences to cart items when onApply is called', async () => {
    const stacItem1: RawSearchResult = rawSearchResultFixture({
      id: 'stac-item-1',
      isStac: true,
      assets: {
        asset1: stacAssetFixture({
          alternateName: 'node-a.example.com',
          'alternate:name': 'node-a.example.com',
          href: 'https://node-a.example.com/file.nc',
        }),
        asset2: stacAssetFixture({
          alternateName: 'node-b.example.com',
          'alternate:name': 'node-b.example.com',
          href: 'https://node-b.example.com/file.nc',
        }),
      },
    });

    const stacItem2: RawSearchResult = rawSearchResultFixture({
      id: 'stac-item-2',
      isStac: true,
      assets: {
        asset1: stacAssetFixture({
          alternateName: 'node-b.example.com',
          'alternate:name': 'node-b.example.com',
          href: 'https://node-b.example.com/file2.nc',
        }),
        asset2: stacAssetFixture({
          alternateName: 'node-c.example.com',
          'alternate:name': 'node-c.example.com',
          href: 'https://node-c.example.com/file2.nc',
        }),
      },
    });

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [stacItem1, stacItem2]);
    AtomWrapper.modifyAtomValue(CartStateKeys.downloadSelections, {});
    AtomWrapper.modifyAtomValue(CartStateKeys.selectedNodes, {});

    customRender(<Items {...defaultProps} />, { usesAtoms: true });

    // Click Set Preferred Nodes button
    const setPrefNodesBtn = await screen.findByText('Set Preferred Nodes');
    await user.click(setPrefNodesBtn);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Set Node Preferences')).toBeTruthy();
    });

    // Click Apply button - this calls handleApplyNodePreferences
    const applyBtn = await screen.findByTestId('applyButton');
    await user.click(applyBtn);

    // Verify modal closes after applying preferences
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeFalsy();
    });
  });

  it('handles closing PreferredNodesModal with cancel button', async () => {
    const stacItem: RawSearchResult = rawSearchResultFixture({
      id: 'stac-item-1',
      isStac: true,
      assets: {
        asset1: stacAssetFixture({
          alternateName: 'node-a.example.com',
          'alternate:name': 'node-a.example.com',
          href: 'https://node-a.example.com/file.nc',
        }),
      },
    });

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [stacItem]);
    customRender(<Items {...defaultProps} />);

    // Click Set Preferred Nodes button
    const setPrefNodesBtn = await screen.findByText('Set Preferred Nodes');
    await user.click(setPrefNodesBtn);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Set Node Preferences')).toBeTruthy();
    });

    // Click Cancel button
    const cancelBtn = await screen.findByTestId('cancelButton');
    await user.click(cancelBtn);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeFalsy();
    });
  });

  it('applies node preferences based on download type selection', async () => {
    const stacItem: RawSearchResult = rawSearchResultFixture({
      id: 'stac-item-1',
      isStac: true,
      assets: {
        asset1: stacAssetFixture({
          alternateName: 'node-a.example.com',
          'alternate:name': 'node-a.example.com',
          href: 'https://node-a.example.com/file.nc',
        }),
        asset2: stacAssetFixture({
          alternateName: 'node-b.example.com',
          'alternate:name': 'node-b.example.com',
          href: 'https://app.globus.org/file-manager?origin_id=abc123',
        }),
      },
    });

    // Set download type to Globus for this item
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [stacItem]);
    AtomWrapper.modifyAtomValue(CartStateKeys.downloadSelections, {
      'stac-item-1': 'Globus',
    });
    AtomWrapper.modifyAtomValue(CartStateKeys.selectedNodes, {});

    customRender(<Items {...defaultProps} />, { usesAtoms: true });

    // Click Set Preferred Nodes button
    const setPrefNodesBtn = await screen.findByText('Set Preferred Nodes');
    await user.click(setPrefNodesBtn);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText('Set Node Preferences')).toBeTruthy();
    });

    // The modal should show nodes filtered for Globus download type
    // node-b should be available since it has a Globus URL
    expect(screen.getByText('node-b.example.com')).toBeTruthy();

    // Click Apply - this calls handleApplyNodePreferences with Globus filtering
    const applyBtn = await screen.findByTestId('applyButton');
    await user.click(applyBtn);

    // Verify modal closes after applying preferences
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeFalsy();
    });
  });
});
