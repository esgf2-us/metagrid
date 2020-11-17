import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import Popover from './Popover';

it('returns component with required content', async () => {
  const children = 'Click Me';
  const { getByText, getByRole, findByText, rerender } = render(
    <Popover content={<p>foobar</p>} trigger="click">
      <p>{children}</p>
    </Popover>
  );

  // Trigger event
  const popOverBtn = getByText('Click Me');
  fireEvent.click(popOverBtn);

  // Check popover exists and content is displayed
  const popOver = await waitFor(() => getByRole('tooltip'));
  expect(popOver).toBeTruthy();

  const content = await waitFor(() => findByText('foobar'));
  expect(content).toBeTruthy();

  // Re-render component without trigger prop
  rerender(
    <Popover content={<p>foobar</p>}>
      <p>{children}</p>
    </Popover>
  );

  // Check if tool tip exists and content is displayed
  fireEvent.mouseOver(popOverBtn);
  expect(popOver).toBeTruthy();
});
