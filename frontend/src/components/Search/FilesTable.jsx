import React from 'react';
import { useAsync } from 'react-async';
import { PropTypes } from 'prop-types';
import { DownloadOutlined } from '@ant-design/icons';

import { Form, Select, Table as TableD } from 'antd';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';

import { fetchFiles } from '../../utils/api';
import { parseUrl } from '../../utils/utils';

/**
 * Splits the string by a delimiter and pops the last string
 */
export function genDownloadUrls(urls) {
  const newUrls = [];
  urls.forEach((url) => {
    const downloadType = url.split('|').pop();
    const downloadUrl = parseUrl(url, '|');
    newUrls.push({ downloadType, downloadUrl });
  });
  return newUrls;
}
/**
 * Opens the selected download url in a new tab
 * @param {string} url - The url of the download option
 */
export function openDownloadUrl(url) {
  return window.open(url, '_blank');
}

function FilesTable({ id }) {
  const { data, error, isLoading } = useAsync({
    promiseFn: fetchFiles,
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

  if (data) {
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
      },
      {
        title: 'Download',
        key: 'download',
        width: 200,
        render: (record) => {
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
                        value={option.downloadUrl}
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
                    size={12}
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
        dataSource={data ? data.response.docs : null}
        rowKey="id"
        scroll={{ y: 300 }}
      />
    );
  }
  return null;
}

FilesTable.propTypes = {
  id: PropTypes.string.isRequired,
};

export default FilesTable;
