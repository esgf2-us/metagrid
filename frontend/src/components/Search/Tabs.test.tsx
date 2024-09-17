import React from 'react';
import { screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import Tabs from './Tabs';
import { rawSearchResultFixture } from '../../test/mock/fixtures';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Tab component', () => {
  it('renders standard tab component', async () => {
    customRender(
      <Tabs filenameVars={undefined} record={rawSearchResultFixture()} />
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
  });
  it('renders tab component with quality_control_flags in record', async () => {
    customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          quality_control_flags: [':test_key:test_color', ':test_key2:red'],
        }}
      />
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
  });
  it('renders tab component with further_info_url in record', async () => {
    customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          further_info_url: ['further_info'],
        }}
      />
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
  });
  it('renders tab component with retracted = true in record', async () => {
    customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          retracted: true,
        }}
      />
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
  });
});
