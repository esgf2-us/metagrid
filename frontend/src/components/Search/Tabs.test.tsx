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
  it('shows Additional tab when further_info_url has valid URL', async () => {
    customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          // Set these to empty arrays to isolate the test to only further_info_url
          xlink: [],
          citation_url: [],
          quality_control_flags: [],
          links: [],
          further_info_url: ['https://example.com/valid-url'],
        }}
      />,
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
    // Additional tab should be present since further_info_url has a valid URL
    const additionalTab = screen.queryByText('Additional');
    expect(additionalTab).not.toBeNull();
  });
  it('does not show Additional tab when further_info_url is "undefined"', async () => {
    customRender(
      <Tabs
        filenameVars={undefined}
        record={{
          ...rawSearchResultFixture(),
          // Set these to empty arrays/undefined to isolate the test to only further_info_url
          xlink: [],
          citation_url: [],
          quality_control_flags: [],
          links: [],
          further_info_url: ['undefined'],
        }}
      />,
    );

    const tabList = await screen.findByRole('tablist');
    expect(tabList).toBeTruthy();
    // Additional tab should not be present since further_info_url is "undefined"
    // and there are no other sources for Additional tab content
    const additionalTab = screen.queryByText('Additional');
    expect(additionalTab).toBeNull();
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

    // Find the h4 containing "Displaying" text
    let displayingText = (await screen.findAllByRole('heading', { level: 4 })).find((el) =>
      el.textContent?.includes('Displaying'),
    )!;

    // Check initial state shows some keys (buildDisplayData may filter out some keys)
    expect(displayingText.textContent).toMatch(/Displaying\s+\d+\s+keys/);

    // Type a filter to change displayed items
    const input = (await screen.findByText('Lookup a key...')).parentNode?.querySelector(
      'input',
    ) as HTMLElement;
    await user.type(input, 'myArray');
    const afterText = await screen.findByText('myArray');

    // After filtering, the count should be 1 (only myArray matches)
    displayingText = (await screen.findAllByRole('heading', { level: 4 })).find((el) =>
      el.textContent?.includes('Displaying'),
    )!;
    expect(displayingText.textContent).toContain('Displaying 1 keys');
    expect(afterText).toHaveTextContent('myArray');

    // Clear the input (simulate value = '')
    await user.clear(input);

    // After clearing, we should see the full metadata header again (not the filtered count)
    const afterClearText = (await screen.findAllByRole('heading', { level: 4 })).find((el) =>
      el.textContent?.includes('Displaying'),
    )!;
    expect(afterClearText.textContent).toMatch(/Displaying\s+\d{2,}\s+keys/); // Should be back to full count (10+)
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

    // Find the h4 containing "Displaying" text and check initial state
    let displayingText = (await screen.findAllByRole('heading', { level: 4 })).find((el) =>
      el.textContent?.includes('Displaying'),
    )!;
    expect(displayingText.textContent).toMatch(/Displaying\s+\d+\s+keys/);

    const input = (await screen.findByText('Lookup a key...')).parentNode?.querySelector(
      'input',
    ) as HTMLElement;

    // Type a substring matching the nested sub-key (e.g. 'subKey')
    await user.type(input, 'subKey');

    const afterText = await screen.findByRole('option', { name: 'myArray-13-0-subKey' });

    // Expect the nested metadata title and value to appear in the autocomplete
    expect(afterText).toBeTruthy();
  });
});
