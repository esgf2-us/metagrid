import { fireEvent, render, waitFor, within } from '@testing-library/react';
import React from 'react';
import { rawSearchResultsFixture } from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import Table, { Props } from './Table';

const defaultProps: Props = {
  loading: false,
  results: rawSearchResultsFixture(),
  totalResults: rawSearchResultsFixture().length,
  userCart: [],
  onUpdateCart: jest.fn(),
  onRowSelect: jest.fn(),
  onPageChange: jest.fn(),
  onPageSizeChange: jest.fn(),
};

it('renders component', () => {
  const { getByRole } = render(<Table {...defaultProps} />);

  // Check table exists
  const table = getByRole('table');
  expect(table).toBeTruthy();
});

it('renders component without results', () => {
  const { getByText } = render(
    <Table {...defaultProps} results={[]} totalResults={undefined} />
  );

  const noDataText = getByText('No Data');
  expect(noDataText).toBeTruthy();
});

it('renders record metadata in an expandable panel', async () => {
  const { getByRole, getByText } = render(<Table {...defaultProps} />);

  // Check table exists
  const table = getByRole('table');
  expect(table).toBeTruthy();

  // Check a record row exist
  const row = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes question-circle aims3.llnl.gov 1 wget download plus',
  });
  expect(row).toBeTruthy();

  // Get the expandable cell
  const expandableCell = within(row).getByRole('cell', {
    name: 'right-circle',
  });
  expect(expandableCell).toBeTruthy();

  // Get the right circle icon within the cell and click to expand the row
  const expandableIcon = within(expandableCell).getByRole('img', {
    name: 'right-circle',
  });
  expect(expandableIcon).toBeTruthy();
  fireEvent.click(expandableIcon);

  // Get the expandable row that was rendered and click on it
  const expandableRow = document.querySelector(
    'tr.ant-table-expanded-row.ant-table-expanded-row-level-1'
  ) as HTMLElement;
  expect(expandableRow).toBeTruthy();

  // Get the meta data panel and click on it
  const panel = within(expandableRow).getByRole('button', {
    name: 'right Metadata',
  });
  expect(panel).toBeTruthy();
  fireEvent.click(panel);

  // Check metadata panel contains metadata
  const id = getByText((_, node) => node.textContent === 'id: foo');
  expect(id).toBeInTheDocument();

  // Open up the Autocomplete form and change the input to look up 'i'
  const form = within(expandableRow).getByRole('combobox');
  expect(form).toBeTruthy();
  fireEvent.change(form, { target: { value: 'i' } });

  // Get the down circle icon within the cell and click to close the expandable row
  const expandableDownIcon = within(expandableCell).getByRole('img', {
    name: 'down-circle',
  });
  expect(expandableDownIcon).toBeTruthy();
  fireEvent.click(expandableDownIcon);

  await waitFor(() => row);
});

it('renders "PID" button when the record has a "xlink" key/value, vice versa', () => {
  const results = [...defaultProps.results];
  results[0] = {
    ...results[0],
    xlink: ['https://foo.bar|', 'https://foo.bar|'],
    further_info_url: ['https://foo.bar'],
  };

  const { getByRole } = render(<Table {...defaultProps} results={results} />);

  // Check table exists
  const table = getByRole('table');
  expect(table).toBeTruthy();

  // Check first row exists
  const firstRow = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes question-circle aims3.llnl.gov 1 wget download PID More Info plus',
  });
  expect(firstRow).toBeTruthy();

  // Check both PID and More Info buttons rendered for the first row
  const firstPidBtn = within(firstRow).getByText('PID');
  const firstInfoBtn = within(firstRow).getByText('More Info');
  expect(firstPidBtn).toBeTruthy();
  expect(firstInfoBtn).toBeTruthy();

  // Check second row exists
  const secondRow = getByRole('row', {
    name:
      'right-circle bar 2 1 Bytes question-circle esgf1.dkrz.de 1 wget download plus',
  });
  expect(secondRow).toBeTruthy();

  // Check both PID and More Info buttons did not render for the second row
  const qPidBtn = within(secondRow).queryByText('PID');
  expect(qPidBtn).toBeNull();
  const qInfoBtn = within(secondRow).queryByText('More Info');
  expect(qInfoBtn).toBeNull();
});

