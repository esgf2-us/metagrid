import React from 'react';
import { screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import GlobusToolTip from './GlobusToolTip';
import { originalGlobusEnabledNodes } from '../../test/jestTestFunctions';

describe('Testing the GlobusToolTip component', () => {
  it('Renders the GlobusToolTip component properly with empty node and no children', async () => {
    customRender(<GlobusToolTip dataNode=""></GlobusToolTip>);
    // Should show globus unavailable status
    const status = await screen.findByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with empty node and children', async () => {
    customRender(
      <GlobusToolTip dataNode="">
        <p>Click Me!</p>
      </GlobusToolTip>
    );
    // Should show children
    const result = await screen.findByText('Click Me!', { exact: false });
    expect(result).toBeTruthy();
    // Should show globus unavailable status
    const status = await screen.findByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with node and children', async () => {
    customRender(
      <GlobusToolTip dataNode="notEnabled">
        <p>Click Me!</p>
      </GlobusToolTip>
    );
    // Should show children
    const result = await screen.findByText('Click Me!', { exact: false });
    expect(result).toBeTruthy();
    // Should show globus unavailable status (because node is not globus enabled)
    const status = await screen.findByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with globus enabled node and no children', async () => {
    customRender(<GlobusToolTip dataNode={originalGlobusEnabledNodes[0]}></GlobusToolTip>);
    // Should show globus as available status
    const status = await screen.findByRole('img', { name: 'check-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with globus enabled node and children', async () => {
    customRender(
      <GlobusToolTip dataNode={originalGlobusEnabledNodes[0]}>
        <p>Click Me!</p>
      </GlobusToolTip>
    );
    // Should show children
    const result = await screen.findByText('Click Me!', { exact: false });
    expect(result).toBeTruthy();
    // Should show globus as available status
    const status = await screen.findByRole('img', { name: 'check-circle' });
    expect(status).toBeTruthy();
  });
});
