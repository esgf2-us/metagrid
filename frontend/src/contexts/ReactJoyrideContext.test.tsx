import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getCurrentAppPage, TourTitles } from '../common/reactJoyrideSteps';
import { AppPage } from '../common/types';
import Support from '../components/Support';
import customRender from '../test/custom-render';

const user = userEvent.setup();

describe('test ReactJoyrideProvider', () => {
  it('renders using provider', async () => {
    const { getByTestId, getByText } = customRender(
      <div data-testid="reactJoyrideProvider">
        <p>renders</p>
      </div>
    );

    // Wait for render to get user auth info
    const joyrideProvider = await waitFor(() =>
      getByTestId('reactJoyrideProvider')
    );
    expect(joyrideProvider).toBeTruthy();

    // Wait for re-render to get user info
    await waitFor(() => getByTestId('reactJoyrideProvider'));

    // Check children renders
    const renderResult = await waitFor(() => getByText('renders'));
    expect(renderResult).toBeTruthy();
  });

  it('Can render a tour properly', async () => {
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

    // Set location then render modal
    window.location.pathname = 'testing/search';
    expect(getCurrentAppPage()).toEqual(AppPage.Main);
    const { getByTestId, getByRole } = customRender(
      <Support open onClose={jest.fn()} />
    );

    // Check support modal rendered
    const support = getByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = getByRole('button', { name: TourTitles.Main });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders
    await act(async () => {
      await user.click(button);
    });
    await waitFor(() => button);
    const tourModal = getByRole('heading', { name: TourTitles.Main });
    expect(tourModal).toBeTruthy();

    // Click 'Next' to make sure it can move forward in the tour
    let nextBtn = getByRole('button', { name: 'Next' });
    expect(nextBtn).toBeTruthy();

    await act(async () => {
      await user.click(button);
    });
    await waitFor(() => button);
    nextBtn = getByRole('button', { name: 'Next' });

    expect(nextBtn).toBeTruthy();
  });
});
