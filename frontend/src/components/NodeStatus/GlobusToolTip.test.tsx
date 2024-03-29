import React from 'react';
import customRender from '../../test/custom-render';
import GlobusToolTip from './GlobusToolTip';
import { originalEnabledNodes } from '../../test/jestTestFunctions';

describe('Testing the GlobusToolTip component', () => {
  it('Renders the GlobusToolTip component properly with empty node and no children', () => {
    const { getByRole } = customRender(
      <GlobusToolTip dataNode=""></GlobusToolTip>
    );
    // Should show globus unavailable status
    const status = getByRole('img', { name: 'close-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with empty node and children', () => {
    const { getByText, getByRole } = customRender(
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
    const { getByText, getByRole } = customRender(
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
    const { getByRole } = customRender(
      <GlobusToolTip dataNode={originalEnabledNodes[0]}></GlobusToolTip>
    );
    // Should show globus as available status
    const status = getByRole('img', { name: 'check-circle' });
    expect(status).toBeTruthy();
  });

  it('Renders the GlobusToolTip component properly with globus enabled node and children', () => {
    const { getByRole, getByText } = customRender(
      <GlobusToolTip dataNode={originalEnabledNodes[0]}>
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
