import React from 'react';
import { screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import GlobusToolTip from './GlobusToolTip';
import { originalGlobusEnabledNodes } from '../../test/jestTestFunctions';

describe('Testing the GlobusToolTip component', () => {
  it('Renders the GlobusToolTip component properly with empty node', async () => {
    customRender(<GlobusToolTip dataNode=""></GlobusToolTip>);
    // Should show globus unavailable status
    const status = await screen.findByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with globus enabled node', async () => {
    customRender(<GlobusToolTip dataNode={originalGlobusEnabledNodes[0]}></GlobusToolTip>);
    // Should show globus as available status
    const status = await screen.findByRole('img', { name: 'check-circle' });
    expect(status).toBeTruthy();
  });
});
