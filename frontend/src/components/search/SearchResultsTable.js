import React, { useState, useEffect } from "react";
import { Button, Form, Select, Table } from "antd";
import {
  DownloadOutlined,
  PlusSquareOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";
import PropTypes from "prop-types";

const { Option } = Select;
const downloadOptions = ["HTTP", "WGET Script", "Globus"];

const tableConfig = {
  bordered: false,
  loading: false,
  pagination: { position: "bottom-center" },
  size: "small",
  expandable: { expandedRowRender: record => <p>{record.description}</p> },
  title: undefined,
  showHeader: true,
  rowSelection: {},
  scroll: undefined,
  hasData: true,
  tableLayout: undefined
};
const columns = [
  {
    title: "Dataset Title",
    dataIndex: "title",
    key: "title",
    render: title => <a>{title}</a>
  },
  {
    title: "Node",
    dataIndex: "node",
    key: "node"
  },
  {
    title: "Version",
    dataIndex: "version",
    key: "version"
  },
  {
    title: "Download",
    key: "download",
    render: () => (
      <span>
        <Form layout="inline">
          <Form.Item>
            <Select defaultValue="HTTP" style={{ width: 120 }}>
              {downloadOptions.map(option => (
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
    )
  },
  {
    title: "Add to Cart",
    key: "add",
    render: () => (
      <span>
        <PlusSquareOutlined style={{ fontSize: "18px", color: "#08c" }} />
        <ShoppingCartOutlined style={{ fontSize: "32px", color: "#08c" }} />
      </span>
    )
  }
];
function SearchResultsTable({ results }) {
  SearchResultsTable.propTypes = {
    results: PropTypes.array.isRequired
  };

  return (
    <div>
      <Table
        {...tableConfig}
        columns={columns}
        dataSource={tableConfig.hasData ? results : null}
        rowKey="id"
      />
    </div>
  );
}

export default SearchResultsTable;
