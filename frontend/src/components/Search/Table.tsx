import {
  CodeOutlined,
  DatabaseTwoTone,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Form, GetProp, Select, Table as TableD, Tooltip, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig, TableProps } from 'antd/lib/table';
import React, { useCallback } from 'react';
import { useAtomValue, useAtom } from 'jotai';
import stacIcon from '../../assets/img/STAC-favicon.png';
import { fetchWgetScript, ResponseError, STAC_BATCH_SIZE } from '../../api';
import {
  createEsgpullCommand,
  formatBytes,
  getCachedPagination,
  getCurrentAppPage,
  showError,
  showNotice,
} from '../../common/utils';
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
import GlobusToolTip from '../Globus/GlobusToolTip';
import { topDataRowTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import { userCartAtom, selectedNodesAtom, downloadSelectionsAtom } from '../../common/atoms';
import { AppPage } from '../../common/types';
import { createCustomIcon } from '../NavBar';
import {
  getStacGlobusHref,
  generateWgetScriptSTAC,
  getNodesListByDownloadType,
} from '../../common/STAC';
import TableExpandIcon, { TableExpandIconProps } from './TableExpandIcon';

export type Props = {
  loading: boolean;
  canDisableRows?: boolean;
  results: RawSearchResults | [];
  totalResults?: number;
  currentPage?: number;
  selections?: RawSearchResults | [];
  filenameVars?: TextInputs | [];
  isStac?: boolean;
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onRowSelect?: (selectedRows: RawSearchResults | []) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (size: number) => void;
  scroll?: { x?: string | number | true; y?: string | number };
};

// Add options to this constant as needed
type DatasetDownloadTypes = 'wget' | 'Globus' | 'esgpull';

const MAX_RESULTS = 10000;
const SUCCESS_MSG = 'Wget script generated successfully!';
const STAC_ERROR_MSG =
  'No file links found in the selected dataset, wget script was not generated.';

const Table: React.FC<React.PropsWithChildren<Props>> = ({
  loading,
  canDisableRows = true,
  results,
  totalResults,
  currentPage,
  selections,
  filenameVars,
  isStac = false,
  onUpdateCart,
  onRowSelect,
  onPageChange,
  onPageSizeChange,
  scroll,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  const [sortedInfo, setSortedInfo] = React.useState<Sorts<RawSearchResult>>({});

  // Global states
  const userCart = useAtomValue<UserCart>(userCartAtom);

  // Track download type selection per dataset row (shared state for cart)
  const [downloadSelections, setDownloadSelections] =
    useAtom<Record<string, DatasetDownloadTypes>>(downloadSelectionsAtom);

  // Track selected node per dataset row (shared state for cart)
  const [selectedNodes, setSelectedNodes] = useAtom<Record<string, string>>(selectedNodesAtom);

  const showStatus = window.METAGRID.STATUS_URL !== null;

  const stacDisabled = window.METAGRID.STAC_URL === '' || window.METAGRID.STAC_URL === null;

  const handleChange: OnChange<RawSearchResult> = (pagination, filters, sorter) => {
    setSortedInfo(sorter as Sorts<RawSearchResult>);
  };

  const renderPageSizeOption = useCallback(
    (option: { value: string | number; label: React.ReactNode }) => (
      <span data-testid={`pageSize-option-${option.value}`}>{option.label}</span>
    ),
    [],
  );

  const renderExpandedRow = useCallback(
    (record: RawSearchResult) => (
      <Tabs data-test-id="extra-tabs" record={record} filenameVars={filenameVars} />
    ),
    [filenameVars],
  );

  type ExpandIconType = GetProp<TableProps<RawSearchResult>, 'expandable'>['expandIcon'];

  const renderExpandIcon: ExpandIconType = useCallback(
    (props: JSX.IntrinsicAttributes & TableExpandIconProps) => (
      <TableExpandIcon
        {...props}
        contractClass={topDataRowTargets.searchResultsRowContractIcon.class()}
        expandClass={topDataRowTargets.searchResultsRowExpandIcon.class()}
      />
    ),
    [],
  );

  let cachedPage: number | undefined;
  let cachedSize: number | undefined;

  if (getCurrentAppPage() !== AppPage.Cart) {
    const pagination = getCachedPagination();
    cachedPage = pagination.page;
    cachedSize = pagination.pageSize;
  }

  // Use prop if provided, otherwise fall back to cache
  const safePage = currentPage ?? cachedPage ?? 1;
  const safeSize = cachedSize ?? 10;

  // Clamp the results count to a maximum of 10,000
  const clampedResultCount = totalResults ? Math.min(totalResults, MAX_RESULTS) : undefined;

  const filteredResults = results.filter((result) => !result.isStac || !stacDisabled);

  /**
   * Handle the download form for datasets
   */
  const handleDownloadForm = (
    record: RawSearchResult,
    downloadType: DatasetDownloadTypes,
  ): void => {
    /* istanbul ignore else -- @preserve */
    if (downloadType === 'wget') {
      /* istanbul ignore if -- @preserve */
      if (record.isStac) {
        // Get the selected node for this record
        const selectedNode = selectedNodes[record.id];

        // Generate file for STAC selections with the selected node
        const stacSuccess = generateWgetScriptSTAC([record], undefined, selectedNode);

        if (stacSuccess) {
          showNotice(messageApi, SUCCESS_MSG, {
            duration: 4,
            type: 'success',
          });
        } else {
          showError(messageApi, STAC_ERROR_MSG);
        }
      } else {
        showNotice(messageApi, 'The wget script is generating, please wait momentarily.', {
          duration: 3,
          type: 'info',
        });
        fetchWgetScript([record.id], filenameVars)
          .then(() => {
            showNotice(messageApi, SUCCESS_MSG, {
              duration: 3,
              type: 'success',
            });
          })
          .catch((error: ResponseError) => {
            showError(messageApi, error.message);
          });
      }
    } else if (downloadType === 'esgpull' && record.id) {
      if (navigator && navigator.clipboard && typeof record.master_id === 'string') {
        navigator.clipboard.writeText(createEsgpullCommand({}, true, record.master_id)).then(() => {
          showNotice(messageApi, 'Esgpull download dataset command copied to clipboard!', {
            duration: 3,
            type: 'success',
            icon: <CodeOutlined />,
          });
        });
      }
    } else if (downloadType === 'Globus' && record.globus_link) {
      // Get the selected node for this record
      const selectedNode = selectedNodes[record.id];

      // If a specific node is selected and assets exist, find the Globus URL for that node
      if (selectedNode && record.assets) {
        // Search through assets for the Globus link from the selected node
        const globusUrl = Object.values(record.assets).find((asset) => {
          if (!asset) {
            return false;
          }

          const assetNode = asset.alternateName || (asset['alternate:name'] as string);

          // Check if main asset is from the selected node and has a Globus link
          if (assetNode === selectedNode && asset.href?.startsWith('https://app.globus.org')) {
            return true;
          }

          // Check alternates for the selected node
          const alternates = asset.alternate;
          if (alternates && typeof alternates === 'object') {
            const altAsset = alternates[selectedNode];
            if (altAsset && altAsset.href?.startsWith('https://app.globus.org')) {
              return true;
            }
          }

          return false;
        });

        if (globusUrl) {
          // Determine which href to use (main or alternate)
          const assetNode = globusUrl.alternateName || (globusUrl['alternate:name'] as string);
          let urlToOpen = globusUrl.href;

          if (assetNode !== selectedNode && globusUrl.alternate) {
            const altAsset = globusUrl.alternate[selectedNode];
            if (altAsset && altAsset.href?.startsWith('https://app.globus.org')) {
              urlToOpen = altAsset.href;
            }
          }

          window.open(urlToOpen, '_blank');
        } else {
          // Fallback to the record's globus_link if no specific node link found
          window.open(record.globus_link, '_blank');
        }
      } else {
        // No specific node selected, use the default globus_link
        window.open(record.globus_link, '_blank');
      }
    }
  };

  // For STAC: calculate which batch we're in (safePage and safeSize defined above)
  const currentBatch = isStac ? Math.floor(((safePage - 1) * safeSize) / STAC_BATCH_SIZE) : 0;

  const tableConfig = {
    size: 'small' as SizeType,
    loading,
    pagination: {
      total: clampedResultCount,
      current: safePage,
      pageSize: safeSize,
      position: ['bottomCenter'],
      showSizeChanger: {
        optionRender: renderPageSizeOption,
      },
      // showPrevNextJumpers: !isStac,
      showQuickJumper: !isStac,
      showLessItems: isStac, // For STAC: hide "..." and far-ahead page numbers
      onChange: (page: number, pageSize: number) => {
        if (!onPageChange) return;

        if (isStac) {
          // For STAC, check if clicking on a page outside current batch
          const pageBatch = Math.floor(((page - 1) * pageSize) / STAC_BATCH_SIZE);
          if (pageBatch !== currentBatch) {
            // Switching batches - trigger fetch
            onPageChange(page, pageSize);
          } else {
            // Same batch - just update page (client-side pagination)
            onPageChange(page, pageSize);
          }
        } else {
          // Non-STAC: pass through directly
          onPageChange(page, pageSize);
        }
      },
      onShowSizeChange: (_current: number, size: number) => {
        if (onPageSizeChange) {
          onPageSizeChange(size);
        }
      },
    } as TablePaginationConfig,
    expandable: {
      expandedRowRender: renderExpandedRow,
      expandIcon: renderExpandIcon,
    },
    rowSelection: {
      selectedRowKeys: selections?.map((item) => {
        /* istanbul ignore next -- @preserve */
        return item ? item.id : '';
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelect: (_record: any, _selected: any, selectedRows: any) => {
        /* istanbul ignore else -- @preserve */
        if (onRowSelect) {
          onRowSelect(selectedRows as RawSearchResults);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelectAll: (_selected: any, selectedRows: any) => {
        /* istanbul ignore else -- @preserve */
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
    hasData: filteredResults.length > 0,
  };

  const columns: TableColumnsType<RawSearchResult> = [
    {
      align: 'right' as AlignType,
      fixed: 'left' as FixedType,
      title: 'Cart',
      key: 'cart',
      render: (value: unknown, record: RawSearchResult, index: number) => {
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
    {
      align: 'center' as AlignType,
      fixed: 'left' as FixedType,
      title: '',
      dataIndex: 'data_node',
      key: 'node_status',
      render: (data_node: string, record: RawSearchResult) => {
        if (record.isStac) {
          return (
            <Tooltip title="STAC Dataset">
              {createCustomIcon(stacIcon, 'STAC', {
                height: '24px',
                width: '32px',
                marginRight: '0',
              })}
            </Tooltip>
          );
        }
        if (!showStatus) {
          return (
            <Tooltip
              title={
                <>
                  Data Node:<div style={{ fontWeight: 'bold' }}>{data_node}</div>
                </>
              }
            >
              <DatabaseTwoTone />
            </Tooltip>
          );
        }
        return (
          <div className={topDataRowTargets.nodeStatusIcon.class()}>
            <StatusToolTip dataNode={data_node} />
          </div>
        );
      },
    },
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
        const displayTitle = `${title}`;

        if (record && record.retracted) {
          const msg =
            'IMPORTANT! This dataset has been retracted and is no longer available for download.';
          return (
            <div className={topDataRowTargets.datasetTitle.class()}>
              <p>
                <span style={{ textDecoration: 'line-through' }}>{displayTitle}</span>
                <br />
                <span style={{ color: 'red' }}>{msg}</span>
              </p>
            </div>
          );
        }
        return <div className={topDataRowTargets.datasetTitle.class()}>{displayTitle}</div>;
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
      render: (size: number) => {
        return (
          <p className={topDataRowTargets.totalSize.class()}>{size ? formatBytes(size) : 'N/A'}</p>
        );
      },
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
        <p className={topDataRowTargets.versionText.class()}>{version || 'N/A'}</p>
      ),
    },
    window.METAGRID.GLOBUS_NODES.length > 0
      ? {
          align: 'center' as AlignType,
          title: 'Globus Ready',
          dataIndex: 'data_node',
          key: 'globus_enabled',
          width: 110,
          render: (data_node: string, record: RawSearchResult) => {
            if (record.isStac) {
              return (
                <div>
                  <GlobusToolTip
                    dataNode={data_node}
                    stacGlobusAvailable={
                      getStacGlobusHref(record.assets) !== null || record.globusHrefs !== undefined
                    }
                  />
                </div>
              );
            }

            return (
              <div>
                <GlobusToolTip dataNode={data_node} />
              </div>
            );
          },
        }
      : {
          align: 'center' as AlignType,
          fixed: 'right' as FixedType,
          title: '',
          dataIndex: 'data_node',
          key: 'globus_enabled',
          render: () => null,
        },
    {
      align: 'center' as AlignType,
      fixed: 'right' as FixedType,
      title: 'Available Nodes',
      key: 'dataNodes',
      render: (record: RawSearchResult) => {
        // Get the current download selection for this row, default to 'wget'
        const currentDownloadType = downloadSelections[record.id] || 'wget';

        // Get nodes filtered by the selected download type
        const nodes = getNodesListByDownloadType(record, currentDownloadType);

        if (nodes.length < 1) {
          return 'N/A';
        }

        if (nodes.length === 1) {
          return nodes[0];
        }

        // Get the currently selected node or default to the first one
        const currentSelectedNode = selectedNodes[record.id] || nodes[0];

        return (
          <Select
            value={currentSelectedNode}
            disabled={record.retracted === true}
            // className={topDataRowTargets.downloadScriptOptions.class()}
            style={{ width: 200 }}
            onChange={(value: string) => {
              setSelectedNodes((prev) => ({
                ...prev,
                [record.id]: value,
              }));
            }}
            options={nodes.map((dataNode) => {
              return { title: dataNode, value: dataNode };
            })}
          />
        );
      },
    },
    {
      align: 'center' as AlignType,
      fixed: 'right' as FixedType,
      title: 'Download Options',
      key: 'download',
      render: (record: RawSearchResult) => {
        const downloadTypesAvailable: DatasetDownloadTypes[] = ['wget'];

        /* istanbul ignore if -- @preserve */
        if (record.isStac && record.globus_link) {
          downloadTypesAvailable.push('Globus');
        } else if (!record.isStac && record.id) {
          downloadTypesAvailable.push('esgpull');
        }

        const formKey = `download-${record.id}`;
        const currentSelection = downloadSelections[record.id] || downloadTypesAvailable[0];

        return (
          <>
            {contextHolder}
            <Form
              className={topDataRowTargets.downloadScriptForm.class()}
              layout="inline"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              onFinish={({ [formKey]: download }) =>
                handleDownloadForm(record, download as DatasetDownloadTypes)
              }
              initialValues={{ [formKey]: currentSelection }}
            >
              <Form.Item name={formKey}>
                <Select
                  disabled={record.retracted === true}
                  className={topDataRowTargets.downloadScriptOptions.class()}
                  style={{ width: 100 }}
                  value={currentSelection}
                  onChange={(value: DatasetDownloadTypes) => {
                    setDownloadSelections((prev) => ({
                      ...prev,
                      [record.id]: value,
                    }));

                    // Reset selected node to the first available node for the new download type
                    const newNodes = getNodesListByDownloadType(record, value);
                    if (newNodes.length > 0) {
                      setSelectedNodes((prev) => ({
                        ...prev,
                        [record.id]: newNodes[0],
                      }));
                    }
                  }}
                  options={downloadTypesAvailable.map((option) => {
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
                />
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
      dataSource={filteredResults}
      onChange={handleChange}
      rowKey="id"
      size="small"
      scroll={scroll || { x: 'max-content' }}
      tableLayout="auto"
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
