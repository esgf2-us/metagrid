import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { getCurrentAppPage, TourTitles } from '../../common/reactJoyrideSteps';
import { AppPage } from '../../common/types';
import { ReactJoyrideProvider } from '../../contexts/ReactJoyrideContext';
import Support from './index';

// Test page names
const mainPagePath = 'testing/search';
const cartPagePath = 'testing/cart/items';
const savedSearchesPath = 'testing/cart/searches';
const nodeStatusPath = 'testing/cart/nodes';

describe('Testing the support form and buttons', () => {
  // Create window object to set the pathname manually

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

  it('renders support component', () => {
    const { getByTestId } = render(<Support visible onClose={jest.fn()} />);

    // Check support form rendered
    const support = getByTestId('support-form');
    expect(support).toBeTruthy();
  });

  it('renders starts main page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);
    const { getByTestId, getByRole } = render(
      <ReactJoyrideProvider>
        <Support visible onClose={jest.fn()} />
      </ReactJoyrideProvider>,
      {
        wrapper: MemoryRouter,
      }
    );

    // Check support modal rendered
    const support = getByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = getByRole('button', { name: TourTitles.Main });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    fireEvent.click(button);
    await waitFor(() => button);
    const tourModal = getByRole('heading', { name: TourTitles.Main });
    expect(tourModal).toBeTruthy();
  });

  it('renders starts cart page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = cartPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);
    const { getByTestId, getByRole } = render(
      <ReactJoyrideProvider>
        <Support visible onClose={jest.fn()} />
      </ReactJoyrideProvider>,
      {
        wrapper: MemoryRouter,
      }
    );

    // Check support modal rendered
    const support = getByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = getByRole('button', { name: TourTitles.Cart });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    fireEvent.click(button);
    await waitFor(() => button);
    const tourModal = getByRole('heading', { name: TourTitles.Cart });
    expect(tourModal).toBeTruthy();
  });

  it('renders starts saved searches tutorial', async () => {
    // Set location then render modal
    window.location.pathname = savedSearchesPath;
    expect(getCurrentAppPage()).toEqual(AppPage.SavedSearches);
    const { getByTestId, getByRole } = render(
      <ReactJoyrideProvider>
        <Support visible onClose={jest.fn()} />
      </ReactJoyrideProvider>,
      {
        wrapper: MemoryRouter,
      }
    );

    // Check support modal rendered
    const support = getByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = getByRole('button', { name: TourTitles.Searches });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    fireEvent.click(button);
    await waitFor(() => button);
    const tourModal = getByRole('heading', { name: TourTitles.Searches });
    expect(tourModal).toBeTruthy();
  });

  it('renders starts cart page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = nodeStatusPath;
    expect(getCurrentAppPage()).toEqual(AppPage.NodeStatus);
    const { getByTestId, getByRole } = render(
      <ReactJoyrideProvider>
        <Support visible onClose={jest.fn()} />
      </ReactJoyrideProvider>,
      {
        wrapper: MemoryRouter,
      }
    );

    // Check support modal rendered
    const support = getByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = getByRole('button', { name: TourTitles.Node });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    fireEvent.click(button);
    await waitFor(() => button);
    const tourModal = getByRole('heading', { name: TourTitles.Node });
    expect(tourModal).toBeTruthy();
  });
});
