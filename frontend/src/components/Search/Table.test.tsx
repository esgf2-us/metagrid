import { screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { rawSearchResultFixture, rawSearchResultsFixture } from '../../test/mock/fixtures';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import Table, { Props } from './Table';
import { QualityFlag } from './Tabs';
import { AtomWrapper, mockConfig } from '../../test/jestTestFunctions';
import { AppStateKeys } from '../../common/atoms';

const user = userEvent.setup();

// per-test timeouts only for slow tests below

const defaultProps: Props = {
  loading: false,
  results: rawSearchResultsFixture(),
  totalResults: rawSearchResultsFixture().length,
  onUpdateCart: vi.fn(),
  onRowSelect: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('test main table UI', () => {
  // Global timeout configured in vitest.config.ts
  // helper for long tests
  const it120 = (name: string, fn: any) => it(name, fn, 120000);
  it('renders component', async () => {
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();
  });

  it('renders component when globus nodes is empty', async () => {
    mockConfig.GLOBUS_NODES = [];
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();
  });

  it('renders component without results', async () => {
    customRender(<Table {...defaultProps} results={[]} />);
    const row = (await screen.findAllByRole('row'))[1];
    expect(row).toHaveClass('ant-table-placeholder');
  });

  it('renders component without node status (showing only the node value with database icon)', async () => {
    mockConfig.STATUS_URL = null;
    customRender(<Table {...defaultProps} />);
    const databaseIcon = (
      await screen.findAllByRole('img', {
        name: 'database',
      })
    )[0];
    expect(databaseIcon).toBeTruthy();
  }, 120000);

  it('renders not available for total size and number of files columns when dataset doesn"t have those attributes', async () => {
    customRender(
      <Table
        {...defaultProps}
        results={[
          rawSearchResultFixture({
            size: undefined,
            number_of_files: undefined,
          }),
        ]}
      />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check a record row exist
    const row = await screen.findByTestId('cart-items-row-0');
    expect(row).toBeTruthy();
  });

  it('renders warning that dataset is retracted', async () => {
    customRender(
      <Table {...defaultProps} results={[rawSearchResultFixture({ retracted: true })]} />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check the dataset title include retracted warning (use flexible matcher)
    const cells = await within(table).findAllByText((_, node) =>
      Boolean(node?.textContent && node.textContent.includes('foo') && node.textContent.includes('IMPORTANT!')),
    );
    expect(cells.length).toBeGreaterThan(0);

    // Get the expandable cell
    const expandableCell = await within(table).findByRole('cell', {
      name: 'right-circle',
    });
    expect(expandableCell).toBeTruthy();

    // Get the right circle icon within the cell and click to expand the row
    const expandableIcon = await within(expandableCell).findByRole('img', {
      name: 'right-circle',
    });
    expect(expandableIcon).toBeTruthy();
    await user.click(expandableIcon);

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1',
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();
  });

  it120('renders record metadata in an expandable panel', async () => {
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check a record row exist
    const row = await screen.findByTestId('cart-items-row-0');
    expect(row).toBeTruthy();

    // Get the expandable cell
    const expandableCell = await within(row).findByRole('cell', {
      name: 'right-circle',
    });
    expect(expandableCell).toBeTruthy();

    // Get the right circle icon within the cell and click to expand the row
    const expandableIcon = await within(expandableCell).findByRole('img', {
      name: 'right-circle',
    });
    expect(expandableIcon).toBeTruthy();
    await user.click(expandableIcon);

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1',
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();

    // Get the meta data panel and click on it
    const panel = await within(expandableRow).findByText('Metadata');
    expect(panel).toBeTruthy();

    await user.click(panel);

    // Check metadata panel contains metadata
    const id = await screen.findByText((_, node) => node?.textContent === 'id: foo');
    expect(id).toBeInTheDocument();

    // Open up the Autocomplete form and change the input to look up 'i'
    const form = await within(expandableRow).findByRole('combobox');
    expect(form).toBeTruthy();

    await user.type(form, 'i');

    // Get the down circle icon within the cell and click to close the expandable row
    const expandableDownIcon = await within(expandableCell).findByRole('img', {
      name: 'down-circle',
    });
    expect(expandableDownIcon).toBeTruthy();

    await user.click(expandableDownIcon);
  });

  it('renders "PID" button when the record has a "xlink" key/value, vice versa', async () => {
    const results = [...defaultProps.results];
    results[0] = {
      ...results[0],
      xlink: ['https://foo.bar|PID|pid', 'https://foo.bar|'],
      further_info_url: ['https://foo.bar'],
    };

    customRender(<Table {...defaultProps} results={results} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check first row exists
    const firstRow = await screen.findByTestId('cart-items-row-0');
    expect(firstRow).toBeTruthy();

    // Get the expandable cell
    const expandableCell = await within(firstRow).findByRole('cell', {
      name: 'right-circle',
    });
    expect(expandableCell).toBeTruthy();

    // Get the right circle icon within the cell and click to expand the row
    const expandableIcon = await within(expandableCell).findByRole('img', {
      name: 'right-circle',
    });
    expect(expandableIcon).toBeTruthy();

    await user.click(expandableIcon);

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1',
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();

    // Get the Additional panel and click on it
    const panel = await within(expandableRow).findByText('Additional');
    expect(panel).toBeTruthy();

    await user.click(panel);

    // Check Additional panel contains PID and ES-DOC
    const firstPidBtn = await within(expandableRow).findByText('PID');
    const firstInfoBtn = await within(expandableRow).findByText('ES-DOC');
    expect(firstPidBtn).toBeTruthy();
    expect(firstInfoBtn).toBeTruthy();
  }, 120000);

  it('renders quality control flags for obs4MIPs datasets when the record has the respective attribute', async () => {
    const results = [...defaultProps.results];
    results[0] = {
      ...results[0],
      project: 'obs4MIPs',
      quality_control_flags: [
        'obs4mips_indicators:1:green',
        'obs4mips_indicators:2:green',
        'obs4mips_indicators:3:Yellow',
        'obs4mips_indicators:4:Green',
        'obs4mips_indicators:5:Yellow',
        'obs4mips_indicators:6:light_gray',
      ],
    };

    customRender(<Table {...defaultProps} results={results} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check first row exists
    const firstRow = await screen.findByTestId('cart-items-row-0');
    expect(firstRow).toBeTruthy();

    // Get the expandable cell
    const expandableCell = await within(firstRow).findByRole('cell', {
      name: 'right-circle',
    });
    expect(expandableCell).toBeTruthy();

    // Get the right circle icon within the cell and click to expand the row
    const expandableIcon = await within(expandableCell).findByRole('img', {
      name: 'right-circle',
    });
    expect(expandableIcon).toBeTruthy();
    await user.click(expandableIcon);

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1',
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();

    // Get the Additional panel and click on it
    const panel = await screen.findByText('Additional');
    expect(panel).toBeTruthy();
    await user.click(panel);

    // Check Additional panel contains quality flags
    const firstFlag = await within(expandableRow).findByTestId('qualityFlag1');
    expect(firstFlag).toBeTruthy();

    const lastFlag = await within(expandableRow).findByTestId('qualityFlag5');
    expect(lastFlag).toBeTruthy();
  }, 120000);

  it('renders add or remove button for items in or not in the cart respectively, and handles clicking them', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [defaultProps.results[0]]);
    customRender(<Table {...defaultProps} />);
    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check first row exists
    const firstRow = await screen.findByTestId('cart-items-row-0');

    expect(firstRow).toBeTruthy();

    // Check first row has remove button and click it
    const removeBtn = await within(firstRow).findByRole('img', {
      name: 'minus',
    });
    expect(removeBtn).toBeTruthy();
    await user.click(removeBtn);

    // Check second row exists
    const secondRow = await screen.findByTestId('cart-items-row-1');
    expect(secondRow).toBeTruthy();

    // Check second row has add button and click it
    const addBtn = await within(secondRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await user.click(addBtn);
  }, 120000);

  it('handles when clicking the select checkbox for a row', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, []);
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check a record row exist
    const row = await screen.findByTestId('cart-items-row-0');
    expect(row).toBeTruthy();

    const checkBox = await within(row).findByRole('checkbox');
    expect(checkBox).toBeTruthy();

    await user.click(checkBox);
  });

  it('handles when clicking the select all checkbox in the table"s header', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, []);
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check the select all checkbox exists and click it
    // Note: Cannot query by aria-role or data-testid because Ant Design API
    //   renders the column and there are checkboxes for each row (no uniqueness)
    const selectAllCheckbox = document.querySelector(
      'th.ant-table-cell.ant-table-selection-column [type="checkbox"]',
    ) as HTMLInputElement;
    expect(selectAllCheckbox).toBeTruthy();

    await user.click(selectAllCheckbox);
  });

  it('handles downloading an item via wget', async () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://test.com/search',
        pathname: 'testing/search',
      },
      writable: true,
    });

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [defaultProps.results[0]]);
    customRender(<Table {...defaultProps} />);

    // Check table renders
    const tableComponent = await screen.findByRole('table');
    expect(tableComponent).toBeTruthy();

    // Check first row renders
    const firstRow = await screen.findByTestId('cart-items-row-0');
    expect(firstRow).toBeTruthy();

    // Check first row download button renders and submit the form
    const firstRowBtn = await within(firstRow).findByRole('img', {
      name: 'download',
    });
    expect(firstRowBtn).toBeTruthy();

    await user.click(firstRowBtn);

    // Wait component to re-render
    await screen.findByRole('table');

    // Check success message renders
    const successMsg = await screen.findByText('Wget script generated successfully!');
    expect(successMsg).toBeTruthy();
  });

  it('displays an error when unable to access download via wget', async () => {
    server.use(rest.post(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404))));

    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, [defaultProps.results[0]]);
    customRender(<Table {...defaultProps} />);

    // Check table renders
    const tableComponent = await screen.findByRole('table');
    expect(tableComponent).toBeTruthy();

    // Check first row renders
    const firstRow = await screen.findByTestId('cart-items-row-0');
    expect(firstRow).toBeTruthy();

    // Check first row download button renders and submit the form
    const firstRowBtn = await within(firstRow).findByRole('img', {
      name: 'download',
    });
    expect(firstRowBtn).toBeTruthy();
    await user.click(firstRowBtn);

    // Wait component to re-render
    await screen.findByRole('table');

    // Check error message renders
    const errorMsg = await screen.findByText(apiRoutes.wget.handleErrorMsg(404));
    expect(errorMsg).toBeTruthy();
  });
  it('does not render Globus Ready column when globusEnabledNodes is empty', async () => {
    // Set names of the globus enabled nodes
    mockConfig.GLOBUS_NODES = [];

    customRender(<Table {...defaultProps} />);

    // Check table renders
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check first row renders
    const firstRow = await screen.findByTestId('cart-items-row-0');
    expect(firstRow).toBeTruthy();

    // Check Globus Ready column does not exist
    const globusReadyColumn = screen.queryByText('Globus Ready');
    expect(globusReadyColumn).toBeNull();
  });

  it('renders STAC icon when record is a STAC dataset', async () => {
    customRender(
      <Table
        {...defaultProps}
        results={[rawSearchResultFixture({ isStac: true, id: 'stac-1', master_id: 'stac-1' })]}
      />,
    );

    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // The STAC icon is rendered as an img with accessible name 'STAC'
    const stacIcon = await within(table).findByRole('img', { name: 'STAC' });
    expect(stacIcon).toBeTruthy();
  });
});

