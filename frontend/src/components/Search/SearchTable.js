import React from 'react';
import {
  Button,
  AutoComplete,
  Collapse,
  Divider,
  Form,
  Select,
  Table,
} from 'antd';
import {
  RightCircleOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import PropTypes from 'prop-types';

import './Search.css';

const { Panel } = Collapse;
const { Option } = Select;

/** Parses urls to remove characters following the specified character
 * @param {string} url
 * @param {string} char
 */
function parseUrl(url, char) {
  return url.split(char)[0];
}

/**
 * Checks if the specified key is in the object
 * @param {object} obj
 * @param {string} key
 */
function hasKey(obj, key) {
  return obj ? hasOwnProperty.call(obj, key) : false;
}

function SearchTable({ loading, results, cart, handleCart, onSelect }) {
  SearchTable.propTypes = {
    loading: PropTypes.bool.isRequired,
    results: PropTypes.arrayOf(PropTypes.object).isRequired,
    cart: PropTypes.arrayOf(PropTypes.object).isRequired,
    handleCart: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
  };

  // Table Component configuration
  // TODO: Refactor Collapse and Panel into separate components
  const tableConfig = {
    size: 'small',
    loading,
    pagination: { position: ['bottomCenter'], showSizeChanger: true },
    expandable: {
      expandedRowRender: (record) => {
        const recordArray = Object.entries(record).map(([k, v]) => ({
          value: `${k}: ${v}`,
        }));
        return (
          <>
            <Collapse>
              {hasKey(record, 'citation_url') && (
                <Panel header="Citation" key="citation">
                  <Button
                    type="link"
                    href={parseUrl(record.citation_url[0], '.json')}
                    target="_blank"
                  >
                    Data Citation Page
                  </Button>
                  {/* TODO: Add proper display of citation once API is resolved */}
                </Panel>
              )}

              <Panel className="metadata" header="Metadata" key="metadata">
                <h4>Displaying {Object.keys(record).length} keys</h4>
                <AutoComplete
                  style={{ width: '100%' }}
                  options={recordArray}
                  placeholder="Lookup a key..."
                  filterOption={(inputValue, option) =>
                    option.value
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
    rowSelection: {
      getCheckboxProps: (record) =>
        cart.includes(record, 0) ? { disabled: true } : { disabled: false },
      onSelect,
      onSelectAll: onSelect,
    },
    hasData: results.length > 0,
  };

  const columns = [
    {
      title: 'Dataset Title',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      render: (title, record) => {
        return (
          <a href={record.url} rel="noopener noreferrer" target="_blank">
            {title}
          </a>
        );
      },
    },
    {
      title: '# of Files',
      dataIndex: 'number_of_files',
      key: 'number_of_files',
      width: 100,
      render: (numberOfFiles) => <p>{numberOfFiles}</p>,
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
      render: (record) => (
        <span>
          <Form layout="inline">
            <Form.Item>
              <Select defaultValue={record.access[0]} style={{ width: 120 }}>
                {record.access.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size={12}
              ></Button>
            </Form.Item>
          </Form>
        </span>
      ),
    },
    {
      title: 'Additional',
      key: 'additional',
      width: 200,
      render: (record) => {
        return (
          <>
            {hasKey(record, 'xlink') && (
              <Button
                type="link"
                href={parseUrl(record.xlink[1], '|')}
                target="_blank"
              >
                PID
              </Button>
            )}
            {hasKey(record, 'further_info_url') && (
              <Button
                type="link"
                href={record.further_info_url[0]}
                target="_blank"
              >
                Further Info
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
      render: (record) => {
        if (cart.includes(record, 0)) {
          return (
            <>
              <Button
                type="danger"
                icon={<MinusOutlined />}
                size={12}
                onClick={() => handleCart([record], 'remove')}
              />
            </>
          );
        }
        return (
          <>
            <Button
              type="default"
              icon={<PlusOutlined />}
              size={12}
              onClick={() => handleCart([record], 'add')}
            />
          </>
        );
      },
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
        scroll={{ y: 500 }}
      />
    </div>
  );
}

export default SearchTable;
