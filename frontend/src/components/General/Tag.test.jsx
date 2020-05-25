import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Tag from './Tag';

it('logs the value and type of the tag with onClose()', (done) => {
  // eslint-disable-next-line no-console
  const onClose = () => done();
  const { getByRole } = render(
    <Tag value="foo" type="bar" onClose={onClose}>
      tag
    </Tag>
  );

  const closeBtn = getByRole('img', { name: 'close' });
  fireEvent.click(closeBtn);
});
