import React from 'react';
import { screen } from '@testing-library/react';
import MessageCard from './MessageCard';
import customRender from '../../test/custom-render';
import { http, server } from '../../test/mock/server';
import { HttpResponse } from 'msw';

it('renders message component with default markdown when file is wrong.', async () => {
  server.use(
    http.get('badFile.md', () => {
      return new HttpResponse(null, { status: 404 });
    })
  );
  const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

  customRender(<MessageCard fileName="badFile.md" />);

  // Check component renders
  const text = await screen.findByText('Content is empty.');
  expect(text).toBeTruthy();

  // Ensure http error was logged
  expect(consoleErrorMock).toHaveBeenCalled();

  consoleErrorMock.mockRestore();
});
