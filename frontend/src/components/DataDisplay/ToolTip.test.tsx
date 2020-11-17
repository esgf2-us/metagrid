import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import ToolTip from './ToolTip';

it('renders the component', async () => {
  const { getByText, getByRole, rerender } = render(
    <ToolTip title="foo" trigger="click">
      <p>Click Me</p>
    </ToolTip>
  );

  // Trigger event
  const toolTipBtn = getByText('Click Me');
  fireEvent.click(toolTipBtn);

  // Check if tool tip exists and content is displayed
  const toolTip = await waitFor(() => getByRole('tooltip'));
  expect(toolTip).toBeTruthy();

  // Re-render component without trigger prop
  rerender(
    <ToolTip title="foo">
      <p>Click Me</p>
    </ToolTip>
  );

  // Hover over button
  fireEvent.mouseOver(toolTipBtn);
  await waitFor(() => toolTipBtn);

  // Check if tool tip exists and content is displayed
  expect(toolTip).toBeTruthy();
});
