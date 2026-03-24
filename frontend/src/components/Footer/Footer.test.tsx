import React from 'react';
import { screen } from '@testing-library/react';
import Footer from './Footer';
import { mockConfig } from '../../test/jestTestFunctions';
import startupDisplayData from '../Messaging/messageDisplayData';
import customRender from '../../test/custom-render';

const metagridVersion: string = startupDisplayData.messageToShow;

describe('Footer Component', () => {
  const mockFooterText = 'This is a footer text';

  it('renders the metagrid version correctly', () => {
    // Mock the window.METAGRID object
    mockConfig.FOOTER_TEXT = mockFooterText;
    customRender(<Footer />);
    expect(screen.getByText(`Metagrid Version: ${metagridVersion}`)).toBeInTheDocument();
  });

  it('renders the footer text correctly', () => {
    // Mock the window.METAGRID object
    mockConfig.FOOTER_TEXT = mockFooterText;
    customRender(<Footer />);
    expect(screen.getByText(mockFooterText)).toBeInTheDocument();
  });
});
