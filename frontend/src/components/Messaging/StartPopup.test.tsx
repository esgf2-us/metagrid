import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from '@testing-library/react';
import StartPopup from './StartPopup';
import StartupMessages from './messageDisplayData';
import { TourTitles } from '../../common/reactJoyrideSteps';
import customRender from '../../test/custom-render';

const { defaultMessageId, messageToShow } = StartupMessages;

const user = userEvent.setup();

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

afterEach(() => {
  jest.clearAllMocks();
});

describe('Start popup tests', () => {
  it('renders start popup with welcome message if no local data exists.', () => {
    const { getByTestId } = customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();
  });

  it('renders start popup with welcome message and starts search tour.', async () => {
    const { getByTestId, getByText } = customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const searchTourBtn = getByText(TourTitles.Main);
    expect(welcomeHeader).toBeTruthy();

    await act(async () => {
      await user.click(searchTourBtn);
    });
  });

  it('renders start popup with welcome message and starts cart tour.', async () => {
    const { getByTestId, getByText } = customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const cartTourBtn = getByText(TourTitles.Cart);
    expect(welcomeHeader).toBeTruthy();

    await act(async () => {
      await user.click(cartTourBtn);
    });
  });

  it('renders start popup with welcome message and starts saved search tour.', async () => {
    const { getByTestId, getByText } = customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const searchesTourBtn = getByText(TourTitles.Searches);
    expect(welcomeHeader).toBeTruthy();

    await act(async () => {
      await user.click(searchesTourBtn);
    });
  });

  it('renders start popup with welcome message and starts node page tour.', async () => {
    const { getByTestId, getByText } = customRender(<StartPopup />);

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const nodeTourBtn = getByText(TourTitles.Node);
    expect(welcomeHeader).toBeTruthy();

    await act(async () => {
      await user.click(nodeTourBtn);
    });
  });

  it('renders start popup with message data missing.', () => {
    StartupMessages.defaultMessageId = 'test';
    const { getByText } = customRender(<StartPopup />);
    StartupMessages.defaultMessageId = defaultMessageId;

    // Check welcome template rendered (default)
    const missing = getByText('Message Data Missing');
    expect(missing).toBeTruthy();
  });

  it('renders start popup with wrong version specified', () => {
    window.localStorage.setItem('lastMessageSeen', 'test');
    const { getByTestId } = customRender(<StartPopup />);

    // Check changelog template rendered
    const changelog = getByTestId('changelogTemplate');
    expect(changelog).toBeTruthy();
  });

  it('start popup doesnt render when correct version is specified', () => {
    window.localStorage.setItem('lastMessageSeen', messageToShow);
    const { queryByText } = customRender(<StartPopup />);

    // Check that popup doesn't render
    const github = queryByText('GitHub Issues');
    expect(github).toBeFalsy();
  });
});
