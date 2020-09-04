import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DownCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import {
  AutoComplete,
  Collapse,
  Form,
  message,
  Select,
  Table as TableD,
} from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig } from 'antd/lib/table';
import React from 'react';
import { fetchWgetScript, openDownloadURL } from '../../api';
import { formatBytes, hasKey, parseUrl } from '../../utils/utils';
import { CartType } from '../Cart/types';
import Button from '../General/Button';
import Divider from '../General/Divider';
import Citation from './Citation';
import FilesTable from './FilesTable';
import './Search.css';
import { RawSearchResult } from './types';

export type Props = {
  loading: boolean;
  results: RawSearchResult[] | [];
  totalResults?: number;
  cart: CartType | [];
  handleCart: (item: RawSearchResult[], operation: 'add' | 'remove') => void;
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
          rowRecord: RawSearchResult,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelect: (_record: any, _selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (handleRowSelect) {
          handleRowSelect(selectedRows);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelectAll: (_selected: any, _selectedRows: any, changeRows: any) => {
        /* istanbul ignore else */
        if (handleRowSelect) {
          handleRowSelect(changeRows);
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
      render: (record: RawSearchResult) => {
        const availableDownloads = ['wget'];
        let globusCompatible = false;

        record.access.forEach((download) => {
          if (download === 'Globus') {
            globusCompatible = true;
            availableDownloads.push('Globus');
          }
        });

        /**
         * Handle the download form for datasets
         */
        const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
          /* istanbul ignore else */
          if (downloadType === 'wget') {
            // eslint-disable-next-line no-void
            void message.success(
              'The wget script is generating, please wait momentarily.'
            );
            fetchWgetScript(record.id)
              .then((url) => {
                openDownloadURL(url);
              })
              .catch(() => {
                // eslint-disable-next-line no-void
                void message.error(
                  'There was an issue generating the wget script. Please contact support or try again later.'
                );
              });
          }
        };

        return (
          <>
            <p>
              {globusCompatible ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : (
                <CloseCircleTwoTone twoToneColor="#eb2f96" />
              )}{' '}
              Globus Compatible
            </p>
            <Form
              layout="inline"
              onFinish={({ download }) => handleDownloadForm(download)}
              initialValues={{ download: availableDownloads[0] }}
            >
              <Form.Item name="download">
                <Select style={{ width: 120 }}>
                  {availableDownloads.map((option) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  type="default"
                  htmlType="submit"
                  icon={<DownloadOutlined />}
                ></Button>
              </Form.Item>
            </Form>
          </>
        );
      },
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
                More Info
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
              type="primary"
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
      {...tableConfig}
      columns={columns}
      dataSource={results}
      rowKey="id"
      scroll={{ y: 'calc(70vh)' }}
    />
  );
};

export default Table;
