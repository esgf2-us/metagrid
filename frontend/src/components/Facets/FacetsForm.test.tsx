import { act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
} from '../../api/mock/fixtures';
import FacetsForm, { humanizeFacetNames, Props } from './FacetsForm';
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
    const { getByRole, getByTestId } = customRender(
      <FacetsForm {...defaultProps} />
    );

    // Open filename collapse panel
    const filenameSearchPanel = getByRole('button', {
      name: 'right Filename',
    });

    await act(async () => {
      await user.click(filenameSearchPanel);
    });

    // Change form field values
    const input = getByTestId('filename-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'var' } });
    expect(input.value).toEqual('var');

    // Submit the form
    const submitBtn = getByRole('img', { name: 'search' });
    fireEvent.submit(submitBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));
  });

  it('handles setting the globusReady option on and off', () => {
    const { getByLabelText } = customRender(<FacetsForm {...defaultProps} />);

    const globusReadyRadioOption = getByLabelText('Only Globus Transferrable');
    const anyRadioOption = getByLabelText('Any');
    expect(anyRadioOption).toBeTruthy();
    expect(globusReadyRadioOption).toBeTruthy();

    fireEvent.click(anyRadioOption);

    expect(anyRadioOption).toBeChecked();
    expect(globusReadyRadioOption).not.toBeChecked();

    fireEvent.click(globusReadyRadioOption);

    expect(anyRadioOption).not.toBeChecked();
    expect(globusReadyRadioOption).toBeChecked();

    fireEvent.click(anyRadioOption);

    expect(anyRadioOption).toBeChecked();
    expect(globusReadyRadioOption).not.toBeChecked();
  });

  it('handles expand and collapse facet panels', async () => {
    const { getByText } = customRender(<FacetsForm {...defaultProps} />);

    // Click the expand all button
    const expandAllBtn = getByText('Expand All');
    expect(expandAllBtn).toBeTruthy();

    await act(async () => {
      await user.click(expandAllBtn);
    });

    // Click the collaps all button
    const collapseAllBtn = getByText('Collapse All');
    expect(collapseAllBtn).toBeTruthy();

    await act(async () => {
      await user.click(collapseAllBtn);
    });
  });

  it('handles copying facet items to clip board', async () => {
    const { getByText, getByRole } = customRender(
      <FacetsForm {...defaultProps} />
    );

    // Expand the group1 panel
    const group1Btn = getByText('Group1');
    expect(group1Btn).toBeTruthy();

    await act(async () => {
      await user.click(group1Btn);
    });

    // Click the copy facets button
    const copyBtn = getByRole('img', { name: 'copy' });
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      await user.click(copyBtn);
    });

    // Check the clipboard has items
    const items = await navigator.clipboard.readText();
    expect(items).toEqual('aims3.llnl.gov (3)\nesgf1.dkrz.de (5)');

    // Expect result message to show
    const resultNotification = getByText('Data Nodes copied to clipboard!');
    expect(resultNotification).toBeTruthy();

    await act(async () => {
      await user.click(resultNotification);
    });
  });

  it('handles changing expand to collapse and vice-versa base on user actions', async () => {
    const { getByText } = customRender(<FacetsForm {...defaultProps} />);

    // Expand the group1 panel
    const group1Btn = getByText('Group1');
    expect(group1Btn).toBeTruthy();

    await act(async () => {
      await user.click(group1Btn);
    });

    // Expand the group2 panel
    const group2Btn = getByText('Group2');
    expect(group2Btn).toBeTruthy();

    await act(async () => {
      await user.click(group2Btn);
    });

    // The collapse all button should now show since 2 panels are expanded
    const collapseAllBtn = getByText('Collapse All');
    expect(collapseAllBtn).toBeTruthy();

    // Collapse group 1 and 2 panels
    await act(async () => {
      await user.click(group1Btn);
    });
    await act(async () => {
      await user.click(group2Btn);
    });

    // The expand all button should show since all panels are collapsed
    const expandAllBtn = getByText('Expand All');
    expect(expandAllBtn).toBeTruthy();
  });

  it('handles date picker for versioning', async () => {
    const { getByTestId, getByRole } = customRender(
      <FacetsForm {...defaultProps} />
    );

    // Open additional properties collapse panel
    const additionalPropertiesPanel = getByRole('button', {
      name: 'right Additional Properties',
    });

    await act(async () => {
      await user.click(additionalPropertiesPanel);
    });

    // Check date picker renders
    const datePickerComponent = getByTestId('version-range-datepicker');
    expect(datePickerComponent).toBeTruthy();

    const datePickerComponentInput = datePickerComponent.querySelectorAll(
      'input'
    )[0];

    // Open calendar and focus on input
    fireEvent.mouseDown(datePickerComponentInput);

    // Set date as input value
    fireEvent.change(datePickerComponentInput, {
      target: { value: '2020-01-15' },
    });

    // Open calendar, select the set value, and click it
    await act(async () => {
      await user.click(
        document.querySelector('.ant-picker-cell-selected') as HTMLInputElement
      );
    });

    await waitFor(() => getByTestId('facets-form'));
  });
});
