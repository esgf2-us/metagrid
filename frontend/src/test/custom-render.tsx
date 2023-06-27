import { render, RenderResult } from '@testing-library/react';
import React, { ComponentType } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

type AllProvidersProps = {
  children: React.ReactNode;
};
type CustomOptions = {
  authenticated?: boolean;
  idTokenParsed?: Record<string, string>;
  token?: string;
};

/**
 * Wraps components in all implemented React Context Providers for testing
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
export const customRender = (
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult => {
  function AllProviders({ children }: AllProvidersProps): React.ReactElement {
    return (
      <AuthProvider>
        <MemoryRouter basename={process.env.PUBLIC_URL}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};

/**
 * Creates the appropriate name string when performing getByRole('row')
 */
export const getRowName = (
  cartButton: 'plus' | 'minus',
  nodeCircleType: 'question' | 'check' | 'close',
  title: string,
  fileCount: string,
  totalSize: string,
  version: string
): string => {
  let totalBytes = `${totalSize} Bytes`;
  if (Number.isNaN(Number(totalSize))) {
    totalBytes = totalSize;
  }
  return `right-circle ${cartButton} ${nodeCircleType}-circle ${title} ${fileCount} ${totalBytes} ${version} wget download`;
};
