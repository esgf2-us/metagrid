import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
} from '../../test/mock/fixtures';
import FacetsForm, { formatDate, humanizeFacetNames, Props } from './FacetsForm';
import customRender from '../../test/custom-render';

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

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  availableFacets: parsedFacetsFixture(),
  nodeStatus: parsedNodeStatusFixture(),
  onSetFilenameVars: jest.fn(),
  onSetGeneralFacets: jest.fn(),
  onSetActiveFacets: jest.fn(),
};

describe('test FacetsForm component', () => {
  it('handles submitting filename', async () => {
    customRender(<FacetsForm {...defaultProps} />);

    // Open filename collapse panel
    const filenameSearchPanel = await screen.findByRole('button', {
      name: 'collapsed Filename',
    });

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
  });

  it('handles setting the globusReady option on and off', async () => {
    customRender(<FacetsForm {...defaultProps} />);

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
    customRender(<FacetsForm {...defaultProps} />);

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
    customRender(<FacetsForm {...defaultProps} />);

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
    customRender(<FacetsForm {...defaultProps} />);

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

  it('handles date picker for versioning', async () => {
    customRender(<FacetsForm {...defaultProps} />);

    // Open additional properties collapse panel
    const additionalPropertiesPanel = await screen.findByRole('button', {
      name: 'expanded Additional Properties',
    });

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

    await screen.findByTestId('facets-form');
  });
});
