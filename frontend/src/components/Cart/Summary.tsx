import React from 'react';
import { Divider, Form, Select } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

import Button from '../General/Button';

import cartImg from '../../assets/img/cart.svg';
import dataImg from '../../assets/img/data.svg';
import folderImg from '../../assets/img/folder.svg';

const styles = {
  headerContainer: { display: 'flex', justifyContent: 'center' },
  summaryHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
  } as React.CSSProperties,
  image: { margin: '1em', width: '25%' },
  statistic: { float: 'right' } as React.CSSProperties,
};

export type Props = {
  numItems: number;
  numFiles: number;
};

const Summary: React.FC<Props> = ({ numItems, numFiles }) => {
  const [form] = Form.useForm();
  const downloadOptions = ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'];

  return (
    <div data-testid="summary">
      <div style={styles.headerContainer}>
        <img style={styles.image} src={cartImg} alt="Cart" />
        <img style={styles.image} src={folderImg} alt="Folder" />
      </div>

      <h1 style={styles.summaryHeader}>Your Cart Summary</h1>

      <Divider />
      <h1>
        Number of Datasets: <span style={styles.statistic}>{numItems}</span>
      </h1>
      <h1>
        Number of Files: <span style={styles.statistic}>{numFiles}</span>
      </h1>
      <h1>
        Total File Size: <span style={styles.statistic}>N/A</span>
      </h1>
      <Divider />
      <div style={styles.headerContainer}>
        <img style={styles.image} src={dataImg} alt="Data" />
      </div>
      <h1 style={styles.summaryHeader}>Download Your Cart</h1>
      <p>
        Download speeds will vary based on your bandwidth and distance from the
        data node serving the file(s)
      </p>
      <Form
        form={form}
        layout="inline"
        initialValues={{
          download: downloadOptions[0],
        }}
      >
        <Form.Item name="download">
          <Select style={{ width: 235 }}>
            {downloadOptions.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
            /
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
    </div>
  );
};

export default Summary;
