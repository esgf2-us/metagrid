import {
  DownCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import { Form, message, Select, Table as TableD } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig } from 'antd/lib/table';
import React from 'react';
import { fetchWgetScript, openDownloadURL, ResponseError } from '../../api';
import { topDataRowTargets } from '../../common/reactJoyrideSteps';
import { formatBytes } from '../../common/utils';
import { UserCart } from '../Cart/types';
import ToolTip from '../DataDisplay/ToolTip';
import Button from '../General/Button';
import StatusToolTip from '../NodeStatus/StatusToolTip';
import { NodeStatusArray } from '../NodeStatus/types';
import './Search.css';
import Tabs from './Tabs';
import { RawSearchResult, RawSearchResults, TextInputs } from './types';

export type Props = {
  loading: boolean;
  canDisableRows?: boolean;
  results: RawSearchResults | [];
  totalResults?: number;
  userCart: UserCart | [];
  selections?: RawSearchResults | [];
  nodeStatus?: NodeStatusArray;
  filenameVars?: TextInputs | [];
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onRowSelect?: (selectedRows: RawSearchResults | []) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (size: number) => void;
};

const Table: React.FC<Props> = ({
  loading,
  canDisableRows = true,
  results,
  totalResults,
  userCart,
  selections,
  nodeStatus,
  filenameVars,
  onUpdateCart,
  onRowSelect,
  onPageChange,
  onPageSizeChange,
}) => {
  // Add options to this constant as needed
  type DatasetDownloadTypes = 'wget' | 'Globus';
  // If a record supports downloads from the allowed downloads, it will render
  // in the drop downs
  const allowedDownloadTypes: DatasetDownloadTypes[] = ['wget'];

  const tableConfig = {
    size: 'small' as SizeType,
    loading,
    pagination: {
      total: totalResults,
      position: ['bottomCenter'],
      showSizeChanger: true,
      onChange: (page: number, pageSize: number) =>
        onPageChange && onPageChange(page, pageSize),
      onShowSizeChange: (_current: number, size: number) =>
        onPageSizeChange && onPageSizeChange(size),
    } as TablePaginationConfig,
    expandable: {
      expandedRowRender: (record: RawSearchResult) => (
        <Tabs record={record} filenameVars={filenameVars}></Tabs>
      ),
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
          <DownCircleOutlined
            className={topDataRowTargets.getClass(
              'searchResultsRowContractIcon'
            )}
            onClick={(e) => onExpand(record, e)}
          />
        ) : (
          <ToolTip
            title="View this dataset's metadata, files or additional info."
            trigger="hover"
          >
            <RightCircleOutlined
              className={topDataRowTargets.getClass(
                'searchResultsRowExpandIcon'
              )}
              onClick={(e) => onExpand(record, e)}
            />
          </ToolTip>
        ),
    },
    rowSelection: {
      selectedRowkeys: selections?.map((item) => item.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelect: (_record: any, _selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (onRowSelect) {
          onRowSelect(selectedRows as RawSearchResults);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelectAll: (_selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (onRowSelect) {
          onRowSelect(selectedRows as RawSearchResults);
        }
      },
      getCheckboxProps: (record: RawSearchResult) => ({
        disabled:
          canDisableRows &&
          (userCart.some((item) => item.id === record.id) ||
            record.retracted === true),
      }),
    },

    hasData: results.length > 0,
  };

  const columns = [
    {
      title: 'Cart',
      key: 'cart',
      width: 50,
      render: (record: RawSearchResult) => {
        if (
          userCart.some((dataset: RawSearchResult) => dataset.id === record.id)
        ) {
          return (
            <>
              <Button
                className={topDataRowTargets.getClass('cartAddBtn', 'minus')}
                icon={<MinusOutlined />}
                onClick={() => onUpdateCart([record], 'remove')}
                danger
              />
            </>
          );
        }
        return (
          <>
            <Button
              type="primary"
              disabled={record.retracted === true}
              icon={
                <PlusOutlined
                  className={topDataRowTargets.getClass('cartAddBtn', 'plus')}
                />
              }
              onClick={() => onUpdateCart([record], 'add')}
            />
          </>
        );
      },
    },
    {
      title: '',
      dataIndex: 'data_node',
      width: 20,
      render: (data_node: string) => (
        <div className={topDataRowTargets.getClass('nodeStatusIcon')}>
          <StatusToolTip nodeStatus={nodeStatus} dataNode={data_node} />
        </div>
      ),
    },
    {
      title: 'Dataset Title',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      render: (title: string, record: RawSearchResult) => {
        if (record && record.retracted) {
          const msg =
            'IMPORTANT! This dataset has been retracted and is no longer avaiable for download.';
          return (
            <div className={topDataRowTargets.getClass('datasetTitle')}>
              <p>
                <span style={{ textDecoration: 'line-through' }}>{title}</span>
                <br />
                <span style={{ color: 'red' }}>{msg}</span>
              </p>
            </div>
          );
        }
        return (
          <div className={topDataRowTargets.getClass('datasetTitle')}>
            {title}
          </div>
        );
      },
    },
    {
      title: 'Files',
      dataIndex: 'number_of_files',
      key: 'number_of_files',
      width: 50,
      render: (numberOfFiles: number) => (
        <p className={topDataRowTargets.getClass('fileCount')}>
          {numberOfFiles || 'N/A'}
        </p>
      ),
    },
    {
      title: 'Total Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => (
        <p className={topDataRowTargets.getClass('totalSize')}>
          {size ? formatBytes(size) : 'N/A'}
        </p>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => (
        <p className={topDataRowTargets.getClass('versionText')}>{version}</p>
      ),
    },
    {
      title: 'Download Options',
      key: 'download',
      width: 200,
      render: (record: RawSearchResult) => {
        const supportedDownloadTypes = record.access;
        const formKey = `download-${record.id}`;

        /**
         * Handle the download form for datasets
         */
        const handleDownloadForm = (
          downloadType: DatasetDownloadTypes
        ): void => {
          /* istanbul ignore else */
          if (downloadType === 'wget') {
            // eslint-disable-next-line no-void
            void message.success(
              'The wget script is generating, please wait momentarily.'
            );
            fetchWgetScript(record.id, filenameVars)
              .then((url) => {
                openDownloadURL(url);
              })
              .catch((error: ResponseError) => {
                // eslint-disable-next-line no-void
                void message.error(error.message);
              });
          }
        };

        return (
          <>
            <Form
              className={topDataRowTargets.getClass('downloadScriptForm')}
              layout="inline"
              onFinish={({ [formKey]: download }) =>
                handleDownloadForm(download as DatasetDownloadTypes)
              }
              initialValues={{ [formKey]: allowedDownloadTypes[0] }}
            >
              <Form.Item name={formKey}>
                <Select
                  disabled={record.retracted === true}
                  className={topDataRowTargets.getClass(
                    'downloadScriptOptions'
                  )}
                  style={{ width: 120 }}
                >
                  {allowedDownloadTypes.map(
                    (option) =>
                      (supportedDownloadTypes.includes(option) ||
                        option === 'wget') && (
                        <Select.Option
                          key={`${formKey}-${option}`}
                          value={option}
                        >
                          {option}
                        </Select.Option>
                      )
                  )}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  disabled={record.retracted === true}
                  className={topDataRowTargets.getClass('downloadScriptBtn')}
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
  ];

  return (
    <TableD
      {...tableConfig}
      columns={columns}
      dataSource={results}
      rowKey="id"
      size="small"
      scroll={{ y: 'calc(100vh)' }}
    />
  );
};

export default Table;
