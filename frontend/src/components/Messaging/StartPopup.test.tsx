import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import StartPopup from './StartPopup';
import StartupMessages from './messageDisplayData';
import { TourTitles } from '../../common/reactJoyrideSteps';

// const defaultMessageId = StartupMessages.defaultMessageId;
// const currentMessageId = StartupMessages.messageToShow;

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

afterEach(() => {
  jest.clearAllMocks();
});

describe('Start popup tests', () => {
  it('renders start popup with welcome message if no local data exists.', () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();
  });

  it('renders start popup with welcome message and starts search tour.', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const searchTourBtn = getByText(TourTitles.Main);
    expect(welcomeHeader).toBeTruthy();
    fireEvent.click(searchTourBtn);
  });

  it('renders start popup with welcome message and starts cart tour.', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const cartTourBtn = getByText(TourTitles.Cart);
    expect(welcomeHeader).toBeTruthy();
    fireEvent.click(cartTourBtn);
  });

  it('renders start popup with welcome message and starts saved search tour.', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const searchesTourBtn = getByText(TourTitles.Searches);
    expect(welcomeHeader).toBeTruthy();
    fireEvent.click(searchesTourBtn);
  });

  it('renders start popup with welcome message and starts node page tour.', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check welcome template rendered (default)
    const welcomeHeader = getByTestId('welcomeTemplate');
    expect(welcomeHeader).toBeTruthy();

    const nodeTourBtn = getByText(TourTitles.Node);
    expect(welcomeHeader).toBeTruthy();
    fireEvent.click(nodeTourBtn);
  });

  it('renders start popup with message data missing.', () => {
    StartupMessages.defaultMessageId = 'test';
    const { getByText } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );
    StartupMessages.defaultMessageId = defaultMessageId;

    // Check welcome template rendered (default)
    const missing = getByText('Message Data Missing');
    expect(missing).toBeTruthy();
  });

  it('renders start popup with wrong version specified', () => {
    window.localStorage.setItem('lastMessageSeen', 'test');
    const { getByTestId } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check changelog template rendered
    const changelog = getByTestId('changelogTemplate');
    expect(changelog).toBeTruthy();
  });

  it('start popup doesnt render when correct version is specified', () => {
    window.localStorage.setItem('lastMessageSeen', messageToShow);
    const { queryByText } = render(
      <MemoryRouter>
        <StartPopup />
      </MemoryRouter>
    );

    // Check that popup doesn't render
    const github = queryByText('GitHub Issues');
    expect(github).toBeFalsy();
  });
});
