import userEvent from '@testing-library/user-event';
import React from 'react';
import { act, screen } from '@testing-library/react';
import { Tag } from './Tag';
import customRender from '../../test/custom-render';

const user = userEvent.setup();

it('renders component with onClose prop', async () => {
  customRender(
    <Tag value="foo" type="filenameVar" onClose={jest.fn()}>
      tag
    </Tag>
  );

  const closeBtn = await screen.findByRole('img', { name: 'close' });

  await user.click(closeBtn);
});

it('renders component without onClose prop', async () => {
  // Re-render the component without onClose prop
  customRender(
    <Tag value="foo" type="filenameVar">
      tag
    </Tag>
  );

  const closeBtn = await screen.findByRole('img', { name: 'close' });

  await user.click(closeBtn);
});
