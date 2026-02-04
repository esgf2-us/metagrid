import React, { useState } from 'react';
import { Button, Card, Modal } from 'antd';
import CloudDownloadOutlined from '@ant-design/icons/lib/icons/CloudDownloadOutlined';
import WarningOutlined from '@ant-design/icons/lib/icons/WarningOutlined';
import DatasetDownload from './DatasetDownload';
import { StacSearchResponse } from '../Search/types';
import { getDownloadSizeFromSTACsearch, getFileCountFromSTACsearch } from '../../common/STAC';
import { formatBytes } from '../../common/utils';

// Threshold for showing large download warning
export const LARGE_DOWNLOAD_WARNING_THRESHOLD = 10000;

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
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  let fileCount = 0;
  let totalFileSize = 0;

  if (stacResults && stacResults.features) {
    fileCount = getFileCountFromSTACsearch(stacResults.features);
    totalFileSize = getDownloadSizeFromSTACsearch(stacResults.features);
  }

  const showWarning = fileCount >= LARGE_DOWNLOAD_WARNING_THRESHOLD && !warningAcknowledged;

  const handleProceed = () => {
    setWarningAcknowledged(true);
  };

  const handleCancel = () => {
    setWarningAcknowledged(false);
    hide();
  };

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
          <p style={{ fontSize: '16px' }}>
            <b>
              Download all {fileCount.toLocaleString()} files from your search results (bypasses
              cart).
            </b>
          </p>
          <div
            style={{
              padding: '8px',
              marginBottom: '12px',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <div>
              ⓘ Estimated size: <b>{formatBytes(totalFileSize)}</b>
              <br />
              <i>Note: Actual results may vary based on data availability.</i>
            </div>
          </div>
          {showWarning ? (
            <Card
              style={{
                border: '2px solid #faad14',
                marginBottom: '16px',
              }}
              data-testid="largeDownloadWarning"
            >
              <div style={{ fontSize: '16px' }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                <b>Large Download Warning</b>
              </div>
              <p style={{ marginTop: '12px', fontSize: '14px' }}>
                You are about to download {fileCount.toLocaleString()} files (
                {formatBytes(totalFileSize)}). This is a very large download that may take
                significant time and resources.
              </p>
              <p style={{ fontSize: '14px' }}>
                Are you sure you want to proceed with this download?
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Button type="primary" onClick={handleProceed} data-testid="proceedButton">
                  Yes, Proceed
                </Button>
                <Button onClick={handleCancel} data-testid="cancelButton">
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <DatasetDownload
              searchURL={searchURL}
              stacResults={stacResults}
              onDownloadFinish={hide}
            />
          )}
        </Card>
      </div>
    </Modal>
  );
};

export default DownloadModal;
