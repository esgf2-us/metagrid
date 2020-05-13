import React from 'react';
import { AutoComplete, Collapse, Form, Select, Table as TableD } from 'antd';
import {
  RightCircleOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import PropTypes from 'prop-types';

import Citation from './Citation';
import FilesTable from './FilesTable';
import Button from '../General/Button';
import Divider from '../General/Divider';

import { hasKey, parseUrl } from '../../utils/utils';

import './Search.css';

function Table({
  loading,
  results,
  totalResults,
  cart,
  handleCart,
  handlePagination,
  handlePageSizeChange,
  onSelect,
}) {
  const tableConfig = {
    size: 'small',
    loading,
    pagination: {
      total: totalResults,
      position: ['bottomCenter'],
      showSizeChanger: true,
      onChange: (page, pageSize) => handlePagination(page, pageSize),
      onShowSizeChange: (_current, size) => handlePageSizeChange(size),
    },
    expandable: {
      expandedRowRender: (record) => {
        const metaData = Object.entries(record).map(([k, v]) => ({
          value: `${k}: ${v}`,
        }));
        return (
          <>
            <Collapse>
              {hasKey(record, 'citation_url') && (
                <Collapse.Panel header="Citation" key="citation">
                  <Citation url={record.citation_url[0]} />
                </Collapse.Panel>
              )}

              <Collapse.Panel
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
              </Collapse.Panel>
              <Collapse.Panel header="Files" key="files">
                <FilesTable id={record.id} />
              </Collapse.Panel>
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

  tableConfig.expandable.expandIcon.propTypes = {
    expanded: PropTypes.bool.isRequired,
    onExpand: PropTypes.func.isRequired,
    record: PropTypes.objectOf(PropTypes.string).isRequired,
  };

  const columns = [
    {
      title: 'Dataset Title',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      render: (title, record) => {
        return (
          // eslint-disable-next-line react/prop-types
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
              {/* eslint-disable-next-line react/prop-types */}
              <Select defaultValue={record.access[0]} style={{ width: 120 }}>
                {/* eslint-disable-next-line react/prop-types */}
                {record.access.map((option) => (
                  <Select.Option key={option} value={option}>
                    {option}
                  </Select.Option>
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
                // eslint-disable-next-line react/prop-types
                href={parseUrl(record.xlink[1], '|')}
                target="_blank"
              >
                PID
              </Button>
            )}
            {hasKey(record, 'further_info_url') && (
              <Button
                type="link"
                // eslint-disable-next-line react/prop-types
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
      <TableD
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...tableConfig}
        columns={columns}
        dataSource={tableConfig.hasData ? results : null}
        rowKey="id"
        scroll={{ y: 625 }}
      />
    </div>
  );
}

Table.propTypes = {
  loading: PropTypes.bool.isRequired,
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
  totalResults: PropTypes.number.isRequired,
  cart: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleCart: PropTypes.func.isRequired,
  handlePagination: PropTypes.func.isRequired,
  handlePageSizeChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
};

Table.defaultProps = {
  onSelect: undefined,
};

export default Table;
