import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { isDarkModeAtom } from './atoms';
import { Provider, useAtom } from 'jotai';
import { localStorageMock } from '../test/mock/mockStorage';

const TestComponent = (): JSX.Element => {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  return (
    <Provider>
      <span data-testid="isDarkMode">{isDarkMode.toString()}</span>
      <button type="button" onClick={() => setIsDarkMode(true)} data-testid="setDarkModeTrue">
        Set Dark Mode True
      </button>
      <button type="button" onClick={() => setIsDarkMode(false)} data-testid="setDarkModeFalse">
        Set Dark Mode False
      </button>
    </Provider>
  );
};

describe('isDarkModeAtom', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with default value', () => {
    render(<TestComponent />);

    const isDarkMode = screen.getByTestId('isDarkMode');
    expect(isDarkMode.textContent).toBe('false');
  });

  it('should persist value to localStorage', async () => {
    render(<TestComponent />);

    const setDarkModeTrueButton = await screen.findByTestId('setDarkModeTrue');
    await userEvent.click(setDarkModeTrueButton);

    expect(localStorageMock.getItem('isDarkMode')).toBe('true');
  });

  it('should read value from localStorage', () => {
    localStorageMock.setItem('isDarkMode', 'true');

    render(<TestComponent />);

    const isDarkMode = screen.getByTestId('isDarkMode');
    expect(isDarkMode.textContent).toBe('true');
  });

  it('should reset value and remove from localStorage', async () => {
    render(<TestComponent />);
    const setDarkModeTrueButton = await screen.findByTestId('setDarkModeTrue');
    await userEvent.click(setDarkModeTrueButton);
    expect(localStorageMock.getItem('isDarkMode')).toBe('true');

    const setDarkModeFalseButton = await screen.findByTestId('setDarkModeFalse');
    await userEvent.click(setDarkModeFalseButton);

    expect(localStorageMock.getItem('isDarkMode')).toBe('false');
  });
});
