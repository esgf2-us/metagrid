import userEvent from '@testing-library/user-event';
import React from 'react';
import { screen } from '@testing-library/react';
import { expect } from 'vitest';
import { AppPage } from '../../common/types';
import Support from './index';
import customRender from '../../test/custom-render';
import { getCurrentAppPage } from '../../common/utils';
import { activeSearch, AtomWrapper } from '../../test/testFunctions';
import { AppStateKeys } from '../../common/atoms';
import { navBarTargets, TourTitles } from '../../common/joyrideTutorials/reactJoyrideSteps';
import App from '../App/App';

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

  beforeEach(() => {
    AtomWrapper.modifyAtomValue(AppStateKeys.supportModalVisible, true);
  });

  it('renders support component', async () => {
    customRender(<Support />);

    // Check support form rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();
  });

  it('starts main page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.Main,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Main,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts main page navbar tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.MainNavBar,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.MainNavBar,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts main page facets panel tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.MainFacetsPanel,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.MainFacetsPanel,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts main page search features tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.MainSearchFeatures,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.MainSearchFeatures,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts search results tutorial', async () => {
    // Set location then render modal
    window.location.pathname = mainPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Main);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.SearchResults,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.SearchResults,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts cart page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = cartPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.Cart });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Cart,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts cart dataset details tutorial', async () => {
    // Set location then render modal
    window.location.pathname = cartPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.CartDatasetDetails });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.CartDatasetDetails,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts cart download options tutorial', async () => {
    // Set location then render modal
    window.location.pathname = cartPagePath;
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.CartDownloadOptions });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.CartDownloadOptions,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts saved searches tutorial', async () => {
    // Set location then render modal
    window.location.pathname = savedSearchesPath;
    expect(getCurrentAppPage()).toEqual(AppPage.SavedSearches);
    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', {
      name: TourTitles.SavedSearches,
    });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.SavedSearches,
    });
    expect(tourModal).toBeTruthy();
  });

  it('starts node status page tutorial', async () => {
    // Set location then render modal
    window.location.pathname = nodeStatusPath;
    expect(getCurrentAppPage()).toEqual(AppPage.NodeStatus);

    customRender(<Support />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.NodeStatus });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await user.click(button);
    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.NodeStatus,
    });
    expect(tourModal).toBeTruthy();
  });
});
