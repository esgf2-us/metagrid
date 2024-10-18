/* eslint-disable no-void */
import {
  CopyOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  RightCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Alert, Form, Table as TableD, Tooltip, message } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig } from 'antd/lib/table';
import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import { fetchDatasetFiles, openDownloadURL } from '../../api';
import { innerDataRowTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import {
  formatBytes,
  showError,
  showNotice,
  splitStringByChar,
} from '../../common/utils';
import Button from '../General/Button';
import {
  Pagination,
  RawSearchResult,
  RawSearchResults,
  TextInputs,
} from './types';

export type DownloadUrls = {
  HTTPServer: string;
  OPENDAP: string;
};

const styles: CSSinJS = {
  bodySider: {
    background: '#fff',
    padding: '12px 12px 12px 12px',
    width: '384px',
    marginRight: '2px',
    boxShadow: '2px 0 4px 0 rgba(0, 0, 0, 0.2)',
  },
  bodyContent: { padding: '12px 12px', margin: 0 },
  messageAddIcon: { color: '#90EE90' },
  messageRemoveIcon: { color: '#ff0000' },
};

/**
 * Splits the string by a delimiter and pops the last string
 */
export const genDownloadUrls = (urls: string[]): DownloadUrls => {
  const newUrls: DownloadUrls = { HTTPServer: '', OPENDAP: '' };
  urls.forEach((url) => {
    const downloadType = url.split('|').pop();
    let downloadUrl = splitStringByChar(url, '|', '0') as string;

    // Chrome blocks Mixed Content (HTTPS to HTTP) downloads and the index
    // serves HTTP links
    // https://blog.chromium.org/2020/02/protecting-users-from-insecure.html
    if (downloadType === 'HTTPServer') {
      if (!downloadUrl.includes('https')) {
        downloadUrl = downloadUrl.replace('http', 'https');
      }
      newUrls.HTTPServer = downloadUrl;
    }

    if (downloadType === 'OPENDAP') {
      downloadUrl = downloadUrl.replace(
        /(\.dods\.nc|\.nc\.dods|\.nc\.html|\.dods\.html|\.dods)/g,
        '.nc'
      );
      newUrls.OPENDAP = downloadUrl;
    }
  });
  return newUrls;
};
export type Props = {
  id: string;
  numResults?: number;
  filenameVars?: TextInputs | [];
};

const FilesTable: React.FC<React.PropsWithChildren<Props>> = ({
  id,
  numResults = 0,
  filenameVars,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  // Add options to this constant as needed.
  // This variable populates the download drop downs and is used in conditionals.
  const metadataKeysToDisplay = [
    'cf_standard_name',
    'checksum_type',
    'dataset_id',
    'id',
    'instance_id',
    'master_id',
    'timestamp',
    'variable',
    'variable_id',
    'variable_long_name',
    'variable_units',
    'version',
  ];

  const [paginationOptions, setPaginationOptions] = React.useState<Pagination>({
    page: 1,
    pageSize: 10,
  });

  const { data, error, isLoading, run: runFetchDatasetFiles } = useAsync({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deferFn: (fetchDatasetFiles as unknown) as DeferFn<Record<string, any>>,
    id,
    paginationOptions,
    filenameVars,
  });

  React.useEffect(() => {
    runFetchDatasetFiles();
  }, [runFetchDatasetFiles, id, paginationOptions, filenameVars]);

  const handlePageChange = (page: number, pageSize: number): void => {
    setPaginationOptions({ page, pageSize });
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

  if (error) {
    return (
      <Alert
        message="Error"
        description="There was an issue fetching files for this dataset. Please contact support for assistance or try again later."
        type="error"
        showIcon
      />
    );
  }

  let docs: RawSearchResults | [] = [];
  if (data) {
    docs = (data as {
      response: { docs: RawSearchResults };
    }).response.docs;
  }

  const tableConfig = {
    dataSource: docs,
    size: 'small' as SizeType,
    loading: isLoading,
    rowKey: 'id',
    scroll: { y: 1000 },
    pagination: {
      total: numResults,
      position: ['bottomCenter'],
      showSizeChanger: true,
      onChange: (page: number, pageSize: number) =>
        handlePageChange(page, pageSize),
      onShowSizeChange: (_current: number, size: number) =>
        handlePageSizeChange(size),
    } as TablePaginationConfig,
    expandable: {
      expandedRowRender: (record: RawSearchResult) =>
        Object.keys(record).map((key) => {
          if (metadataKeysToDisplay.includes(key)) {
            return (
              <p key={key} style={{ margin: 0 }}>
                <span style={{ fontWeight: 'bold' }}>{key}</span>: {record[key]}
              </p>
            );
          }
          return null;
        }),

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
          <Tooltip title="View this file's metadata" trigger="hover">
            <RightCircleOutlined onClick={(e) => onExpand(record, e)} />
          </Tooltip>
        ),
    },
  };

  const columns = [
    {
      title: 'File Title',
      dataIndex: 'title',
      size: 400,
      key: 'title',
      render: (title: string) => {
        return (
          <div className={innerDataRowTargets.filesTitle.class()}>{title}</div>
        );
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      width: 100,
      key: 'size',
      render: (size: number) => {
        return (
          <div className={innerDataRowTargets.dataSize.class()}>
            {formatBytes(size)}
          </div>
        );
      },
    },
    {
      title: 'Download / Copy URL',
      key: 'download',
      width: 200,
      render: (record: { url: string[] }) => {
        const downloadUrls = genDownloadUrls(record.url);
        return (
          <span>
            {contextHolder}
            <Form
              layout="inline"
              onFinish={() => openDownloadURL(downloadUrls.HTTPServer)}
              initialValues={{ download: downloadUrls.HTTPServer }}
            >
              <Tooltip title="Download the data file via Http." trigger="hover">
                <Form.Item
                  className={innerDataRowTargets.downloadDataBtn.class()}
                >
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<DownloadOutlined />}
                  ></Button>
                </Form.Item>
              </Tooltip>
              {downloadUrls.OPENDAP !== '' && (
                <Tooltip
                  title="Copy a shareable OPENDAP URL to the clipboard."
                  trigger="hover"
                >
                  <Form.Item className={innerDataRowTargets.copyUrlBtn.class()}>
                    <Button
                      type="primary"
                      onClick={() => {
                        /* istanbul ignore next */
                        if (navigator && navigator.clipboard) {
                          void navigator.clipboard
                            .writeText(downloadUrls.OPENDAP)
                            .catch((e: PromiseRejectedResult) => {
                              showError(messageApi, e.reason as string);
                            });
                          showNotice(
                            messageApi,
                            'OPENDAP URL copied to clipboard!',
                            {
                              icon: (
                                <ShareAltOutlined
                                  style={styles.messageAddIcon}
                                />
                              ),
                            }
                          );
                        }
                      }}
                      icon={<CopyOutlined />}
                    ></Button>
                  </Form.Item>
                </Tooltip>
              )}
            </Form>
          </span>
        );
      },
    },
    {
      title: 'Checksum',
      dataIndex: 'checksum',
      key: 'checksum',
      render: (checksum: string) => {
        return (
          <div className={innerDataRowTargets.checksum.class()}>{checksum}</div>
        );
      },
    },
  ];

  return <TableD data-testid="filesTable" {...tableConfig} columns={columns} />;
};

export default FilesTable;
