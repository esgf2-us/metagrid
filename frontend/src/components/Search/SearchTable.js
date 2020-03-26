import React from "react";
import { Button, Form, Select, Table } from "antd";
import {
  DownloadOutlined,
  PlusSquareOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";
import PropTypes from "prop-types";

const { Option } = Select;
const downloadOptions = ["HTTP", "WGET Script", "Globus"];

function SearchTable({ loading, results, onSelect, onSelectAll }) {
  SearchTable.propTypes = {
    loading: PropTypes.bool.isRequired,
    results: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSelec: PropTypes.func.isRequired
  };

  const tableConfig = {
    size: "small",
    loading: loading,
    pagination: { position: "bottom" },
    expandable: {
      expandedRowRender: record => {
        return (
          <React.Fragment>
            <p>{record.description}</p>
            <Table></Table>
          </React.Fragment>
        );
      }
    },
    rowSelection: { onSelect: onSelect, onSelectAll: onSelectAll },
    hasData: results.length > 0 ? true : false,
  };

  const columns = [
    {
      title: "Dataset Title",
      dataIndex: "title",
      key: "title",
      render: title => <a href={title}>{title}</a>
    },
    {
      title: "# of Files",
      dataIndex: "files",
      key: "metadata",
      render: () => <p>0</p>
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

export default SearchTable;
