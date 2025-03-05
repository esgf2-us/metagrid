import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TourTitles } from '../common/reactJoyrideSteps';
import { AppPage } from '../common/types';
import Support from '../components/Support';
import customRender from '../test/custom-render';
import { getCurrentAppPage } from '../common/utils';

const user = userEvent.setup();

describe('test ReactJoyrideProvider', () => {
  it('renders using provider', async () => {
    customRender(
      <div data-testid="reactJoyrideProvider">
        <p>renders</p>
      </div>
    );

    // Wait for render to get user auth info
    const joyrideProvider = await screen.findByTestId('reactJoyrideProvider');
    expect(joyrideProvider).toBeTruthy();

    // Wait for re-render to get user info
    await screen.findByTestId('reactJoyrideProvider');

    // Check children renders
    const renderResult = await screen.findByText('renders');
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

    customRender(<Support open onClose={jest.fn()} />);

    // Check support modal rendered
    const support = await screen.findByTestId('support-form');
    expect(support).toBeTruthy();

    // Check appropriate tutorial button rendered
    const button = await screen.findByRole('button', { name: TourTitles.Main });
    expect(button).toBeTruthy();

    // Start tutorial and check that it renders

    await user.click(button);

    const tourModal = await screen.findByRole('heading', {
      name: TourTitles.Main,
    });
    expect(tourModal).toBeTruthy();

    // Click 'Next' to make sure it can move forward in the tour
    let nextBtn = await screen.findByRole('button', { name: 'Next' });
    expect(nextBtn).toBeTruthy();

    await user.click(button);
    nextBtn = await screen.findByRole('button', { name: 'Next' });

    expect(nextBtn).toBeTruthy();
  });
});
