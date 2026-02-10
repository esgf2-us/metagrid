import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import FacetsForm, {
  formatDate,
  generateFacetOptions,
  generateStacFacetOptions,
  humanizeFacetNames,
} from './FacetsForm';
import customRender from '../../test/custom-render';
import { AtomWrapper } from '../../test/testFunctions';
import { AppStateKeys } from '../../common/atoms';
import { activeSearchQueryFixture } from '../../test/mock/fixtures';

const user = userEvent.setup();

describe('Test humanizeFacetNames', () => {
  it('removes underscore and lowercases', () => {
    expect(humanizeFacetNames('camel_case')).toEqual('Camel Case');
  });

  it('does not change properly formatted text ', () => {
    expect(humanizeFacetNames('Proper Text')).toEqual('Proper Text');
  });

  it('converts acronyms to uppercase', () => {
    expect(humanizeFacetNames('facet_id')).toEqual('Facet ID');
  });
});

describe('formatDate', () => {
  it('standardizes date strings', () => {
    expect(formatDate('2024-12-18', true)).toEqual('20241218');
  });
});

describe('generate facet option helpers', () => {
  it('generateStacFacetOptions returns proper option objects', () => {
    const facet = 'stac_var';
    const opts = generateStacFacetOptions(facet, ['optA', 'optB']);
    expect(opts).toHaveLength(2);
    expect(opts[0].key).toBe('optA');
    expect(opts[0].value).toBe('optA');
    // label is a React element with data-testid
    // @ts-ignore access element props for test
    expect(opts[0].label.props['data-testid']).toBe('stac_var_optA');
  });

  it('generateFacetOptions returns proper option objects for tuple input', () => {
    const facet = 'data_node';
    const tupleOpts: [string, number][] = [
      ['node1.example', 3],
      ['node2.example', 5],
    ];
    const opts = generateFacetOptions(facet, tupleOpts);
    expect(opts).toHaveLength(2);
    expect(opts[0].key).toBe('node1.example');
    expect(opts[0].value).toBe('node1.example');
    // label is a React element with data-testid
    // @ts-ignore access element props for test
    expect(opts[0].label.props['data-testid']).toBe('data_node_node1.example');
  });
});

