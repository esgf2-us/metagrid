import React from 'react';
import PropTypes from 'prop-types';
import { Divider, Form, Select } from 'antd';
import { DownloadOutlined, ShoppingCartOutlined } from '@ant-design/icons';

import Button from '../General/Button';

const { Option } = Select;

function Summary({ numItems }) {
  const [form] = Form.useForm();
  const downloadOptions = ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'];

  /**
   * Handles when the user selects to download their cart
   * TODO: Implement function
   * @param {*} values
   */
  const handleOnFinish = (values) => {
    return values;
  };

  return (
    <div data-testid="summary">
      <ShoppingCartOutlined style={{ fontSize: '4rem' }} />
      <h1>Data Cart Summary</h1>
      <Divider />
      <h1>
        Number of Files: <span style={{ float: 'right' }}>{numItems}</span>
      </h1>
      <h1>
        Total File Size: <span style={{ float: 'right' }}>N/A</span>
      </h1>
      <Divider />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => handleOnFinish(values)}
        initialValues={{
          download: downloadOptions[0],
        }}
      >
        <Form.Item name="download">
          <Select style={{ width: 120 }}>
            {/* eslint-disable-next-line react/prop-types */}
            {downloadOptions.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
            /
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<DownloadOutlined />}>
            Download
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

Summary.propTypes = {
  numItems: PropTypes.number,
};

Summary.defaultProps = {
  numItems: 0,
};

export default Summary;
