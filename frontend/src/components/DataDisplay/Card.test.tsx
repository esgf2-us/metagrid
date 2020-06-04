import React from 'react';
import { render } from '@testing-library/react';

import Card from './Card';

it('returns component with required content', () => {
  const children = 'Click Me';
  const { getByText } = render(
    <Card title="title">
      <p>{children}</p>
    </Card>
  );

  const content = getByText(children);
  expect(content).toBeTruthy();
});
