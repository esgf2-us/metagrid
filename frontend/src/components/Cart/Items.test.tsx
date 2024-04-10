import { waitFor, within, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { userCartFixture } from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/server';
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

jest.setTimeout(35000); // Some tests require more time to run

describe('test the cart items component', () => {
  it('renders message that the cart is empty when no items are added', () => {
    const props = { ...defaultProps, userCart: [] };
    const { getByText } = customRender(<Items {...props} />);

    // Check empty cart text renders
    const emptyCart = getByText('Your cart is empty');
    expect(emptyCart).toBeTruthy();
  });

  it('removes all items from the cart when confirming the popconfirm', async () => {
    const { getByTestId, getByRole, getAllByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Wait for results to load
    await waitFor(() =>
      expect(
        screen.getByText('results found for', { exact: false })
      ).toBeTruthy()
    );

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
      })
    );
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');

    await act(async () => {
      await user.click(cartBtn);
    });

    // Click the Remove All Items button
    const removeAllBtn = getByRole('button', { name: 'Remove All Items' });
    expect(removeAllBtn).toBeTruthy();

    await act(async () => {
      await user.click(removeAllBtn);
    });

    // Check popover appears
    const popOver = getByRole('tooltip');
    expect(popOver).toBeInTheDocument();

    // Submit the popover
    const submitPopOverBtn = getByRole('button', { name: /ok/i });
    expect(submitPopOverBtn).toBeInTheDocument();

    await act(async () => {
      await user.click(submitPopOverBtn);
    });

    // Expect cart to now be empty
    expect(screen.getByText('Your cart is empty')).toBeTruthy();
  });

  it('handles selecting items in the cart and downloading them via wget', async () => {
    const { getByTestId, getByRole, getAllByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Wait for results to load
    await waitFor(() =>
      expect(
        screen.getByText('results found for', { exact: false })
      ).toBeTruthy()
    );

    // Check first row has add button and click it
    const firstRow = getByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');

    await act(async () => {
      await user.click(cartBtn);
    });

    // Check download form renders
    const downloadForm = getByTestId('downloadForm');
    expect(downloadForm).toBeTruthy();

    // Check cart items component renders
    const cartItemsComponent = await waitFor(() => getByTestId('cartItems'));
    expect(cartItemsComponent).toBeTruthy();

    // Wait for cart items component to re-render
    await waitFor(() => getByTestId('cartItems'));

    // Check download button exists and submit the form
    const downloadBtn = within(firstRow).getByRole('button', {
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

    const { getByRole, getAllByRole, getByText } = customRender(
      <Items {...defaultProps} />
    );

    // Check first row renders and click the checkbox
    const firstRow = getByRole('row', {
      name: getRowName('minus', 'question', 'foo', '3', '1', '1', true),
    });
    const firstCheckBox = within(firstRow).getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();

    await act(async () => {
      await user.click(firstCheckBox);
    });

    const downloadBtn = getAllByRole('button', { name: 'download' })[0];
    await act(async () => {
      await user.click(downloadBtn);
    });

    expect(
      getByText(
        'The requested resource at the ESGF wget API service was invalid. Please contact support.',
        { exact: false }
      )
    ).toBeTruthy();
  });
});
