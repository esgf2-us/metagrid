import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Button from './Button';

it('renders a button with only type prop required', () => {
  const { getByTestId } = render(<Button type="primary"></Button>);
  expect(getByTestId('button')).toBeTruthy();
});

it('returns string "clicked" onClick', () => {
  const consoleSpy = jest.spyOn(console, 'log');
  // eslint-disable-next-line no-console
  const onClick = () => console.log('clicked');

  const { getByTestId } = render(
    <Button type="primary" onClick={onClick}></Button>
  );
  const button = getByTestId('button');
  fireEvent.click(button);
  expect(consoleSpy).toHaveBeenCalledWith('clicked');
});
