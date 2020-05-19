import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Popover from './Popover';

it('returns component with required content', () => {
  const { getByText, findByText } = render(
    <Popover content={<p>foobar</p>} trigger="click">
      Click Me
    </Popover>
  );
  const popOverBtn = getByText('Click Me');
  fireEvent.click(popOverBtn);

  expect(findByText('foobar')).toBeTruthy();
});