it('renders add or remove button for items in or not in the cart respectively, and handles clicking them', () => {
  const { getByRole } = render(
    <Table {...defaultProps} userCart={[defaultProps.results[0]]} />
  );

  // Check table exists
  const table = getByRole('table');
  expect(table).toBeTruthy();

  // Check first row exists
  const firstRow = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes question-circle aims3.llnl.gov 1 wget download minus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row has remove button and click it
  const removeBtn = within(firstRow).getByRole('img', { name: 'minus' });
  expect(removeBtn).toBeTruthy();
  fireEvent.click(removeBtn);

  // Check second row exists
  const secondRow = getByRole('row', {
    name:
      'right-circle bar 2 1 Bytes question-circle esgf1.dkrz.de 1 wget download plus',
  });
  expect(secondRow).toBeTruthy();

  // Check second row has add button and click it
  const addBtn = within(secondRow).getByRole('img', { name: 'plus' });
  expect(addBtn).toBeTruthy();
  fireEvent.click(addBtn);
});

it('handles when clicking the select checkbox for a row', () => {
  const { getByRole } = render(<Table {...defaultProps} />);

  // Check table exists
  const table = getByRole('table');
  expect(table).toBeTruthy();

  // Check a record row exist
  const row = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes question-circle aims3.llnl.gov 1 wget download plus',
  });
  expect(row).toBeTruthy();

  const checkBox = within(row).getByRole('checkbox');
  expect(checkBox).toBeTruthy();
  fireEvent.click(checkBox);
});

it('handles when clicking the select all checkbox in the table"s header', () => {
  const { getByRole } = render(<Table {...defaultProps} />);

  // Check table exists
  const table = getByRole('table');
  expect(table).toBeTruthy();

  // Check the select all checkbox exists and click it
  // Note: Cannot query by aria-role or data-testid because Ant Design API
  //   renders the column and there are checkboxes for each row (no uniqueness)
  const selectAllCheckbox = document.querySelector(
    'th.ant-table-cell.ant-table-selection-column [type="checkbox"]'
  ) as HTMLInputElement;
  expect(selectAllCheckbox).toBeTruthy();
  fireEvent.click(selectAllCheckbox);
});

it('handles downloading an item via wget', async () => {
  // Mock window.location.href
  Object.defineProperty(window, 'location', {
    value: {
      href: jest.fn(),
    },
  });

  const { getByRole } = render(
    <Table {...defaultProps} userCart={[defaultProps.results[0]]} />
  );

  // Check table renders
  const tableComponent = getByRole('table');
  expect(tableComponent).toBeTruthy();

  // Check first row renders
  const firstRow = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes question-circle aims3.llnl.gov 1 wget download minus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row download button renders and submit the form
  const firstRowBtn = within(firstRow).getByRole('img', { name: 'download' });
  expect(firstRowBtn).toBeTruthy();
  fireEvent.submit(firstRowBtn);

  // Wait component to re-render
  await waitFor(() => getByRole('table'));
});
it('displays an error when unable to access download via wget', async () => {
  server.use(
    rest.get(apiRoutes.wget, (_req, res, ctx) => {
      return res(ctx.status(404));
    })
  );

  const { getByRole, getByText } = render(
    <Table {...defaultProps} userCart={[defaultProps.results[0]]} />
  );

  // Check table renders
  const tableComponent = getByRole('table');
  expect(tableComponent).toBeTruthy();

  // Check first row renders
  const firstRow = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes question-circle aims3.llnl.gov 1 wget download minus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row download button renders and submit the form
  const firstRowBtn = within(firstRow).getByRole('img', { name: 'download' });
  expect(firstRowBtn).toBeTruthy();
  fireEvent.submit(firstRowBtn);

  // Wait component to re-render
  await waitFor(() => getByRole('table'));

  // Check error message renders
  const errorMsg = await waitFor(() =>
    getByText(
      'There was an issue generating the wget script. Please contact support or try again later.'
    )
  );
  expect(errorMsg).toBeTruthy();
});
