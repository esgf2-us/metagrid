import React from 'react';
import { Card, Modal } from 'antd';
import CloudDownloadOutlined from '@ant-design/icons/lib/icons/CloudDownloadOutlined';
import DatasetDownload from './DatasetDownload';
import { StacSearchResponse } from '../Search/types';
import { getDownloadSizeFromSTACsearch, getFileCountFromSTACsearch } from '../../common/STAC';
import { formatBytes } from '../../common/utils';

interface DownloadModalProps {
  show: boolean;
  hide: () => void;
  searchURL: string;
  stacResults: StacSearchResponse;
}

const DownloadModal = ({
  show,
  hide,
  searchURL,
  stacResults,
}: DownloadModalProps): React.ReactElement => {
  let fileCount = 0;
  let totalFileSize = 0;

  if (stacResults && stacResults.features) {
    fileCount = getFileCountFromSTACsearch(stacResults.features);
    totalFileSize = getDownloadSizeFromSTACsearch(stacResults.features);
  }

  return (
    <Modal
      title={
        <>
          <CloudDownloadOutlined /> Download Search Results
        </>
      }
      onCancel={hide}
      open={show}
      footer={null}
      width={800}
    >
      <div data-testid="downloadModalForm">
        <Card>
          <h3>Total File Count: {fileCount.toLocaleString()}</h3>
          <h3>Total Files Size: {formatBytes(totalFileSize)}</h3>
          <DatasetDownload
            searchURL={searchURL}
            stacResults={stacResults}
            onDownloadFinish={hide}
          />
        </Card>
      </div>
    </Modal>
  );
};

export default DownloadModal;
