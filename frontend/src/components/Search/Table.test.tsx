import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  rawSearchResultFixture,
  rawSearchResultsFixture,
} from '../../test/mock/fixtures';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import Table, { Props } from './Table';
import { QualityFlag } from './Tabs';
import { getRowName } from '../../test/jestTestFunctions';

const user = userEvent.setup();

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

describe('test main table UI', () => {
  it('renders component', async () => {
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
      />
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check a record row exist
    const row = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'foo', 'N/A', 'N/A', '1'),
    });
    expect(row).toBeTruthy();
  });

  it('renders warning that dataset is retracted', async () => {
    customRender(
      <Table
        {...defaultProps}
        results={[rawSearchResultFixture({ retracted: true })]}
      />
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check the dataset title include retracted warning
    const cell = await within(table).findByRole('cell', {
      name:
        'foo IMPORTANT! This dataset has been retracted and is no longer available for download.',
    });
    expect(cell).toBeTruthy();

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
    await act(async () => {
      await user.click(expandableIcon);
    });

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1'
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();
  });

  it('renders record metadata in an expandable panel', async () => {
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check a record row exist
    const row = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'foo', '3', '1', '1', true),
    });
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
    await act(async () => {
      await user.click(expandableIcon);
    });

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1'
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();

    // Get the meta data panel and click on it
    const panel = await within(expandableRow).findByText('Metadata');
    expect(panel).toBeTruthy();

    await act(async () => {
      await user.click(panel);
    });

    // Check metadata panel contains metadata
    const id = await screen.findByText(
      (_, node) => node?.textContent === 'id: foo'
    );
    expect(id).toBeInTheDocument();

    // Open up the Autocomplete form and change the input to look up 'i'
    const form = await within(expandableRow).findByRole('combobox');
    expect(form).toBeTruthy();

    await act(async () => {
      await user.type(form, 'i');
    });

    // Get the down circle icon within the cell and click to close the expandable row
    const expandableDownIcon = await within(expandableCell).findByRole('img', {
      name: 'down-circle',
    });
    expect(expandableDownIcon).toBeTruthy();

    await act(async () => {
      await user.click(expandableDownIcon);
    });
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
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'foo', '3', '1', '1', true),
    });
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

    await act(async () => {
      await user.click(expandableIcon);
    });

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1'
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();

    // Get the Additional panel and click on it
    const panel = await within(expandableRow).findByText('Additional');
    expect(panel).toBeTruthy();

    await act(async () => {
      await user.click(panel);
    });

    // Check Additional panel contains PID and ES-DOC
    const firstPidBtn = await within(expandableRow).findByText('PID');
    const firstInfoBtn = await within(expandableRow).findByText('ES-DOC');
    expect(firstPidBtn).toBeTruthy();
    expect(firstInfoBtn).toBeTruthy();
  });

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
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'foo', '3', '1', '1', true),
    });
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
    await act(async () => {
      await user.click(expandableIcon);
    });

    // Get the expandable row that was rendered and click on it
    const expandableRow = document.querySelector(
      'tr.ant-table-expanded-row.ant-table-expanded-row-level-1'
    ) as HTMLElement;
    expect(expandableRow).toBeTruthy();

    // Get the Additional panel and click on it
    const panel = await screen.findByText('Additional');
    expect(panel).toBeTruthy();
    await act(async () => {
      await user.click(panel);
    });

    // Check Additional panel contains quality flags
    const firstFlag = await within(expandableRow).findByTestId('qualityFlag1');
    expect(firstFlag).toBeTruthy();

    const lastFlag = await within(expandableRow).findByTestId('qualityFlag5');
    expect(lastFlag).toBeTruthy();
  });

  it('renders add or remove button for items in or not in the cart respectively, and handles clicking them', async () => {
    customRender(
      <Table {...defaultProps} userCart={[defaultProps.results[0]]} />
    );

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check first row exists
    const firstRow = await screen.findByRole('row', {
      name: getRowName('minus', 'question', 'foo', '3', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row has remove button and click it
    const removeBtn = await within(firstRow).findByRole('img', {
      name: 'minus',
    });
    expect(removeBtn).toBeTruthy();
    await act(async () => {
      await user.click(removeBtn);
    });

    // Check second row exists
    const secondRow = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'bar', '2', '1', '1'),
    });
    expect(secondRow).toBeTruthy();

    // Check second row has add button and click it
    const addBtn = await within(secondRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });
  });

  it('handles when clicking the select checkbox for a row', async () => {
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check a record row exist
    const row = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'foo', '3', '1', '1'),
    });
    expect(row).toBeTruthy();

    const checkBox = await within(row).findByRole('checkbox');
    expect(checkBox).toBeTruthy();

    await act(async () => {
      await user.click(checkBox);
    });
  });

  it('handles when clicking the select all checkbox in the table"s header', async () => {
    customRender(<Table {...defaultProps} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Check the select all checkbox exists and click it
    // Note: Cannot query by aria-role or data-testid because Ant Design API
    //   renders the column and there are checkboxes for each row (no uniqueness)
    const selectAllCheckbox = document.querySelector(
      'th.ant-table-cell.ant-table-selection-column [type="checkbox"]'
    ) as HTMLInputElement;
    expect(selectAllCheckbox).toBeTruthy();

    await act(async () => {
      await user.click(selectAllCheckbox);
    });
  });

  it('handles downloading an item via wget', async () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: jest.fn(),
      },
    });

    customRender(
      <Table {...defaultProps} userCart={[defaultProps.results[0]]} />
    );

    // Check table renders
    const tableComponent = await screen.findByRole('table');
    expect(tableComponent).toBeTruthy();

    // Check first row renders
    const firstRow = await screen.findByRole('row', {
      name: getRowName('minus', 'question', 'foo', '3', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row download button renders and submit the form
    const firstRowBtn = await within(firstRow).findByRole('img', {
      name: 'download',
    });
    expect(firstRowBtn).toBeTruthy();

    await act(async () => {
      await user.click(firstRowBtn);
    });

    // Wait component to re-render
    await screen.findByRole('table');

    // Check success message renders
    const successMsg = await screen.findByText(
      'Wget script downloaded successfully!'
    );
    expect(successMsg).toBeTruthy();
  });

  it('displays an error when unable to access download via wget', async () => {
    server.use(
      rest.post(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404)))
    );

    customRender(
      <Table {...defaultProps} userCart={[defaultProps.results[0]]} />
    );

    // Check table renders
    const tableComponent = await screen.findByRole('table');
    expect(tableComponent).toBeTruthy();

    // Check first row renders
    const firstRow = await screen.findByRole('row', {
      name: getRowName('minus', 'question', 'foo', '3', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row download button renders and submit the form
    const firstRowBtn = await within(firstRow).findByRole('img', {
      name: 'download',
    });
    expect(firstRowBtn).toBeTruthy();
    await act(async () => {
      await user.click(firstRowBtn);
    });

    // Wait component to re-render
    await screen.findByRole('table');

    // Check error message renders
    const errorMsg = await screen.findByText(
      apiRoutes.wget.handleErrorMsg(404)
    );
    expect(errorMsg).toBeTruthy();
  });
});

describe('test QualityFlag', () => {
  it('renders component', async () => {
    customRender(<QualityFlag index="1" color="blue" />);

    const component = await screen.findByTestId('qualityFlag1');
    expect(component).toBeTruthy();
  });
});
