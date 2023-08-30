import React from 'react';
import { customRender } from '../../test/custom-render';
import DatasetDownloadForm from './DatasetDownload';
import { loadSessionValue } from '../../api';

jest.mock('../../api');

const mockLoadSessionValue = loadSessionValue as jest.MockedFunction<
  typeof loadSessionValue
>;

describe('tests should go here', () => {
  it('Does nothing', () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();

    mockLoadSessionValue.mockResolvedValue(true);
  });
});
