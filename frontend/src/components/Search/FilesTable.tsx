import React from 'react';
import { useAsync, PromiseFn } from 'react-async';
import { DownloadOutlined } from '@ant-design/icons';

import { Form, Select, Table as TableD } from 'antd';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';

import { fetchFiles } from '../../utils/api';
import { parseUrl, formatBytes } from '../../utils/utils';

export type DownloadUrls = {
  downloadType: string | undefined;
  downloadUrl: string | undefined;
}[];

/**
 * Splits the string by a delimiter and pops the last string
 */
export const genDownloadUrls = (urls: string[]): DownloadUrls => {
  const newUrls: DownloadUrls = [];
  urls.forEach((url) => {
    const downloadType = url.split('|').pop();
    const downloadUrl = parseUrl(url, '|');
    newUrls.push({ downloadType, downloadUrl });
  });
  return newUrls;
};
/**
 * Opens the selected download url in a new tab
 */
export const openDownloadUrl = (url: string): Window | null => {
  return window.open(url, '_blank');
};

type Props = {
  id: string;
};

const FilesTable: React.FC<Props> = ({ id }) => {
  const { data, error, isLoading } = useAsync({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promiseFn: (fetchFiles as unknown) as PromiseFn<Record<string, any>>,
    id,
  });

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

  let docs: RawSearchResult[] | [] = [];
  if (data) {
    docs = (data as {
      response: { docs: RawSearchResult[] };
    }).response.docs;
  }

  const columns = [
    {
      title: 'File Title',
      dataIndex: 'title',
      size: 400,
      key: 'title',
    },
    {
      title: 'Checksum',
      dataIndex: 'checksum',
      key: 'checksum',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      width: 100,
      key: 'size',
      render: (size: number) => {
        return formatBytes(size);
      },
    },
    {
      title: 'Download',
      key: 'download',
      width: 200,
      render: (record: { url: string[] }) => {
        const downloadUrls = genDownloadUrls(record.url);

        return (
          <span>
            <Form
              data-testid="download-form"
              layout="inline"
              onFinish={({ download }) => openDownloadUrl(download)}
              initialValues={{ download: downloadUrls[0].downloadUrl }}
            >
              <Form.Item name="download">
                <Select style={{ width: 120 }}>
                  {downloadUrls.map((option) => (
                    <Select.Option
                      key={option.downloadType}
                      value={option.downloadUrl as React.ReactText}
                    >
                      {option.downloadType}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<DownloadOutlined />}
                ></Button>
              </Form.Item>
            </Form>
          </span>
        );
      },
    },
  ];

  return (
    <TableD
      data-testid="filesTable"
      size="small"
      loading={isLoading}
      pagination={{ position: ['bottomCenter'], showSizeChanger: true }}
      columns={columns}
      dataSource={docs}
      rowKey="id"
      scroll={{ y: 300 }}
    />
  );
};

export default FilesTable;
