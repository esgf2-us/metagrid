import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Modal, Spin } from 'antd';
import { useSetAtom } from 'jotai';
import CloudDownloadOutlined from '@ant-design/icons/lib/icons/CloudDownloadOutlined';
import WarningOutlined from '@ant-design/icons/lib/icons/WarningOutlined';
import DatasetDownload from './DatasetDownload';
import PreferredNodesModal from './PreferredNodesModal';
import { ActiveSearchQuery, StacSearchResponse, StacFeature } from '../Search/types';
import {
  getDownloadSizeFromSTACsearch,
  getFileCountFromSTACsearch,
  getReplicaNodelsList,
  convertStacToRawSearchResult,
  convertSearchParamsIntoStacFilter,
} from '../../common/STAC';
import { formatBytes } from '../../common/utils';
import { postSTACSearch } from '../../api';
import { selectedNodesAtom } from '../../common/atoms';
import { downloadAllModalTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import { RawProject } from '../Facets/types';

// Threshold for showing large download warning
export const LARGE_DOWNLOAD_WARNING_THRESHOLD = 10000;

interface DownloadModalProps {
  show: boolean;
  hide: () => void;
  searchURL: string;
  stacFeatures: StacFeature[];
  totalMatched: number;
  activeSearchQuery: ActiveSearchQuery;
}

const DownloadModal = ({
  show,
  hide,
  searchURL,
  stacFeatures,
  totalMatched,
  activeSearchQuery,
}: DownloadModalProps): React.ReactElement => {
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [loadingAllResults, setLoadingAllResults] = useState(false);
  const [allResults, setAllResults] = useState<StacFeature[] | null>(null);
  const [loadWarningAcknowledged, setLoadWarningAcknowledged] = useState(false);
  const [showPreferredNodesModal, setShowPreferredNodesModal] = useState(false);

  const setSelectedNodes = useSetAtom(selectedNodesAtom);

  // Reset state when modal is closed
  useEffect(() => {
    if (!show) {
      setWarningAcknowledged(false);
      setLoadingAllResults(false);
      setAllResults(null);
      setLoadWarningAcknowledged(false);
    }
  }, [show]);

  // Extract unique nodes from search results
  const availableNodes = useMemo(() => {
    if (!allResults) {
      return [];
    }

    const nodesSet = new Set<string>();

    allResults.forEach((feature: StacFeature) => {
      const item = convertStacToRawSearchResult(feature);
      const nodes = getReplicaNodelsList(item);

      nodes.forEach((node) => {
        if (node) {
          nodesSet.add(node);
        }
      });
    });

    return Array.from(nodesSet);
  }, [allResults]);

  const hasNodes = availableNodes.length > 0;

  const handleFetchAllResults = React.useCallback(async () => {
    setLoadingAllResults(true);

    try {
      const project = activeSearchQuery.project as RawProject;
      const projectName = project.projectName as string;
      const { stacApiUrl } = project;

      const filter = convertSearchParamsIntoStacFilter(searchURL, project);

      // Use text inputs from activeSearchQuery
      const textInputs =
        activeSearchQuery.textInputs && activeSearchQuery.textInputs.length > 0
          ? activeSearchQuery.textInputs
          : undefined;

      // Fetch all results by setting limit to totalMatched (bypass batching)
      const response = await postSTACSearch(
        projectName,
        totalMatched,
        filter,
        textInputs,
        undefined, // token
        stacApiUrl, // stacApiUrl - ensures we query the same API as the search results
      );
      const { features } = response as StacSearchResponse;

      setAllResults(features);
    } catch (error) {
      /* istanbul ignore next -- @preserve */
      // eslint-disable-next-line no-console
      console.error('[DownloadModal] Error fetching results:', error);
      setAllResults(stacFeatures);
    } finally {
      setLoadingAllResults(false);
    }
  }, [activeSearchQuery, searchURL, totalMatched, stacFeatures]);

  // Automatically fetch all results for <= 1000 results or after warning acknowledged
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

  if (allResults) {
    fileCount = getFileCountFromSTACsearch(allResults);
    totalFileSize = getDownloadSizeFromSTACsearch(allResults);
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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                  {allResults && (
                    <Button
                      type="primary"
                      className={downloadAllModalTargets.setPreferredNodesBtn.class()}
                      onClick={() => setShowPreferredNodesModal(true)}
                      disabled={!hasNodes}
                      data-testid="setPreferredNodesBtn"
                    >
                      Set Preferred Nodes
                    </Button>
                  )}
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
                stacFeatures={allResults}
                onDownloadFinish={hide}
              />
            )}
          </Card>
        </Spin>
      </div>
      <PreferredNodesModal
        show={showPreferredNodesModal}
        hide={() => setShowPreferredNodesModal(false)}
        availableNodes={availableNodes}
        onApply={(preferences) => {
          // Apply node preferences to all search results
          if (!allResults) return;

          const newSelectedNodes: Record<string, string> = {};

          allResults.forEach((feature: StacFeature) => {
            const item = convertStacToRawSearchResult(feature);
            const availableNodesForItem = getReplicaNodelsList(item);

            // Find the highest priority node that's available
            const selectedNode = preferences.find((preferredNode) =>
              availableNodesForItem.includes(preferredNode),
            );

            // Set the selected node (use preferred or fallback to first available)
            const nodeToUse = selectedNode || availableNodesForItem[0];
            if (nodeToUse) {
              newSelectedNodes[item.id] = nodeToUse;
            }
          });

          // Update the selected nodes state
          setSelectedNodes(newSelectedNodes);
        }}
      />
    </Modal>
  );
};

export default DownloadModal;
