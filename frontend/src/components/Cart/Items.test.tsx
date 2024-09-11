import { within, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { userCartFixture } from '../../test/mock/fixtures';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import Items, { Props } from './Items';
import { getRowName } from '../../test/jestTestFunctions';
import { getSearchFromUrl } from '../../common/utils';
import App from '../App/App';
import { ActiveSearchQuery } from '../Search/types';

const defaultProps: Props = {
  userCart: userCartFixture(),
  onUpdateCart: jest.fn(),
  onClearCart: jest.fn(),
};

const user = userEvent.setup();

const activeSearch: ActiveSearchQuery = getSearchFromUrl('project=test1');

jest.setTimeout(50000);

describe('test the cart items component', () => {
  it('renders message that the cart is empty when no items are added', async () => {
    const props = { ...defaultProps, userCart: [] };
    customRender(<Items {...props} />);

    // Check empty cart text renders
    const emptyCart = await screen.findByText('Your cart is empty');
    expect(emptyCart).toBeTruthy();
  });

  it('removes all items from the cart when confirming the popconfirm', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    expect(
      await screen.findByText('results found for', { exact: false })
    ).toBeTruthy();

    // Check first row exists
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = await within(firstRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = (
      await screen.findAllByText('Added item(s) to your cart')
    )[0];
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = await screen.findByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Click the Remove All Items button
    const removeAllBtn = await screen.findByRole('button', {
      name: 'Remove All Items',
    });
    expect(removeAllBtn).toBeTruthy();
    await act(async () => {
      await user.click(removeAllBtn);
    });

    // Check popover appears
    const popOver = await screen.findByRole('tooltip');
    expect(popOver).toBeInTheDocument();

    // Submit the popover
    const submitPopOverBtn = await screen.findByRole('button', { name: /ok/i });
    expect(submitPopOverBtn).toBeInTheDocument();
    await act(async () => {
      await user.click(submitPopOverBtn);
    });

    // Expect cart to now be empty
    expect(await screen.findByText('Your cart is empty')).toBeTruthy();
  });

  it('handles selecting items in the cart and downloading them via wget', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    expect(
      await screen.findByText('results found for', { exact: false })
    ).toBeTruthy();

    // Check first row has add button and click it
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });
    const addBtn = await within(firstRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = (
      await screen.findAllByText('Added item(s) to your cart')
    )[0];
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = await screen.findByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(downloadBtn);
    });
  });

  it('handles error selecting items in the cart and downloading them via wget', async () => {
    // Override route HTTP response
    server.use(
      rest.post(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404)))
    );

    customRender(<Items {...defaultProps} />);

    // Check first row renders and click the checkbox
    const firstRow = await screen.findByRole('row', {
      name: getRowName('minus', 'question', 'foo', '3', '1', '1', true),
    });
    const firstCheckBox = await within(firstRow).findByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    const downloadBtn = (
      await screen.findAllByRole('button', {
        name: 'download',
      })
    )[0];
    await act(async () => {
      await user.click(downloadBtn);
    });

    expect(
      await screen.findByText(
        'The requested resource at the ESGF wget API service was invalid. Please contact support.',
        { exact: false }
      )
    ).toBeTruthy();
  });
});
