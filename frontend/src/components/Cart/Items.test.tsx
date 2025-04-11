import { within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import Items, { Props } from './Items';
import { getSearchFromUrl } from '../../common/utils';
import App from '../App/App';
import { ActiveSearchQuery } from '../Search/types';
import { AppStateKeys } from '../../common/atoms';
import { AtomWrapper } from '../../test/jestTestFunctions';

const defaultProps: Props = {
  onUpdateCart: jest.fn(),
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
        { exact: false }
      )
    ).toBeTruthy();
  });
});
