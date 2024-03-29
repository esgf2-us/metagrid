import React from 'react';
import customRender from '../../test/custom-render';
import Tabs from './Tabs';
import { rawSearchResultFixture } from '../../api/mock/fixtures';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Tab component', () => {
  it('renders standard tab component', () => {
    const { getByRole } = customRender(
      <Tabs filenameVars={undefined} record={rawSearchResultFixture()} />
    );

    const tabList = getByRole('tablist');
    expect(tabList).toBeTruthy();
  });
  it('renders tab component with quality_control_flags in record', () => {
    const { getByRole } = customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          quality_control_flags: [':test_key:test_color', ':test_key2:red'],
        }}
      />
    );

    const tabList = getByRole('tablist');
    expect(tabList).toBeTruthy();
  });
  it('renders tab component with further_info_url in record', () => {
    const { getByRole } = customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          further_info_url: ['further_info'],
        }}
      />
    );

    const tabList = getByRole('tablist');
    expect(tabList).toBeTruthy();
  });
  it('renders tab component with retracted = true in record', () => {
    const { getByRole } = customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          retracted: true,
        }}
      />
    );

    const tabList = getByRole('tablist');
    expect(tabList).toBeTruthy();
  });
});
