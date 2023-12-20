/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import React from 'react';
import { customRenderKeycloak } from '../../test/custom-render';
import GlobusToolTip from './GlobusToolTip';

// For mocking environment variables
// https://www.mikeborozdin.com/post/changing-jest-mocks-between-tests
const newEnabledNodes = ['globusEnabled', 'globusEnabled2', 'globusEnabled3'];

// Mock the globusEnabledNodes variable to simulate configuration
jest.mock('../../env', () => {
  const originalModule = jest.requireActual('../../env');

  return {
    __esModule: true,
    ...originalModule,
    globusEnabledNodes: newEnabledNodes,
  };
});

describe('Testing the GlobusToolTip component', () => {
  it('Renders the GlobusToolTip component properly with empty node and no children', () => {
    const { getByRole } = customRenderKeycloak(
      <GlobusToolTip dataNode=""></GlobusToolTip>
    );
    // Should show globus unavailable status
    const status = getByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with empty node and children', () => {
    const { getByText, getByRole } = customRenderKeycloak(
      <GlobusToolTip dataNode="">
        <p>Click Me!</p>
      </GlobusToolTip>
    );
    // Should show children
    const result = getByText('Click Me!', { exact: false });
    expect(result).toBeTruthy();
    // Should show globus unavailable status
    const status = getByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with node and children', () => {
    const { getByText, getByRole } = customRenderKeycloak(
      <GlobusToolTip dataNode="notEnabled">
        <p>Click Me!</p>
      </GlobusToolTip>
    );
    // Should show children
    const result = getByText('Click Me!', { exact: false });
    expect(result).toBeTruthy();
    // Should show globus unavailable status (because node is not globus enabled)
    const status = getByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with globus enabled node and no children', () => {
    const { getByRole } = customRenderKeycloak(
      <GlobusToolTip dataNode="globusEnabled"></GlobusToolTip>
    );
    // Should show globus as available status
    const status = getByRole('img', { name: 'check-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with globus enabled node and children', () => {
    const { getByRole, getByText } = customRenderKeycloak(
      <GlobusToolTip dataNode="globusEnabled">
        <p>Click Me!</p>
      </GlobusToolTip>
    );
    // Should show children
    const result = getByText('Click Me!', { exact: false });
    expect(result).toBeTruthy();
    // Should show globus as available status
    const status = getByRole('img', { name: 'check-circle' });
    expect(status).toBeTruthy();
  });
});