describe('test QualityFlag', () => {
  it('renders component', async () => {
    customRender(<QualityFlag index="1" color="blue" />);

    const component = await screen.findByTestId('qualityFlag1');
    expect(component).toBeTruthy();
  });
});

describe('test column sorting', () => {
  it('sorts by Dataset ID column', async () => {
    const colIdx = 4; // The column that Total Size is in
    customRender(
      <Table
        {...defaultProps}
        results={[
          rawSearchResultFixture({ id: 'foo', master_id: 'zyx' }),
          rawSearchResultFixture({ id: 'bar', master_id: 'abc' }),
        ]}
      />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Verify current row value
    const cell = (await within(firstRow).findAllByRole('cell'))[colIdx];
    expect(cell).toBeTruthy();
    expect(cell).toHaveTextContent('zyx');

    // Click on the column header to sort
    const headerRow = (await screen.findAllByRole('row'))[0];
    expect(headerRow).toBeTruthy();
    const tableHeader = await within(headerRow).findByText('Dataset ID');
    expect(tableHeader).toBeTruthy();
    await user.click(tableHeader);

    // Updated first row in table
    const updatedRow = (await screen.findAllByRole('row'))[1];
    expect(updatedRow).toBeTruthy();

    // Verify current row value
    const updatedCell = (await within(updatedRow).findAllByRole('cell'))[colIdx];
    expect(updatedCell).toBeTruthy();

    // Verify sorting by checking the row value changed
    expect(updatedCell).toHaveTextContent('abc');
  });

  it('sorts by Files column', async () => {
    const colIdx = 5; // The column that Total Size is in
    customRender(
      <Table
        {...defaultProps}
        results={[
          rawSearchResultFixture({ id: 'foo', number_of_files: 18 }),
          rawSearchResultFixture({ id: 'bar', number_of_files: 7 }),
        ]}
      />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Verify current row value
    const cell = (await within(firstRow).findAllByRole('cell'))[colIdx];
    expect(cell).toBeTruthy();
    expect(cell).toHaveTextContent('18');

    // Click on the column header to sort
    const headerRow = (await screen.findAllByRole('row'))[0];
    expect(headerRow).toBeTruthy();
    const tableHeader = await within(headerRow).findByText('Files');
    expect(tableHeader).toBeTruthy();
    await user.click(tableHeader);

    // Updated first row in table
    const updatedRow = (await screen.findAllByRole('row'))[1];
    expect(updatedRow).toBeTruthy();

    // Verify current row value
    const updatedCell = (await within(updatedRow).findAllByRole('cell'))[colIdx];
    expect(updatedCell).toBeTruthy();

    // Verify sorting by checking the row value changed
    expect(updatedCell).toHaveTextContent('7');
  });

  it('sorts by Total Size column', async () => {
    const colIdx = 6; // The column that Total Size is in
    customRender(
      <Table
        {...defaultProps}
        results={[
          rawSearchResultFixture({ id: 'foo', size: 5678 }),
          rawSearchResultFixture({ id: 'bar', size: 1234 }),
        ]}
      />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Verify current row value
    const cell = (await within(firstRow).findAllByRole('cell'))[colIdx];
    expect(cell).toBeTruthy();
    expect(cell).toHaveTextContent('5.54 KB');

    // Click on the column header to sort
    const headerRow = (await screen.findAllByRole('row'))[0];
    expect(headerRow).toBeTruthy();
    const tableHeader = await within(headerRow).findByText('Total Size');
    expect(tableHeader).toBeTruthy();
    await user.click(tableHeader);

    // Updated first row in table
    const updatedRow = (await screen.findAllByRole('row'))[1];
    expect(updatedRow).toBeTruthy();

    // Verify current row value
    const updatedCell = (await within(updatedRow).findAllByRole('cell'))[colIdx];
    expect(updatedCell).toBeTruthy();

    // Verify sorting by checking the row value changed
    expect(updatedCell).toHaveTextContent('1.21 KB');
  });

  it('sorts by Version column', async () => {
    const colIdx = 7; // The column that version is in
    customRender(
      <Table
        {...defaultProps}
        results={[
          rawSearchResultFixture({ id: 'foo', version: '5678' }),
          rawSearchResultFixture({ id: 'bar', version: '1234' }),
        ]}
      />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Verify current row value
    const cell = (await within(firstRow).findAllByRole('cell'))[colIdx];
    expect(cell).toBeTruthy();
    expect(cell).toHaveTextContent('5678');

    // Click on the column header to sort
    const headerRow = (await screen.findAllByRole('row'))[0];
    expect(headerRow).toBeTruthy();
    const tableHeader = await within(headerRow).findByText('Version');
    expect(tableHeader).toBeTruthy();
    await user.click(tableHeader);

    // Updated first row in table
    const updatedRow = (await screen.findAllByRole('row'))[1];
    expect(updatedRow).toBeTruthy();

    // Verify current row value
    const updatedCell = (await within(updatedRow).findAllByRole('cell'))[colIdx];
    expect(updatedCell).toBeTruthy();

    // Verify sorting by checking the row value changed
    expect(updatedCell).toHaveTextContent('1234');
  });

  it('Handles sorting without breaking even if values are undefined', async () => {
    customRender(
      <Table
        {...defaultProps}
        results={[
          rawSearchResultFixture({
            id: 'first',
            master_id: undefined,
            number_of_files: undefined,
            size: undefined,
            version: undefined,
          }),
          rawSearchResultFixture({
            id: 'second',
            master_id: undefined,
            number_of_files: undefined,
            size: undefined,
            version: undefined,
          }),
        ]}
      />,
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Header row in table
    const firstRow = (await screen.findAllByRole('row'))[0];
    expect(firstRow).toBeTruthy();

    // Click on the column header to sort
    const tableDatasetId = await within(firstRow).findByText('Dataset ID');
    expect(tableDatasetId).toBeTruthy();
    await user.click(tableDatasetId);

    // Click on the column header to sort
    const files = await within(firstRow).findByText('Files');
    expect(files).toBeTruthy();
    await user.click(files);

    // Click on the column header to sort
    const totalSize = await within(firstRow).findByText('Total Size');
    expect(totalSize).toBeTruthy();
    await user.click(totalSize);

    // Click on the column header to sort
    const version = await within(firstRow).findByText('Version');
    expect(version).toBeTruthy();
    await user.click(version);
  });
});
