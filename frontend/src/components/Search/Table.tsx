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
import qualityFlagsImg from '../../assets/img/climate_indicators_table.png';
import { CSSinJS } from '../../common/types';
import {
  formatBytes,
  objectHasKey,
  splitStringByChar,
} from '../../common/utils';
import { UserCart } from '../Cart/types';
import Popover from '../DataDisplay/Popover';
import ToolTip from '../DataDisplay/ToolTip';
import Button from '../General/Button';
import Divider from '../General/Divider';
import StatusToolTip from '../NodeStatus/StatusToolTip';
import { NodeStatusArray } from '../NodeStatus/types';
import Citation from './Citation';
import FilesTable from './FilesTable';
import './Search.css';
import { RawSearchResult, RawSearchResults, TextInputs } from './types';

const styles: CSSinJS = {
  qualityFlagsRow: { display: 'flex' },
  flagColorBox: {
    width: '16px',
    height: '16px',
    backgroundColor: '#ccc',
    border: '1px',
    borderStyle: 'solid',
    borderColor: '#666',
    margin: '2px',
  },
};

export type QualityFlagProps = { index: string; color: string };

export const QualityFlag: React.FC<QualityFlagProps> = ({ index, color }) => {
  return (
    <div
      data-testid={`qualityFlag${index}`}
      style={{ ...styles.flagColorBox, backgroundColor: color }}
    ></div>
  );
};

export type Props = {
  loading: boolean;
  canDisableRows?: boolean;
  results: RawSearchResults | [];
  totalResults?: number;
  userCart: UserCart | [];
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
  nodeStatus,
  filenameVars,
  onUpdateCart,
  onRowSelect,
  onPageChange,
  onPageSizeChange,
}) => {
  // Add options to this constant as needed.
  type DatasetDownloadTypes = 'wget' | 'Globus';
  // This variable populates the download drop downs and is used in conditionals.
  // TODO: Add 'Globus' during Globus integration process.
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
      expandedRowRender: (record: RawSearchResult) => {
        const metaData = Object.entries(record).map(([k, v]) => ({
          value: `${k}: ${v as string}`,
        }));

        return (
          <>
            <Collapse>
              {objectHasKey(record, 'citation_url') && (
                <Collapse.Panel
                  collapsible="header"
                  header="Citation"
                  key="citation"
                >
                  <Citation
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    url={record.citation_url![0]}
                  />
                </Collapse.Panel>
              )}

              <Collapse.Panel
                collapsible="header"
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
              <Collapse.Panel collapsible="header" header="Files" key="files">
                <FilesTable
                  id={record.id}
                  numResults={record.number_of_files}
                  filenameVars={filenameVars}
                />
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
          <ToolTip
            title="View this dataset's citation, metadata, and files"
            trigger="hover"
          >
            <RightCircleOutlined onClick={(e) => onExpand(record, e)} />
          </ToolTip>
        ),
    },
    rowSelection: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelect: (_record: any, _selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (onRowSelect) {
          onRowSelect(selectedRows);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelectAll: (_selected: any, selectedRows: any) => {
        /* istanbul ignore else */
        if (onRowSelect) {
          onRowSelect(selectedRows);
        }
      },
      getCheckboxProps: (record: RawSearchResult) => ({
        disabled:
          canDisableRows && userCart.some((item) => item.id === record.id),
      }),
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
      width: 225,
      render: (data_node: string) => (
        <StatusToolTip nodeStatus={nodeStatus} dataNode={data_node} />
      ),
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
        const { id } = record;

        // Unique key for the download form item
        const formKey = `download-${id}`;
        let globusCompatible = false;
        record.access.forEach((download) => {
          if (download === 'Globus') {
            globusCompatible = true;
            allowedDownloadTypes.push('Globus');
          }
        });

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
            {/* TODO: Remove display styling when Globus is integrated*/}
            <p style={{ display: 'none' }}>
              {globusCompatible ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : (
                <CloseCircleTwoTone twoToneColor="#eb2f96" />
              )}{' '}
              Globus Compatible
            </p>
            <Form
              layout="inline"
              onFinish={({ [formKey]: download }) =>
                handleDownloadForm(download)
              }
              initialValues={{ [formKey]: allowedDownloadTypes[0] }}
            >
              <Form.Item name={formKey}>
                <Select style={{ width: 120 }}>
                  {allowedDownloadTypes.map((option) => (
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
        // Have to parse and format since 'xlink' attribute is
        // poorly structured in the Search API
        const xlinkTypesToOutput: Record<
          string,
          { label: string; url: null | string }
        > = {
          pid: { label: 'PID', url: null },
          // Some technical notes are published as "summary"
          summary: { label: 'Technical Notes', url: null },
          supdata: { label: 'Supplemental Data', url: null },
          'Tech Note': { label: 'Technical Notes', url: null },
        };
        /* istanbul ignore else */
        if (objectHasKey(record, 'xlink')) {
          const { xlink } = record;

          (xlink as string[]).forEach((link) => {
            const [url, , linkType] = splitStringByChar(link, '|') as string[];

            if (Object.keys(xlinkTypesToOutput).includes(linkType)) {
              xlinkTypesToOutput[linkType].url = url;
            }
          });
        }

        // Have to parse and format since 'quality_control_flags' attribute is
        // poorly structured in the Search API
        const qualityFlags: Record<string, string> = {};
        /* istanbul ignore else */
        if (objectHasKey(record, 'quality_control_flags')) {
          const { quality_control_flags: qcFlags } = record;

          (qcFlags as string[]).forEach((flag) => {
            const [, key, color] = splitStringByChar(flag, ':') as string[];
            // Sometimes colors are snakecase, such as 'light_gray'
            qualityFlags[key] = color.replace('_', '');
          });
        }

        return (
          <>
            {Object.keys(xlinkTypesToOutput).map((linkType) => {
              const { label, url } = xlinkTypesToOutput[linkType];

              if (url) {
                return (
                  <Button type="link" href={url} target="_blank" key={label}>
                    <span>{label}</span>
                  </Button>
                );
              }
              return null;
            })}

            {/* Records may return "further_info_url": [''], which indicates no available URLs */}
            {objectHasKey(record, 'further_info_url') &&
              ((record.further_info_url as unknown) as string)[0] !== '' && (
                <Button
                  type="link"
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  href={record.further_info_url![0]}
                  target="_blank"
                >
                  ES-DOC
                </Button>
              )}

            {Object.keys(qualityFlags).length > 0 && (
              <Button
                type="link"
                href="https://esgf-node.llnl.gov/projects/obs4mips/DatasetIndicators"
                target="_blank"
              >
                <Popover
                  content={
                    <img
                      src={qualityFlagsImg}
                      alt="Quality Flags Indicator"
                    ></img>
                  }
                >
                  <span style={styles.qualityFlagsRow}>
                    {Object.keys(qualityFlags).map((key) => (
                      <QualityFlag
                        index={key}
                        color={qualityFlags[key]}
                        key={key}
                      />
                    ))}
                  </span>
                </Popover>
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
        if (
          userCart.some((dataset: RawSearchResult) => dataset.id === record.id)
        ) {
          return (
            <>
              <Button
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
              icon={<PlusOutlined />}
              onClick={() => onUpdateCart([record], 'add')}
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
