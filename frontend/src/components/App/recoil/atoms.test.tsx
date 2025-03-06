import { RecoilRoot, useRecoilState } from 'recoil';
import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import isDarkModeAtom from './atoms';

const TestComponent = (): React.ReactNode => {
  const [isDarkMode, setIsDarkMode] = useRecoilState(isDarkModeAtom);
  return (
    <div>
      <span data-testid="isDarkMode">{isDarkMode.toString()}</span>
      <button type="button" onClick={() => setIsDarkMode(true)} data-testid="setDarkModeTrue">
        Set Dark Mode True
      </button>
      <button type="button" onClick={() => setIsDarkMode(false)} data-testid="setDarkModeFalse">
        Set Dark Mode False
      </button>
    </div>
  );
};

describe('isDarkModeAtom', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default value', () => {
    render(
      <RecoilRoot>
        <TestComponent />
      </RecoilRoot>
    );

    const isDarkMode = screen.getByTestId('isDarkMode');
    expect(isDarkMode.textContent).toBe('false');
  });

  it('should persist value to localStorage', async () => {
    render(
      <RecoilRoot>
        <TestComponent />
      </RecoilRoot>
    );

    const setDarkModeTrueButton = await screen.findByTestId('setDarkModeTrue');
    await userEvent.click(setDarkModeTrueButton);

    expect(localStorage.getItem('isDarkMode')).toBe('true');
  });

  it('should read value from localStorage', () => {
    localStorage.setItem('isDarkMode', 'true');

    render(
      <RecoilRoot>
        <TestComponent />
      </RecoilRoot>
    );

    const isDarkMode = screen.getByTestId('isDarkMode');
    expect(isDarkMode.textContent).toBe('true');
  });

  it('should reset value and remove from localStorage', async () => {
    render(
      <RecoilRoot>
        <TestComponent />
      </RecoilRoot>
    );
    const setDarkModeTrueButton = await screen.findByTestId('setDarkModeTrue');
    await userEvent.click(setDarkModeTrueButton);

    const setDarkModeFalseButton = await screen.findByTestId('setDarkModeFalse');
    await userEvent.click(setDarkModeFalseButton);

    expect(localStorage.getItem('isDarkMode')).toBe('false');
  });
});
