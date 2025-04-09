import { screen } from '@testing-library/react';
import React from 'react';
import Modal from './Modal';
import customRender from '../../test/custom-render';

it('renders the component', async () => {
  customRender(
    <Modal onClose={jest.fn} open closeText="Close Text">
      <p>Test text</p>
    </Modal>
  );
  // Check component renders
  const text = await screen.findByText('Test text');
  expect(text).toBeTruthy();
});
