import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs from './Tabs';
import customRender from '../../test/custom-render';
import { rawSearchResultFixture } from '../../test/mock/fixtures';

const user = userEvent.setup();

describe('test Tab component', () => {
  it('renders standard tab component', async () => {
    customRender(<Tabs filenameVars={undefined} record={rawSearchResultFixture()} />);

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
      />,
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
      />,
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
      />,
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
  });
});

describe('Tabs metadata autocomplete filtering', () => {
  it('resets displayed metadata when autocomplete value is cleared (value = "")', async () => {
    const record = {
      ...rawSearchResultFixture({
        id: 'test-id',
        title: 'test-title',
        // mark retracted so Files tab is disabled (prevents FilesTable network calls)
        retracted: true,
        // add a nested array to produce sub-keys in metadata
        myArray: [{ subKey: 'subValue' }],
      }),
    } as unknown as any;

    customRender(<Tabs record={record} filenameVars={[]} />);

    // Wait for initial metadata header to appear (full display)
    const expectedHeader = `Displaying ${Object.keys(record).length} keys`;
    const beforeText = await screen.findByText(expectedHeader);

    // Type a filter to change displayed items
    const input = (await screen.findByText('Lookup a key...')).parentNode?.querySelector(
      'input',
    ) as HTMLElement;
    await user.type(input, 'myArray');
    const afterText = await screen.findByText('myArray');

    // Ensure the filtered state is active (header no longer the full count)
    expect(beforeText).toHaveTextContent('Displaying 14 keys');
    expect(afterText).toHaveTextContent('myArray');

    // Clear the input (simulate value = '')
    await user.clear(input);

    // After clearing, we should see the full metadata header again
    expect(await screen.findByText(expectedHeader)).toBeTruthy();
  });

  it('shows nested sub-metadata when filter matches a nested sub-key', async () => {
    const record = {
      ...rawSearchResultFixture({
        id: 'test-id-2',
        title: 'test-title-2',
        retracted: true,
        myArray: [{ subKey: 'subValue' }],
      }),
    } as unknown as any;

    customRender(<Tabs record={record} filenameVars={[]} />);

    // Wait for initial metadata header to appear (full display)
    const expectedHeader = `Displaying ${Object.keys(record).length} keys`;

    // Type a filter to change displayed items
    const beforeText = await screen.findByText(expectedHeader);
    const input = (await screen.findByText('Lookup a key...')).parentNode?.querySelector(
      'input',
    ) as HTMLElement;

    // Type a substring matching the nested sub-key (e.g. 'subKey')
    await user.type(input, 'subKey');

    const afterText = await screen.findByRole('option', { name: 'myArray-13-0-subKey' });

    // Expect the nested metadata title and value to appear
    expect(beforeText).toHaveTextContent('Displaying 14 keys');
    expect(afterText).toBeTruthy();
  });
});
