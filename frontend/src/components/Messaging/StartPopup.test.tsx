import userEvent from '@testing-library/user-event';
import React from 'react';
import { screen } from '@testing-library/react';
import StartPopup from './StartPopup';
import StartupMessages from './messageDisplayData';
import { TourTitles } from '../../common/reactJoyrideSteps';
import customRender from '../../test/custom-render';
import { rest, server } from '../../test/mock/server';

const { defaultMessageId, messageToShow } = StartupMessages;

let mockNavigate: () => void;

beforeEach(() => {
  mockNavigate = jest.fn();
  jest.mock(
    'react-router-dom',
    () =>
      ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => ({
          push: mockNavigate,
        }),
      } as Record<string, unknown>)
  );
  window.localStorage.clear();
});

describe('Start popup tests', () => {
  it('renders start popup with welcome message if no local data exists.', async () => {
    customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = await screen.findByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();
  });

  it('renders start popup with welcome message and starts search tour.', async () => {
    customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = await screen.findByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const searchTourBtn = await screen.findByText(TourTitles.Main);
    expect(welcomeHeader).toBeTruthy();

    await userEvent.click(searchTourBtn);
  });

  it('renders start popup with welcome message and starts cart tour.', async () => {
    customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = await screen.findByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const cartTourBtn = await screen.findByText(TourTitles.Cart);
    expect(welcomeHeader).toBeTruthy();

    await userEvent.click(cartTourBtn);
  });

  it('renders start popup with welcome message and starts saved search tour.', async () => {
    customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = await screen.findByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const searchesTourBtn = await screen.findByText(TourTitles.Searches);
    expect(welcomeHeader).toBeTruthy();

    await userEvent.click(searchesTourBtn);
  });

  it('renders start popup with welcome message and starts node page tour.', async () => {
    customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = await screen.findByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const nodeTourBtn = await screen.findByText(TourTitles.Node);
    expect(welcomeHeader).toBeTruthy();

    await userEvent.click(nodeTourBtn);
  });

  it('renders start popup with message data missing.', async () => {
    StartupMessages.defaultMessageId = 'test';
    customRender(<StartPopup />);
    StartupMessages.defaultMessageId = defaultMessageId;

    // Check welcome template rendered (default)
    const missing = await screen.findByText('Message Data Missing');
    expect(missing).toBeTruthy();
  });

  it('renders start popup with wrong version specified', async () => {
    server.use(rest.get('/changelog/v*.md', (_req, res, ctx) => res(ctx.body('Some changes'))));

    window.localStorage.setItem('lastMessageSeen', 'test');
    customRender(<StartPopup />);

    // Check changelog template rendered
    const changelog = await screen.findByTestId('changelogTemplate');
    expect(changelog).toBeTruthy();
  });

  it('start popup doesnt render when correct version is specified', () => {
    window.localStorage.setItem('lastMessageSeen', messageToShow);
    customRender(<StartPopup />);

    // Check that popup doesn't render
    const github = screen.queryByText('GitHub Issues');
    expect(github).toBeFalsy();
  });
});