describe('test FacetsForm component', () => {
  // Filename search is currently disabled
  it.skip('handles submitting filename', async () => {
    customRender(<FacetsForm />);

    // Open filename collapse panel
    const filenameSearchPanel = await screen.findByRole('button', {
      name: 'collapsed Filename',
    });

    await user.click(filenameSearchPanel);

    // Change form field values
    const input: HTMLInputElement = await screen.findByTestId('filename-search-input');
    fireEvent.change(input, { target: { value: 'newVar' } });
    expect(input.value).toEqual('newVar');

    // Submit the form
    const submitBtn = await screen.findByRole('img', { name: 'search' });
    await user.click(submitBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));
  });

  // Filename search is currently disabled
  it.skip('handles case when filename var is already set in the active search query.', async () => {
    customRender(<FacetsForm />);

    // Open filename collapse panel
    const filenameSearchPanel = await screen.findByText('Filename');

    await user.click(filenameSearchPanel);

    // Change form field values
    const input: HTMLInputElement = await screen.findByTestId('filename-search-input');
    fireEvent.change(input, { target: { value: 'var' } });
    expect(input.value).toEqual('var');

    // Submit the form
    const submitBtn = await screen.findByRole('img', { name: 'search' });
    await user.click(submitBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));

    // Check that notice was given that variable was already applied
    expect(await screen.findByText('Input "var" has already been applied')).toBeTruthy();
  });

  it('handles submitting keyword search', async () => {
    customRender(<FacetsForm />);

    // Open filename collapse panel
    const keywordSearchPanel = await screen.findByText('Keyword Search');

    await user.click(keywordSearchPanel);

    // Change form field values
    const input: HTMLInputElement = await screen.findByTestId('keyword-search-input');
    fireEvent.change(input, { target: { value: 'clt' } });
    expect(input.value).toEqual('clt');

    // Submit the form
    const searchBtn = await screen.findByTestId('left-menu-keyword-search-submit');
    await user.click(searchBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));
  });

  it('handles case when keyword search is already set in the active search query.', async () => {
    customRender(<FacetsForm />);

    // Open filename collapse panel
    const keywordSearchPanel = await screen.findByText('Keyword Search');

    await user.click(keywordSearchPanel);

    // Change form field values
    const input: HTMLInputElement = await screen.findByTestId('keyword-search-input');
    fireEvent.change(input, { target: { value: 'clt' } });
    expect(input.value).toEqual('clt');

    // Submit the form
    const searchBtn = await screen.findByTestId('left-menu-keyword-search-submit');
    await user.click(searchBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));

    // Change form field values again to same value
    fireEvent.change(input, { target: { value: 'clt' } });
    expect(input.value).toEqual('clt');

    // Submit the form again
    await user.click(searchBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));

    // Check that notice was given that variable was already applied
    expect(await screen.findByText('Input "clt" has already been applied')).toBeTruthy();
  });

  it('handles setting the globusReady option on and off', async () => {
    customRender(<FacetsForm />);

    const globusReadyRadioOption = await screen.findByLabelText('Only Globus Transferrable');
    const anyRadioOption = await screen.findByLabelText('Any');
    expect(anyRadioOption).toBeTruthy();
    expect(globusReadyRadioOption).toBeTruthy();

    await user.click(anyRadioOption);

    expect(anyRadioOption).toBeChecked();
    expect(globusReadyRadioOption).not.toBeChecked();

    await user.click(globusReadyRadioOption);

    expect(anyRadioOption).not.toBeChecked();
    expect(globusReadyRadioOption).toBeChecked();

    await user.click(anyRadioOption);

    expect(anyRadioOption).toBeChecked();
    expect(globusReadyRadioOption).not.toBeChecked();
  });

  it('handles expand and collapse facet panels', async () => {
    customRender(<FacetsForm />);

    // Click the expand all button
    const expandAllBtn = await screen.findByText('Expand All');
    expect(expandAllBtn).toBeTruthy();

    await user.click(expandAllBtn);

    // Click the collapse all button
    const collapseAllBtn = await screen.findByText('Collapse All');
    expect(collapseAllBtn).toBeTruthy();

    await user.click(collapseAllBtn);
  });

  it('handles copying facet items to clipboard', async () => {
    customRender(<FacetsForm />);

    // Expand the group1 panel
    const group1Btn = await screen.findByText('Group1');
    expect(group1Btn).toBeTruthy();

    await user.click(group1Btn);

    // Click the copy facets button
    const copyBtn = await screen.findByRole('img', { name: 'copy' });
    expect(copyBtn).toBeTruthy();

    await user.click(copyBtn);

    // Check the clipboard has items
    const items = await navigator.clipboard.readText();
    expect(items).toEqual('aims3.llnl.gov (3)\nesgf1.dkrz.de (5)');

    // Expect result message to show
    const resultNotification = await screen.findByText('Data Nodes copied to clipboard!');
    expect(resultNotification).toBeTruthy();

    await user.click(resultNotification);
  });

  it('handles changing expand to collapse and vice-versa based on user actions', async () => {
    customRender(<FacetsForm />);

    // Expand the group1 panel
    const group1Btn = await screen.findByText('Group1');
    expect(group1Btn).toBeTruthy();

    await user.click(group1Btn);

    // Expand the group2 panel
    const group2Btn = await screen.findByText('Group2');
    expect(group2Btn).toBeTruthy();

    await user.click(group2Btn);

    // The collapse all button should now show since 2 panels are expanded
    const collapseAllBtn = await screen.findByText('Collapse All');
    expect(collapseAllBtn).toBeTruthy();

    // Collapse group 1 and 2 panels
    await user.click(group1Btn);
    await user.click(group2Btn);

    // The expand all button should show since all panels are collapsed
    const expandAllBtn = await screen.findByText('Expand All');
    expect(expandAllBtn).toBeTruthy();
  });

  it('Shows empty range if activeSearchQuery has no min and max version date range set', async () => {
    AtomWrapper.modifyAtomValue(
      AppStateKeys.activeSearchQuery,
      activeSearchQueryFixture({ minVersionDate: undefined, maxVersionDate: undefined }),
    );
    customRender(<FacetsForm />);

    // Open additional properties collapse panel
    const additionalPropertiesPanel = await screen.findByText('Additional Properties');

    await user.click(additionalPropertiesPanel);

    // Check date picker renders
    const datePickerComponent = await screen.findByTestId('version-range-datepicker');
    expect(datePickerComponent).toBeTruthy();

    // Check start and end date input values are empty
    const startDate = await within(datePickerComponent).findByPlaceholderText('Start date');
    expect(startDate).toHaveValue('');
    const endDate = await within(datePickerComponent).findByPlaceholderText('End date');
    expect(endDate).toHaveValue('');
  });

  it('handles date picker for versioning', async () => {
    customRender(<FacetsForm />);

    // Open additional properties collapse panel
    const additionalPropertiesPanel = await screen.findByText('Additional Properties');

    await user.click(additionalPropertiesPanel);

    // Check date picker renders
    const datePickerComponent = await screen.findByTestId('version-range-datepicker');
    expect(datePickerComponent).toBeTruthy();

    const datePickerComponentInput = datePickerComponent.querySelectorAll('input')[0];

    fireEvent.mouseDown(datePickerComponentInput);

    // Set date as input value
    fireEvent.change(datePickerComponentInput, {
      target: { value: '2020-01-15' },
    });

    // Open calendar, select the set value, and click it
    await user.click(document.querySelector('.ant-picker-cell-selected') as HTMLInputElement);

    const startDate = await within(datePickerComponent).findByPlaceholderText('Start date');
    expect(startDate).toHaveValue('2020-01-15');

    await screen.findByTestId('facets-form');
  });
});
