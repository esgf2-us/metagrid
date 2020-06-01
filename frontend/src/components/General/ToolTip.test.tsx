import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import ToolTip from './ToolTip';

it('renders the component', () => {
  const { getByText, findByText, getByRole, rerender } = render(
    <ToolTip title="foo" trigger="click">
      <p>Click Me</p>
    </ToolTip>
  );

  // Trigger event
  const toolTipBtn = getByText('Click Me');
  fireEvent.click(toolTipBtn);

  // Check if tool tip exists and content is displayed
  const toolTip = getByRole('tooltip');
  expect(toolTip).toBeTruthy();
  expect(findByText('foo')).toBeTruthy();

  // Re-render component without trigger prop
  rerender(
    <ToolTip title="foo">
      <p>Click Me</p>
    </ToolTip>
  );

  // Hover over button
  fireEvent.mouseOver(toolTipBtn);

  // Check if tool tip exists and content is displayed
  expect(toolTip).toBeTruthy();
});
