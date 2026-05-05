import {
  CopyOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  RightCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Form, Table as TableD, Tooltip, message } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import React from 'react';
import { showError, showNotice } from '../../common/utils';
import Button from '../General/Button';
import { StacAsset } from './types';

export type Props = {
  alternate: { [key: string]: StacAsset };
};

const SubFilesTable: React.FC<React.PropsWithChildren<Props>> = ({ alternate }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const tableConfig = {
    dataSource: Object.values(alternate),
    size: 'small' as SizeType,
    rowKey: 'alternate:name',
    expandable: {
      expandedRowRender: (record: StacAsset) => {
        return (
          <>
            {Object.keys(record).map((key) => {
              if (record[key] && record[key] !== 'null') {
                return (
                  <p key={key} style={{ margin: 0 }}>
                    <span style={{ fontWeight: 'bold' }}>{key}</span>: {JSON.stringify(record[key])}
                  </p>
                );
              }
              return null;
            })}
          </>
        );
      },

      expandIcon: ({
        expanded,
        onExpand,
        record,
      }: {
        expanded: boolean;
        onExpand: (rowRecord: StacAsset, e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
        record: StacAsset;
      }): React.ReactNode =>
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
      title: 'Data Node',
      dataIndex: 'alternate:name',
      key: 'nodeName',
      /* istanbul ignore next -- @preserve */
      render: (nodeName: string) => {
        if (!nodeName || nodeName === '') {
          return <div>N/A</div>;
        }
        return <div>{nodeName}</div>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => {
        return <div>{description}</div>;
      },
    },
    {
      title: 'Download / Copy URL',
      key: 'download',
      render: (record: { href: string }) => {
        return (
          <span style={{ alignItems: 'center' }}>
            {contextHolder}
            <Form layout="inline">
              <Tooltip title="Download the data file via Http." trigger="hover">
                <Form.Item>
                  <Button
                    type="primary"
                    href={record.href}
                    target="_blank"
                    icon={<DownloadOutlined />}
                  />
                </Form.Item>
              </Tooltip>
              <Tooltip title="Copy the HTTP URL to the clipboard." trigger="hover">
                <Form.Item>
                  <Button
                    type="primary"
                    onClick={
                      /* istanbul ignore next -- @preserve */ () => {
                        if (navigator && navigator.clipboard) {
                          navigator.clipboard
                            .writeText(record.href)
                            .catch((e: PromiseRejectedResult) => {
                              showError(messageApi, e.reason as string);
                            });
                          showNotice(messageApi, 'URL copied to clipboard!', {
                            icon: <ShareAltOutlined />,
                          });
                        }
                      }
                    }
                    icon={<CopyOutlined />}
                  />
                </Form.Item>
              </Tooltip>
            </Form>
          </span>
        );
      },
    },
    {
      title: 'File Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        if (!type || type === '') {
          return <div>N/A</div>;
        }
        return <div>{type}</div>;
      },
    },
  ];

  return (
    <TableD
      data-testid="filesTable"
      {...tableConfig}
      columns={columns}
      onRow={(record, rowIndex) => {
        return {
          id: `search-items-row-${rowIndex}`,
          'data-testid': `search-items-row-${rowIndex}`,
        };
      }}
    />
  );
};

export default SubFilesTable;
