import React from 'react';
import { render } from '@testing-library/react';
import GlobusEndpointOption from './GlobusEndpointOption';
import {
  globusGuestCollectionFixture,
  globusManagedCollectionFixture,
  globusMappedCollectionFixture,
} from '../../test/mock/fixtures';

describe('Testing the GlobusEndpointOption component', () => {
  it('Renders placeholder when value is empty', () => {
    const endpoint = globusGuestCollectionFixture();
    const { container } = render(
      <GlobusEndpointOption label="Select Endpoint" value="" endpoint={endpoint} />,
    );
    const strong = container.querySelector('strong');
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe('Select Endpoint');
  });

  it('Renders Guest Collection with path and contact email', () => {
    const endpoint = globusGuestCollectionFixture({
      path: '/test/path',
      contact_email: 'test@example.com',
    });
    const { container } = render(
      <GlobusEndpointOption label="Test Endpoint" value="test-id-123" endpoint={endpoint} />,
    );

    expect(container.textContent).toContain('Test Endpoint');
    expect(container.textContent).toContain('ID: test-id-123');
    expect(container.textContent).toContain('Path: /test/path');
    expect(container.textContent).toContain('Guest Collection');
    expect(container.textContent).toContain('test@example.com');
  });

  it('Renders Managed Mapped Collection without path', () => {
    const endpoint = globusManagedCollectionFixture({
      contact_email: 'admin@example.com',
    });
    const { container } = render(
      <GlobusEndpointOption label="Managed Endpoint" value="managed-id-456" endpoint={endpoint} />,
    );

    expect(container.textContent).toContain('Managed Endpoint');
    expect(container.textContent).toContain('ID: managed-id-456');
    expect(container.textContent).toContain('Managed');
    expect(container.textContent).toContain('Mapped Collection');
    expect(container.textContent).toContain('admin@example.com');
    expect(container.textContent).not.toContain('Path:');
  });

  it('Renders Mapped Collection without managed status or contact email', () => {
    const endpoint = globusMappedCollectionFixture({
      contact_email: '',
    });
    const { container } = render(
      <GlobusEndpointOption label="Mapped Endpoint" value="mapped-id-789" endpoint={endpoint} />,
    );

    expect(container.textContent).toContain('Mapped Endpoint');
    expect(container.textContent).toContain('ID: mapped-id-789');
    expect(container.textContent).toContain('Mapped Collection');
    expect(container.textContent).not.toContain('Managed');
    expect(container.textContent).not.toContain('Guest Collection');
  });
});
