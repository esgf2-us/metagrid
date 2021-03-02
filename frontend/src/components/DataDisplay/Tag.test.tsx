import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { Tag } from './Tag';

it('renders component with and without onClose prop', () => {
  const { getByRole, rerender } = render(
    <Tag value="foo" type="filenameVar" onClose={jest.fn()}>
      tag
    </Tag>
  );

  const closeBtn = getByRole('img', { name: 'close' });
  fireEvent.click(closeBtn);

  // Re-render the component without onClose prop
  rerender(
    <Tag value="foo" type="filenameVar">
      tag
    </Tag>
  );
  fireEvent.click(closeBtn);
});
