import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from '@testing-library/react';
import { Tag } from './Tag';
import customRender from '../../test/custom-render';

const user = userEvent.setup();

it('renders component with and without onClose prop', async () => {
  const { getByRole, rerender } = customRender(
    <Tag value="foo" type="filenameVar" onClose={jest.fn()}>
      tag
    </Tag>
  );

  const closeBtn = getByRole('img', { name: 'close' });

  await act(async () => {
    await user.click(closeBtn);
  });

  // Re-render the component without onClose prop
  rerender(
    <Tag value="foo" type="filenameVar">
      tag
    </Tag>
  );
  await act(async () => {
    await user.click(closeBtn);
  });
});
