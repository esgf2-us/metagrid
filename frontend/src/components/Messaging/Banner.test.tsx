import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import customRender from '../../test/custom-render';
import Banner from './Banner';
import { AtomWrapper, printElementContents } from '../../test/jestTestFunctions';
import { darkModeRed, lightModeRed } from '../NodeStatus/StatusToolTip';

describe('Banner Component', () => {
  beforeEach(() => {
    window.METAGRID.BANNER_TEXT = ''; // Reset banner text before each test
    sessionStorage.clear(); // Clear local storage to ensure no previous state affects the tests
  });

  it('renders the banner with the correct message', () => {
    window.METAGRID.BANNER_TEXT = 'Welcome to Metagrid!';
    customRender(<Banner />);
    expect(screen.getByText('Welcome to Metagrid!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /close-square/i })).toBeInTheDocument();
    const closeButton = screen.getByRole('img', { name: /close-square/i }).querySelector('path');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton?.getAttribute('fill')).toBe(lightModeRed);
  });

  it('renders the banner in dark mode', () => {
    window.METAGRID.BANNER_TEXT = 'Welcome to Metagrid!';
    AtomWrapper.modifyAtomValue('isDarkMode', true);
    customRender(<Banner />, { usesAtoms: true });
    expect(screen.getByText('Welcome to Metagrid!')).toBeInTheDocument();
    const closeButton = screen.getByRole('img', { name: /close-square/i }).querySelector('path');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton?.getAttribute('fill')).toBe(darkModeRed);
  });

  it('Does not render the banner if banner text is empty', () => {
    window.METAGRID.BANNER_TEXT = null;
    sessionStorage.setItem('showBanner', 'This is a test banner.');
    customRender(<Banner />);
    expect(screen.queryByText('This is a test banner.')).not.toBeInTheDocument();
  });

  it('Does not render the banner if banner text was saved (meaning banner was seen and closed)', () => {
    window.METAGRID.BANNER_TEXT = 'This is a test banner.';
    sessionStorage.setItem('showBanner', 'This is a test banner.');
    customRender(<Banner />);
    expect(screen.queryByText('This is a test banner.')).not.toBeInTheDocument();
  });

  it('hides the banner when the close button is clicked', () => {
    window.METAGRID.BANNER_TEXT = 'This is a dismissible banner.';
    customRender(<Banner />);
    expect(screen.getByText('This is a dismissible banner.')).toBeInTheDocument();
    const closeButton = screen.getByRole('img', { name: /close-square/i });
    fireEvent.click(closeButton);
    expect(screen.queryByText('This is a dismissible banner.')).not.toBeInTheDocument();
  });
});
