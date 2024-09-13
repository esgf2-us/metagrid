import userEvent from '@testing-library/user-event';
import React from 'react';
import { act, screen } from '@testing-library/react';
import { getCurrentAppPage, TourTitles } from '../../common/reactJoyrideSteps';
import { AppPage } from '../../common/types';
import Support from './index';
import customRender from '../../test/custom-render';

// Test page names
const mainPagePath = 'testing/search';
const cartPagePath = 'testing/cart/items';
const savedSearchesPath = 'testing/cart/searches';
const nodeStatusPath = 'testing/cart/nodes';

describe('Testing the support form and buttons', () => {
  // Create object for user events
  const user = userEvent.setup();

  // eslint-disable-next-line
  window = Object.create(window);
  const url = 'https://test.com/search';
  Object.defineProperty(window, 'location', {
    value: {
      href: url,
      pathname: 'testing/search',
    },
    writable: true,
  });

  it('renders support component', async () => {
    customRender(<Support open onClose={jest.fn()} />);

    // Check support form rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();
  });

  it('renders starts main page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);

    customRender(<Support open onClose={jest.fn()} />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.Main,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await act(async () => {
      await user.click(button);
    });
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Main,
    });
    expect(tourModal).toBeTruthy();
  });

  it('renders starts cart page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = cartPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);

    customRender(<Support open onClose={jest.fn()} />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.Cart });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await act(async () => {
      await user.click(button);
    });
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Cart,
    });
    expect(tourModal).toBeTruthy();
  });

  it('renders starts saved searches tutorial', async () => {
    // Set location then render modal
    window.location.pathname = savedSearchesPath;
    expect(getCurrentAppPage()).toEqual(AppPage.SavedSearches);

    customRender(<Support open onClose={jest.fn()} />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.Searches,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await act(async () => {
      await user.click(button);
    });
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Searches,
    });
    expect(tourModal).toBeTruthy();
  });

  it('renders starts cart page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = nodeStatusPath;
    expect(getCurrentAppPage()).toEqual(AppPage.NodeStatus);

    customRender(<Support open onClose={jest.fn()} />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.Node });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await act(async () => {
      await user.click(button);
    });
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Node,
    });
    expect(tourModal).toBeTruthy();
  });
});
