import React from 'react';
import {
  Modal,
  Alert,
  Button,
  Space,
  Radio,
  Spin,
  Typography,
  message,
  Tooltip,
  DatePicker,
} from 'antd';
import { BellOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';
import { UserSearchQuery } from './types';
import { savedSearchQueryAtom } from '../../common/atoms';
import { fetchSearchResults, generateSearchURLQuery } from '../../api';
import { stringifyApiRequest } from '../../common/STAC';
import { showNotice } from '../../common/utils';

export type ChangesDialogProps = {
  open: boolean;
  onClose: () => void;
  searchQuery: UserSearchQuery;
};

const ChangesDialog: React.FC<ChangesDialogProps> = ({ open, onClose, searchQuery }) => {
  const navigate = useNavigate();
  const setSavedSearchQuery = useSetAtom(savedSearchQueryAtom);
  const [messageApi, contextHolder] = message.useMessage();

  const [timeRange, setTimeRange] = React.useState<string>('subscription');
  const [customDateRange, setCustomDateRange] = React.useState<[Dayjs | null, Dayjs | null] | null>(
    null,
  );
  const [newDatasetsCount, setNewDatasetsCount] = React.useState<number>(0);
  const [isChecking, setIsChecking] = React.useState(false);
  const [hasChecked, setHasChecked] = React.useState(false);

  const lastCheckedTime = searchQuery.lastCheckedTime || null;

  // Calculate timestamp based on selected time range
  // Memoize to prevent recalculating on every render (which causes flicker)
  const currentTimestamp = React.useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'yesterday':
        now.setDate(now.getDate() - 1);
        return now.toISOString();
      case 'lastWeek':
        now.setDate(now.getDate() - 7);
        return now.toISOString();
      case 'lastMonth':
        now.setMonth(now.getMonth() - 1);
        return now.toISOString();
      case 'custom':
        // Use the start date from the range picker
        if (customDateRange && customDateRange[0]) {
          return customDateRange[0].toISOString();
        }
        return null;
      case 'subscription':
        return lastCheckedTime ? new Date(lastCheckedTime).toISOString() : null;
      default:
        return null;
    }
  }, [timeRange, customDateRange, lastCheckedTime]);

  // Check for new datasets with the current timestamp
  const checkForNewDatasets = React.useCallback(async () => {
    if (!currentTimestamp) return;

    setIsChecking(true);
    setHasChecked(false);
    try {
      const checkUrl = generateSearchURLQuery(
        { ...searchQuery, filterCreatedSince: currentTimestamp },
        { page: 0, pageSize: 0 },
      );

      const response = await fetchSearchResults([checkUrl]);
      const searchData = (response as { search?: { numMatched?: number; numberMatched?: number } })
        .search;
      const count = searchData?.numMatched || searchData?.numberMatched || 0;
      setNewDatasetsCount(count);
      setHasChecked(true);
    } catch (err) {
      setNewDatasetsCount(0);
      setHasChecked(true);
    } finally {
      setIsChecking(false);
    }
  }, [currentTimestamp, searchQuery]);

  // Auto-check when dialog opens or time range changes
  React.useEffect(() => {
    if (open && currentTimestamp) {
      checkForNewDatasets();
    }
  }, [open, currentTimestamp, checkForNewDatasets]);

  const handleViewFilteredResults = () => {
    if (!currentTimestamp) return;

    const modifiedSearchQuery = {
      ...searchQuery,
      filterCreatedSince: currentTimestamp,
      searchTime: 0,
    };

    setSavedSearchQuery(modifiedSearchQuery);
    navigate('/search');
    onClose();
  };

  const formatTimestamp = (ts: string | number | null) => {
    if (!ts) return 'N/A';
    const date = typeof ts === 'string' ? new Date(ts) : new Date(ts);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Modal
      title={
        <>
          <BellOutlined style={{ marginRight: '8px' }} />
          Dataset Changes for Search #{searchQuery.uuid.slice(0, 8)}
        </>
      }
      open={open}
      onCancel={onClose}
      width={750}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {contextHolder}
      <div>
        <div style={{ fontSize: '14px', marginBottom: '16px' }}>
          <strong>Project:</strong> {searchQuery.project.fullName}
          {searchQuery.project.isSTAC && searchQuery.project.stacApiUrl && (
            <>
              <br />
              <strong>STAC API URL:</strong>{' '}
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {searchQuery.project.stacApiUrl}
              </span>
            </>
          )}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <strong>Query String:</strong>
            <Tooltip title="Copy query to clipboard">
              <Button
                type="primary"
                size="small"
                icon={<CopyOutlined style={{ fontSize: '12px' }} />}
                onClick={() => {
                  let modifiedUrl = searchQuery.url;
                  if (currentTimestamp) {
                    const urlParams = new URLSearchParams(searchQuery.url.split('?')[1] || '');
                    urlParams.set('filterCreatedSince', currentTimestamp);
                    modifiedUrl = `${searchQuery.url.split('?')[0]}?${urlParams.toString()}`;
                  }
                  const queryText = stringifyApiRequest(
                    searchQuery.project,
                    modifiedUrl,
                    searchQuery.textInputs,
                    searchQuery.versionType,
                    searchQuery.resultType,
                    searchQuery.minVersionDate,
                    searchQuery.maxVersionDate,
                    searchQuery.activeFacets,
                  );
                  if (navigator && navigator.clipboard) {
                    navigator.clipboard.writeText(queryText);
                    showNotice(messageApi, 'Query copied to clipboard!', {
                      icon: <CopyOutlined />,
                    });
                  }
                }}
              />
            </Tooltip>
          </div>
          <Typography.Text
            code
            style={{
              display: 'block',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {(() => {
              let modifiedUrl = searchQuery.url;
              if (currentTimestamp) {
                const urlParams = new URLSearchParams(searchQuery.url.split('?')[1] || '');
                urlParams.set('filterCreatedSince', currentTimestamp);
                modifiedUrl = `${searchQuery.url.split('?')[0]}?${urlParams.toString()}`;
              }
              return stringifyApiRequest(
                searchQuery.project,
                modifiedUrl,
                searchQuery.textInputs,
                searchQuery.versionType,
                searchQuery.resultType,
                searchQuery.minVersionDate,
                searchQuery.maxVersionDate,
                searchQuery.activeFacets,
              );
            })()}
          </Typography.Text>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>Select Time Range:</strong>
          </div>
          <Radio.Group
            value={timeRange}
            onChange={(e) => {
              const newValue = e.target.value as string;
              setTimeRange(newValue);
            }}
            style={{ marginBottom: '12px', width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {lastCheckedTime && (
                <Radio value="subscription">
                  Since Subscription ({formatTimestamp(lastCheckedTime)})
                </Radio>
              )}
              <Radio value="yesterday">Yesterday</Radio>
              <Radio value="lastWeek">Last Week</Radio>
              <Radio value="lastMonth">Last Month</Radio>
              <Radio value="custom">Custom Publication Date</Radio>
            </Space>
          </Radio.Group>
          {timeRange === 'custom' && (
            <DatePicker.RangePicker
              size="small"
              allowEmpty={[true, true]}
              value={customDateRange}
              onChange={(dates) => setCustomDateRange(dates)}
              style={{ marginBottom: '12px' }}
            />
          )}
          {currentTimestamp && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Filtering for datasets published since:{' '}
              <strong>{formatTimestamp(currentTimestamp)}</strong>
            </div>
          )}
        </div>
        {isChecking && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px', color: '#666' }}>Checking for new datasets...</p>
          </div>
        )}
        {!isChecking && hasChecked && (
          <>
            <Alert
              message={
                newDatasetsCount > 0
                  ? `${newDatasetsCount} new dataset${newDatasetsCount !== 1 ? 's' : ''} found`
                  : 'No new datasets detected'
              }
              description={
                newDatasetsCount > 0
                  ? `Found datasets published since ${formatTimestamp(currentTimestamp)}`
                  : `No datasets were published since ${formatTimestamp(currentTimestamp)}`
              }
              type={newDatasetsCount > 0 ? 'info' : 'success'}
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {newDatasetsCount > 0 && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Click below to view these datasets on the search page with the time filter
                    applied.
                  </p>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    size="large"
                    onClick={handleViewFilteredResults}
                  >
                    View New Datasets in Search
                  </Button>
                </Space>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ChangesDialog;
