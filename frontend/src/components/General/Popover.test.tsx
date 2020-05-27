import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Popover from './Popover';

it('returns component with required content', () => {
  const { getByText, getByRole, findByText } = render(
    <Popover content={<p>foobar</p>} trigger="click">
      Click Me
    </Popover>
  );

  // Trigger event
  const popOverBtn = getByText('Click Me');
  fireEvent.click(popOverBtn);

  // Check if popOver exists
  const popOver = getByRole('tooltip');
  expect(popOver).toBeTruthy();
  expect(findByText('foobar')).toBeTruthy();
});
