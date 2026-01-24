import React from 'react';
import { Card, Modal } from 'antd';
import CloudDownloadOutlined from '@ant-design/icons/lib/icons/CloudDownloadOutlined';
import DatasetDownload from './DatasetDownload';

interface DownloadModalProps {
  show: boolean;
  hide: () => void;
}

const DownloadModal = ({ show, hide }: DownloadModalProps): React.ReactElement => {
  return (
    <Modal
      title={
        <h1>
          <CloudDownloadOutlined /> Download Search Results
        </h1>
      }
      open={show}
      okText="Download All"
      onOk={() => {
        hide();
      }}
      cancelText="Cancel Download"
      onCancel={() => {
        hide();
      }}
      width={800}
    >
      <div data-testid="downloadModalForm">
        <Card>
          <DatasetDownload />
        </Card>
      </div>
    </Modal>
  );
};

export default DownloadModal;
