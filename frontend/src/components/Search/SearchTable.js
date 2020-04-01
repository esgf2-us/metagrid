import React from 'react';
import axios from 'axios';
import { Button, Collapse, Form, Select, Table } from 'antd';
import {
  RightCircleOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  PlusSquareOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Panel } = Collapse;
const { Option } = Select;
const downloadOptions = ['HTTP', 'WGET Script', 'Globus'];

/**
 * Parses urls to remove characters following '|'
 * @param {string} url
 */
function parseUrl(url) {
  return url.split('|')[0];
}

/**
 * Fetches citation data using a dataset's citation url
 * @param {string} url
 * TODO: Get proxy to connect server hosting Citation data using localhost
 */
function fetchCitation(url) {
  axios
    .get(url)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return error;
    });
}

function SearchTable({ loading, results, onSelect, onSelectAll }) {
  SearchTable.propTypes = {
    loading: PropTypes.bool.isRequired,
    results: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSelect: PropTypes.func.isRequired,
    onSelectAll: PropTypes.func.isRequired,
  };

  const tableConfig = {
    size: 'small',
    loading,
    pagination: { position: ['bottomCenter'], showSizeChanger: true },
    expandable: {
      expandedRowRender: (record) => {
        return (
          <>
            <Collapse>
              <Panel header="Citation" key="citation">
                <Button
                  type="link"
                  href={parseUrl(record.xlink[0])}
                  target="_blank"
                >
                  Data Citation Page
                </Button>
                {JSON.stringify(fetchCitation(record.citation_url))}
              </Panel>
              <Panel header="Metadata" key="metadata">
                {Object.keys(record).map((key) => {
                  return (
                    <p key={key} style={{ margin: 0 }}>
                      <span style={{ fontWeight: 'bold' }}>{key}</span>:{' '}
                      {record[key]}
                    </p>
                  );
                })}
              </Panel>
              <Panel header="Files" key="files">
                <pre>
                  <Table></Table>
                </pre>
              </Panel>
            </Collapse>
          </>
        );
      },
      expandIcon: ({ expanded, onExpand, record }) =>
        expanded ? (
          <DownCircleOutlined onClick={(e) => onExpand(record, e)} />
        ) : (
          <RightCircleOutlined onClick={(e) => onExpand(record, e)} />
        ),
    },
    rowSelection: { onSelect, onSelectAll },
    hasData: results.length > 0,
  };

  const columns = [
    {
      title: 'Dataset Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <a href={record.url} rel="noopener noreferrer" target="_blank">
          {title}
        </a>
      ),
    },
    {
      title: '# of Files',
      dataIndex: 'number_of_files',
      key: 'number_of_files',
      render: (number_of_files) => <p>{number_of_files}</p>,
    },
    {
      title: 'Node',
      dataIndex: 'data_node',
      key: 'data_node',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Download',
      key: 'download',
      render: () => (
        <span>
          <Form layout="inline">
            <Form.Item>
              <Select defaultValue="HTTP" style={{ width: 120 }}>
                {downloadOptions.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<DownloadOutlined />} size={12}>
                Download
              </Button>
            </Form.Item>
          </Form>
        </span>
      ),
    },
    {
      title: 'Additional',
      key: 'additional',
      render: (record) => {
        return (
          <>
            <Button
              type="link"
              href={parseUrl(record.xlink[1])}
              target="_blank"
            >
              PID
            </Button>
            <Button
              type="link"
              href={record.further_info_url[0]}
              target="_blank"
            >
              Further Info
            </Button>
          </>
        );
      },
    },
    {
      title: 'Add to Cart',
      key: 'add',
      render: () => (
        <span>
          <PlusSquareOutlined style={{ fontSize: '18px', color: '#08c' }} />
          <ShoppingCartOutlined style={{ fontSize: '32px', color: '#08c' }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <Table
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...tableConfig}
        columns={columns}
        dataSource={tableConfig.hasData ? results : null}
        rowKey="id"
      />
    </div>
  );
}

export default SearchTable;
