import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, Spin } from 'antd';
import CloudDownloadOutlined from '@ant-design/icons/lib/icons/CloudDownloadOutlined';
import WarningOutlined from '@ant-design/icons/lib/icons/WarningOutlined';
import DatasetDownload from './DatasetDownload';
import { ActiveSearchQuery, StacSearchResponse } from '../Search/types';
import {
  getDownloadSizeFromSTACsearch,
  getFileCountFromSTACsearch,
  convertSearchParamsIntoStacFilter,
  getStacProject,
} from '../../common/STAC';
import { formatBytes } from '../../common/utils';
import { postSTACSearch } from '../../api';

// Threshold for showing large download warning
export const LARGE_DOWNLOAD_WARNING_THRESHOLD = 10000;

interface DownloadModalProps {
  show: boolean;
  hide: () => void;
  searchURL: string;
  stacResults: StacSearchResponse;
  totalMatched: number;
  activeSearchQuery: ActiveSearchQuery;
}

const DownloadModal = ({
  show,
  hide,
  searchURL,
  stacResults,
  totalMatched,
  activeSearchQuery,
}: DownloadModalProps): React.ReactElement => {
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [loadingAllResults, setLoadingAllResults] = useState(false);
  const [allResults, setAllResults] = useState<StacSearchResponse | null>(null);
  const [loadWarningAcknowledged, setLoadWarningAcknowledged] = useState(false);

  // Reset state when modal is closed
  useEffect(() => {
    if (!show) {
      setWarningAcknowledged(false);
      setLoadingAllResults(false);
      setAllResults(null);
      setLoadWarningAcknowledged(false);
    }
  }, [show]);

  // Fetch all results function - defined before useEffect that calls it
  const handleFetchAllResults = React.useCallback(async () => {
    setLoadingAllResults(true);

    try {
      const projectName = activeSearchQuery.project.projectName as string;
      const filter = convertSearchParamsIntoStacFilter(searchURL, getStacProject(projectName));

      const query = new URLSearchParams(searchURL).get('query');
      let textInputs: string[] | undefined;

      if (query && query !== '*') {
        textInputs = query.split(',');
      }

      // Fetch all results by setting limit to totalMatched
      const response = await postSTACSearch(projectName, totalMatched, filter, textInputs);

      setAllResults(response as StacSearchResponse);
    } catch (error) {
      /* istanbul ignore next -- @preserve */
      // eslint-disable-next-line no-console
      console.error('Error fetching all results:', error);
      // On error, fall back to using the partial results
      setAllResults(stacResults);
    } finally {
      setLoadingAllResults(false);
    }
  }, [activeSearchQuery, searchURL, totalMatched, stacResults]);

  // Automatically fetch all results when modal opens (for <= 1000 results) or after warning acknowledged
  useEffect(() => {
    if (show && !allResults && !loadingAllResults) {
      // If <= 1000 results, fetch immediately without warning
      if (totalMatched <= 1000) {
        handleFetchAllResults();
      }
      // If > 1000 results and warning acknowledged, fetch
      else if (loadWarningAcknowledged) {
        handleFetchAllResults();
      }
    }
  }, [
    show,
    loadWarningAcknowledged,
    allResults,
    loadingAllResults,
    totalMatched,
    handleFetchAllResults,
  ]);

  // Only calculate file count and size after all results are loaded
  let fileCount = 0;
  let totalFileSize = 0;

  if (allResults && allResults.features) {
    fileCount = getFileCountFromSTACsearch(allResults.features);
    totalFileSize = getDownloadSizeFromSTACsearch(allResults.features);
  }

  const showLargeDownloadWarning =
    fileCount >= LARGE_DOWNLOAD_WARNING_THRESHOLD && !warningAcknowledged && allResults !== null;
  const showLoadWarning = totalMatched > 1000 && !loadWarningAcknowledged;

  const handleProceed = () => {
    setWarningAcknowledged(true);
  };

  const handleProceedLoad = () => {
    setLoadWarningAcknowledged(true);
  };

  const handleCancel = () => {
    setWarningAcknowledged(false);
    setLoadWarningAcknowledged(false);
    setAllResults(null);
    hide();
  };

  return (
    <Modal
      title={
        <>
          <CloudDownloadOutlined /> Download Search Results
        </>
      }
      onCancel={handleCancel}
      open={show}
      footer={null}
      width={800}
    >
      <div data-testid="downloadModalForm">
        <Spin spinning={loadingAllResults} tip="Loading search results...">
          <Card>
            {!showLoadWarning && (
              <div>
                <p style={{ fontSize: '16px' }}>
                  <b>
                    Download all {allResults ? fileCount.toLocaleString() : ''} files from your
                    search results (bypasses cart).
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
                    ⓘ Estimated size: <b>{allResults ? formatBytes(totalFileSize) : 'unknown'}</b>
                    <br />
                    <i>Note: Actual results may vary based on data availability.</i>
                  </div>
                </div>
              </div>
            )}
            {showLoadWarning && (
              <Card
                style={{
                  border: '2px solid #faad14',
                  marginBottom: '16px',
                }}
                data-testid="loadWarning"
              >
                <div style={{ fontSize: '16px' }}>
                  <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                  <b>Large Result Set</b>
                </div>
                <p style={{ marginTop: '12px', fontSize: '14px' }}>
                  You have {totalMatched.toLocaleString()} results in your search. Loading all
                  results may take a while.
                </p>
                <p style={{ fontSize: '14px' }}>
                  Would you like to proceed with loading all results?
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <Button
                    type="primary"
                    onClick={handleProceedLoad}
                    data-testid="proceedLoadButton"
                  >
                    Proceed
                  </Button>
                  <Button onClick={handleCancel} data-testid="cancelButton">
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            {!showLoadWarning && showLargeDownloadWarning && (
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
            )}
            {!showLoadWarning && !showLargeDownloadWarning && allResults && (
              <DatasetDownload
                searchURL={searchURL}
                stacResults={allResults}
                onDownloadFinish={hide}
              />
            )}
          </Card>
        </Spin>
      </div>
    </Modal>
  );
};

export default DownloadModal;
