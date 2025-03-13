import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { mockConfig } from '../../test/jestTestFunctions';
import startupDisplayData from '../Messaging/messageDisplayData';

const metagridVersion: string = startupDisplayData.messageToShow;

describe('Footer Component', () => {
  const mockFooterText = 'This is a footer text';

  beforeAll(() => {
    // Mock the window.METAGRID object
    mockConfig.FOOTER_TEXT = mockFooterText;
  });

  it('renders the metagrid version correctly', () => {
    render(<Footer />);
    expect(screen.getByText(`Metagrid Version: ${metagridVersion}`)).toBeInTheDocument();
  });

  it('renders the footer text correctly', () => {
    render(<Footer />);
    expect(screen.getByText(mockFooterText)).toBeInTheDocument();
  });
});
