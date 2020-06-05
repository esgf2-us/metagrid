import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Tag from './Tag';

it('renders component with and without onClose prop', () => {
  // eslint-disable-next-line no-console
  const { getByRole, rerender } = render(
    <Tag value="foo" type="bar" onClose={jest.fn()}>
      tag
    </Tag>
  );

  const closeBtn = getByRole('img', { name: 'close' });
  fireEvent.click(closeBtn);

  // Re-render the component without onClose prop
  rerender(
    <Tag value="foo" type="bar">
      tag
    </Tag>
  );
  fireEvent.click(closeBtn);
});
