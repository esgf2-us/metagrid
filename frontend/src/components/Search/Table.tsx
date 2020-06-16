import React from 'react';
import { AutoComplete, Collapse, Form, Select, Table as TableD } from 'antd';
import {
  RightCircleOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig } from 'antd/lib/table';

import Citation from './Citation';
import FilesTable from './FilesTable';
import Button from '../General/Button';
import Divider from '../General/Divider';

import { formatBytes, hasKey, parseUrl } from '../../utils/utils';
import './Search.css';

export type Props = {
  loading: boolean;
  results: RawSearchResult[] | [];
  totalResults?: number;
  cart: Cart | [];
  handleCart: (item: RawSearchResult[], action: string) => void;
  handleRowSelect?: (selectedRows: RawSearchResult[] | []) => void;
  handlePagination?: (page: number, pageSize: number) => void;
  handlePageSizeChange?: (size: number) => void;
};

const Table: React.FC<Props> = ({
  loading,
  results,
  totalResults,
  cart,
  handleCart,
  handleRowSelect,
  handlePagination,
  handlePageSizeChange,
}) => {
  const tableConfig = {
    size: 'small' as SizeType,
    loading,
    pagination: {
      total: totalResults,
      position: ['bottomCenter'],
      showSizeChanger: true,
      onChange: (page: number, pageSize: number) =>
        handlePagination && handlePagination(page, pageSize),
      onShowSizeChange: (_current: number, size: number) =>
        handlePageSizeChange && handlePageSizeChange(size),
    } as TablePaginationConfig,
    expandable: {
      expandedRowRender: (record: RawSearchResult) => {
        const metaData = Object.entries(record).map(([k, v]) => ({
          value: `${k}: ${v as string}`,
        }));

        return (
          <>
            <Collapse>
              {hasKey(record, 'citation_url') && (
                <Collapse.Panel header="Citation" key="citation">
                  <Citation
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    url={record.citation_url![0]}
                  />
                </Collapse.Panel>
              )}

              <Collapse.Panel
                className="metadata"
                header="Metadata"
                key="metadata"
              >
                <h4>Displaying {Object.keys(record).length} keys</h4>
                <AutoComplete
                  style={{ width: '100%' }}
                  options={metaData}
                  placeholder="Lookup a key..."
                  filterOption={(inputValue, option) =>
                    (option as Record<'value', string>).value
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                />
                <Divider />
                {Object.keys(record).map((key) => {
                  return (
                    <p key={key} style={{ margin: 0 }}>
                      <span style={{ fontWeight: 'bold' }}>{key}</span>:{' '}
                      {record[key]}
                    </p>
                  );
                })}
              </Collapse.Panel>
              <Collapse.Panel header="Files" key="files">
                <FilesTable id={record.id} />
              </Collapse.Panel>
            </Collapse>
          </>
        );
      },
      expandIcon: ({
        expanded,
        onExpand,
        record,
      }: {
        expanded: boolean;
        onExpand: (
          record: RawSearchResult,
          e: React.MouseEvent<HTMLSpanElement, MouseEvent>
        ) => void;
        record: RawSearchResult;
      }): React.ReactElement =>
        expanded ? (
          <DownCircleOutlined onClick={(e) => onExpand(record, e)} />
        ) : (
          <RightCircleOutlined onClick={(e) => onExpand(record, e)} />
        ),
    },
    rowSelection: {
      getCheckboxProps: (record: RawSearchResult) =>
        cart.includes(record as never, 0)
          ? { disabled: true }
          : { disabled: false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelect: (_record: any, _selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (handleRowSelect) {
          handleRowSelect(selectedRows);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelectAll: (_selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (handleRowSelect) {
          handleRowSelect(selectedRows);
        }
      },
    },

    hasData: results.length > 0,
  };

  const columns = [
    {
      title: 'Dataset Title',
      dataIndex: 'title',
      key: 'title',
      width: 400,
    },
    {
      title: '# of Files',
      dataIndex: 'number_of_files',
      key: 'number_of_files',
      width: 100,
      render: (numberOfFiles: number) => <p>{numberOfFiles}</p>,
    },
    {
      title: 'Total Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => <p>{formatBytes(size)}</p>,
    },
    {
      title: 'Node',
      dataIndex: 'data_node',
      key: 'data_node',
      width: 200,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: 'Download',
      key: 'download',
      width: 200,
      render: (record: RawSearchResult) => (
        <span>
          <Form layout="inline">
            <Form.Item>
              {/* eslint-disable-next-line react/prop-types */}
              <Select defaultValue={record.access[0]} style={{ width: 120 }}>
                {/* eslint-disable-next-line react/prop-types */}
                {record.access.map((option) => (
                  <Select.Option key={option} value={option}>
                    {option}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled
              ></Button>
            </Form.Item>
          </Form>
        </span>
      ),
    },
    {
      title: 'Additional',
      key: 'additional',
      width: 200,
      render: (record: RawSearchResult) => {
        return (
          <>
            {hasKey(record, 'xlink') && (
              <Button
                type="link"
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                href={parseUrl(record.xlink![1], '|')}
                target="_blank"
              >
                PID
              </Button>
            )}
            {hasKey(record, 'further_info_url') && (
              <Button
                type="link"
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                href={record.further_info_url![0]}
                target="_blank"
              >
                Further Info
              </Button>
            )}
          </>
        );
      },
    },
    {
      title: 'Cart',
      key: 'cart',
      width: 50,
      render: (record: RawSearchResult) => {
        if (cart.includes(record as never, 0)) {
          return (
            <>
              <Button
                icon={<MinusOutlined />}
                onClick={() => handleCart([record], 'remove')}
                danger
              />
            </>
          );
        }
        return (
          <>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => handleCart([record], 'add')}
            />
          </>
        );
      },
    },
  ];

  return (
    <TableD
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...tableConfig}
      columns={columns}
      dataSource={results}
      rowKey="id"
      scroll={{ y: 595 }}
    />
  );
};

export default Table;
