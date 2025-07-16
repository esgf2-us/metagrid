import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import customRender from '../../test/custom-render';
import Banner from './Banner';
import { AtomWrapper, mockConfig } from '../../test/jestTestFunctions';
import { darkModeRed, lightModeRed } from '../NodeStatus/StatusToolTip';
import { tempSessionStorageSetMock } from '../../test/mock/mockStorage';

describe('Banner Component', () => {
  beforeEach(() => {
    mockConfig.BANNER_TEXT = ''; // Reset banner text before each test
    sessionStorage.clear(); // Clear local storage to ensure no previous state affects the tests
  });

  it('renders the banner with the correct message', () => {
    mockConfig.BANNER_TEXT = 'Welcome to Metagrid!';
    customRender(<Banner />);
    expect(screen.getByText('Welcome to Metagrid!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /close-square/i })).toBeInTheDocument();
    const closeButton = screen.getByRole('img', { name: /close-square/i }).querySelector('path');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton?.getAttribute('fill')).toBe(lightModeRed);
  });

  it('renders the banner in dark mode', () => {
    mockConfig.BANNER_TEXT = 'Welcome to Metagrid!';
    AtomWrapper.modifyAtomValue('isDarkMode', true);
    customRender(<Banner />, { usesAtoms: true });
    expect(screen.getByText('Welcome to Metagrid!')).toBeInTheDocument();
    const closeButton = screen.getByRole('img', { name: /close-square/i }).querySelector('path');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton?.getAttribute('fill')).toBe(darkModeRed);
  });

  it('Does not render the banner if banner text is empty', () => {
    mockConfig.BANNER_TEXT = null;
    tempSessionStorageSetMock('showBanner', 'This is a test banner.');
    customRender(<Banner />);
    expect(screen.queryByText('This is a test banner.')).not.toBeInTheDocument();
  });

  it('Does not render the banner if banner text was saved (meaning banner was seen and closed)', () => {
    mockConfig.BANNER_TEXT = 'This is a test banner.';
    tempSessionStorageSetMock('showBanner', 'This is a test banner.');
    customRender(<Banner />);
    expect(screen.queryByText('This is a test banner.')).not.toBeInTheDocument();
  });

  it('hides the banner when the close button is clicked', () => {
    mockConfig.BANNER_TEXT = 'This is a dismissible banner.';
    customRender(<Banner />);
    expect(screen.getByText('This is a dismissible banner.')).toBeInTheDocument();
    const closeButton = screen.getByRole('img', { name: /close-square/i });
    fireEvent.click(closeButton);
    expect(screen.queryByText('This is a dismissible banner.')).not.toBeInTheDocument();
  });
});
