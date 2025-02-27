import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer, { Props } from './Footer';
import { mockConfig } from '../../test/jestTestFunctions';

describe('Footer Component', () => {
  const mockFooterText = 'This is a footer text';
  const props: Props = {
    metagridVersion: '1.3.0',
  };

  beforeAll(() => {
    // Mock the window.METAGRID object
    mockConfig.FOOTER_TEXT = mockFooterText;
  });

  it('renders the metagrid version correctly', () => {
    render(<Footer {...props} />);
    expect(screen.getByText(`Metagrid Version: ${props.metagridVersion}`)).toBeInTheDocument();
  });

  it('renders the footer text correctly', () => {
    render(<Footer {...props} />);
    expect(screen.getByText(mockFooterText)).toBeInTheDocument();
  });
});
