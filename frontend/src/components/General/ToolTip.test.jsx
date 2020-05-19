import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import ToolTip from './ToolTip';

it('returns component with required title', () => {
  const { getByText, findByText, getByRole } = render(
    <ToolTip title="foo" trigger="click">
      Click Me
    </ToolTip>
  );

  // Trigger event
  const toolTipBtn = getByText('Click Me');
  fireEvent.click(toolTipBtn);
  const toolTip = getByRole('tooltip');

  // Check if toolTip exists
  expect(toolTip).toBeTruthy();
  expect(findByText('foo')).toBeTruthy();
});
