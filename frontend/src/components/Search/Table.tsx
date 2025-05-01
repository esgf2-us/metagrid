import {
  DownCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import { Form, Select, Table as TableD, Tooltip, message } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig } from 'antd/lib/table';
import React from 'react';
import { useAtomValue } from 'jotai';
import { fetchWgetScript, ResponseError } from '../../api';
import { formatBytes, showError, showNotice } from '../../common/utils';
import { UserCart } from '../Cart/types';
import Button from '../General/Button';
import StatusToolTip from '../NodeStatus/StatusToolTip';
import './Search.css';
import Tabs from './Tabs';
import {
  AlignType,
  FixedType,
  OnChange,
  RawSearchResult,
  RawSearchResults,
  Sorts,
  TextInputs,
} from './types';
import GlobusToolTip from '../NodeStatus/GlobusToolTip';
import { topDataRowTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import { userCartAtom } from '../../common/atoms';

export type Props = {
  loading: boolean;
  canDisableRows?: boolean;
  results: RawSearchResults | [];
  totalResults?: number;
  selections?: RawSearchResults | [];
  filenameVars?: TextInputs | [];
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onRowSelect?: (selectedRows: RawSearchResults | []) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (size: number) => void;
};

const Table: React.FC<React.PropsWithChildren<Props>> = ({
  loading,
  canDisableRows = true,
  results,
  totalResults,
  selections,
  filenameVars,
  onUpdateCart,
  onRowSelect,
  onPageChange,
  onPageSizeChange,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  const [sortedInfo, setSortedInfo] = React.useState<Sorts>({});

  // Global states
  const userCart = useAtomValue<UserCart>(userCartAtom);

  const showStatus = window.METAGRID.STATUS_URL !== null;

  // Add options to this constant as needed
  type DatasetDownloadTypes = 'wget' | 'Globus';

  // If a record supports downloads from the allowed downloads, it will render
  // in the drop downs
  const allowedDownloadTypes: DatasetDownloadTypes[] = ['wget'];

  const handleChange: OnChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter as Sorts);
  };

  const tableConfig = {
    size: 'small' as SizeType,
    loading,
    pagination: {
      total: totalResults,
      position: ['bottomCenter'],
      showSizeChanger: {
        optionRender: (option) => {
          return <span data-testid={`pageSize-option-${option.value}`}>{option.label}</span>;
        },
      },
      onChange: (page: number, pageSize: number) => onPageChange && onPageChange(page, pageSize),
      onShowSizeChange: (_current: number, size: number) =>
        onPageSizeChange && onPageSizeChange(size),
    } as TablePaginationConfig,
    expandable: {
      expandedRowRender: (record: RawSearchResult) => (
        <Tabs data-test-id="extra-tabs" record={record} filenameVars={filenameVars}></Tabs>
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
      }): React.ReactNode =>
        expanded ? (
          <DownCircleOutlined
            className={topDataRowTargets.searchResultsRowContractIcon.class()}
            onClick={(e) => onExpand(record, e)}
          />
        ) : (
          <Tooltip title="View this dataset's metadata, files or additional info." trigger="hover">
            <RightCircleOutlined
              className={topDataRowTargets.searchResultsRowExpandIcon.class()}
              onClick={(e) => onExpand(record, e)}
            />
          </Tooltip>
        ),
    },
    rowSelection: {
      selectedRowKeys: selections?.map((item) => {
        /* istanbul ignore next */
        return item ? item.id : '';
      }),
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
          (userCart.some((item) => item.id === record.id) || record.retracted === true),
      }),
    },
    hasData: results.length > 0,
  };

  const columns = [
    {
      align: 'right' as AlignType,
      fixed: 'left' as FixedType,
      title: 'Cart',
      key: 'cart',
      width: 50,
      render: (value: string, record: RawSearchResult, index: number) => {
        if (userCart.some((dataset: RawSearchResult) => dataset.id === record.id)) {
          return (
            <Button
              className={topDataRowTargets.cartAddBtn.class('minus')}
              icon={<MinusOutlined data-testid={`row-${index}-remove-from-cart`} />}
              onClick={() => onUpdateCart([record], 'remove')}
              danger
            />
          );
        }
        return (
          <Button
            type="primary"
            className={topDataRowTargets.cartAddBtn.class('plus')}
            disabled={record.retracted === true}
            icon={<PlusOutlined data-testid={`row-${index}-add-to-cart`} />}
            onClick={() => onUpdateCart([record], 'add')}
          />
        );
      },
    },
    ...(showStatus
      ? [
          {
            align: 'center' as AlignType,
            fixed: 'left' as FixedType,
            title: '',
            dataIndex: 'data_node',
            key: 'node_status',
            width: 35,
            render: (data_node: string) => (
              <div className={topDataRowTargets.nodeStatusIcon.class()}>
                <StatusToolTip dataNode={data_node} />
              </div>
            ),
          },
        ]
      : []),
    {
      title: 'Dataset ID',
      dataIndex: 'master_id',
      key: 'title',
      sorter: (a: RawSearchResult, b: RawSearchResult) => {
        const idA = a.master_id ?? '';
        const idB = b.master_id ?? '';
        return idA.toString().localeCompare(idB.toString());
      },
      sortOrder: sortedInfo.columnKey === 'title' ? sortedInfo.order : null,
      render: (title: string, record: RawSearchResult) => {
        if (record && record.retracted) {
          const msg =
            'IMPORTANT! This dataset has been retracted and is no longer available for download.';
          return (
            <div className={topDataRowTargets.datasetTitle.class()}>
              <p>
                <span style={{ textDecoration: 'line-through' }}>{title}</span>
                <br />
                <span style={{ color: 'red' }}>{msg}</span>
              </p>
            </div>
          );
        }
        return <div className={topDataRowTargets.datasetTitle.class()}>{title}</div>;
      },
    },
    {
      align: 'center' as AlignType,
      title: 'Files',
      dataIndex: 'number_of_files',
      key: 'number_of_files',
      sorter: (a: RawSearchResult, b: RawSearchResult) => {
        return (a.number_of_files || 0) - (b.number_of_files || 0);
      },
      sortOrder: sortedInfo.columnKey === 'number_of_files' ? sortedInfo.order : null,
      render: (numberOfFiles: number) => (
        <p className={topDataRowTargets.fileCount.class()}>{numberOfFiles || 'N/A'}</p>
      ),
    },
    {
      align: 'center' as AlignType,
      title: 'Total Size',
      dataIndex: 'size',
      key: 'size',
      sorter: (a: RawSearchResult, b: RawSearchResult) => {
        return (a.size || 0) - (b.size || 0);
      },
      sortOrder: sortedInfo.columnKey === 'size' ? sortedInfo.order : null,
      render: (size: number) => (
        <p className={topDataRowTargets.totalSize.class()}>{size ? formatBytes(size) : 'N/A'}</p>
      ),
    },
    {
      align: 'center' as AlignType,
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      sorter: (a: RawSearchResult, b: RawSearchResult) => {
        const idA = a.version ?? '';
        const idB = b.version ?? '';
        return idA.toString().localeCompare(idB.toString());
      },
      sortOrder: sortedInfo.columnKey === 'version' ? sortedInfo.order : null,
      render: (version: string) => (
        <p className={topDataRowTargets.versionText.class()}>{version}</p>
      ),
    },
    {
      align: 'center' as AlignType,
      fixed: 'right' as FixedType,
      title: 'Download Options',
      key: 'download',
      width: 180,
      render: (record: RawSearchResult) => {
        const formKey = `download-${record.id}`;

        /**
         * Handle the download form for datasets
         */
        const handleDownloadForm = (downloadType: DatasetDownloadTypes): void => {
          /* istanbul ignore else */
          if (downloadType === 'wget') {
            showNotice(messageApi, 'The wget script is generating, please wait momentarily.', {
              duration: 3,
              type: 'info',
            });
            fetchWgetScript([record.id], filenameVars)
              .then(() => {
                showNotice(messageApi, 'Wget script downloaded successfully!', {
                  duration: 3,
                  type: 'success',
                });
              })
              .catch((error: ResponseError) => {
                showError(messageApi, error.message);
              });
          }
        };

        return (
          <>
            {contextHolder}
            <Form
              className={topDataRowTargets.downloadScriptForm.class()}
              layout="inline"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              onFinish={({ [formKey]: download }) =>
                handleDownloadForm(download as DatasetDownloadTypes)
              }
              initialValues={{ [formKey]: allowedDownloadTypes[0] }}
            >
              <Form.Item name={formKey}>
                <Select
                  disabled={record.retracted === true}
                  className={topDataRowTargets.downloadScriptOptions.class()}
                  style={{ width: 100 }}
                  options={allowedDownloadTypes.map((option) => {
                    return {
                      key: `${formKey}-${option}`,
                      value: option,
                      label: option,
                    };
                  })}
                />
              </Form.Item>
              <Form.Item style={{ margin: 0 }}>
                <Button
                  disabled={record.retracted === true}
                  className={topDataRowTargets.downloadScriptBtn.class()}
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
    window.METAGRID.GLOBUS_NODES.length > 0
      ? {
          align: 'center' as AlignType,
          fixed: 'right' as FixedType,
          title: 'Globus Ready',
          dataIndex: 'data_node',
          key: 'globus_enabled',
          width: 110,
          render: (data_node: string) => (
            <div className={topDataRowTargets.globusReadyStatusIcon.class()}>
              <GlobusToolTip dataNode={data_node} />
            </div>
          ),
        }
      : {
          align: 'center' as AlignType,
          fixed: 'right' as FixedType,
          title: '',
          dataIndex: 'data_node',
          key: 'globus_enabled',
          width: 1,
          render: () => <div></div>,
        },
  ];

  return (
    <TableD
      {...tableConfig}
      columns={columns}
      dataSource={results}
      onChange={handleChange}
      rowKey="id"
      size="small"
      scroll={{ x: 'max-content' }}
      onRow={(record, rowIndex) => {
        return {
          id: `cart-items-row-${rowIndex}`,
          'data-testid': `cart-items-row-${rowIndex}`,
        };
      }}
    />
  );
};

export default Table;
