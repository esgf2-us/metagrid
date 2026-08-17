import {
  CopyOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, message, Skeleton, theme, Typography, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import { DeferFn, useAsync } from 'react-async';
import { useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';
import { fetchSearchResults, generateSearchURLQuery } from '../../api';
import { CSSinJS } from '../../common/types';
import { UserSearchQuery } from './types';
import ChangesDialog from './ChangesDialog';
import { createSearchRouteURL, showNotice } from '../../common/utils';
import { savedSearchQueryAtom } from '../../common/atoms';
import { savedSearchTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import {
  stringifyApiRequest,
  convertSearchParamsIntoStacFilter,
  getStacProject,
} from '../../common/STAC';
import { SearchResults } from '../Search/types';
import './SearchesCard.css';

const styles: CSSinJS = {
  category: {
    fontWeight: 'bold',
  },
  facetCategory: {
    fontWeight: 'bold',
  },
};

export type Props = {
  searchQuery: UserSearchQuery;
  updateSearchQuery: (searchQuery: UserSearchQuery) => void;
  onHandleRemoveSearchQuery: (searchUUID: string) => void;
  index: number;
};

const SearchesCard: React.FC<React.PropsWithChildren<Props>> = ({
  searchQuery,
  updateSearchQuery,
  onHandleRemoveSearchQuery,
  index,
}) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();
  const {
    uuid,
    project,
    versionType,
    resultType,
    minVersionDate,
    maxVersionDate,
    filenameVars,
    textInputs,
    activeFacets,
    url,
    resultsCount,
    searchTime,
  } = searchQuery;

  const setSavedSearchQuery = useSetAtom(savedSearchQueryAtom);

  // State for changes dialog
  const [showChangesDialog, setShowChangesDialog] = React.useState(false);

  const isSubscribed = searchQuery.isSubscribed || false;

  // Only fetch resultCount if resultsCount is null or searchTime is an hour old
  const expirationTime = (searchTime || 0) + 60 * 60 * 1000; // Expires after an hour
  const getUrlResults: boolean = !resultsCount || expirationTime < Date.now();
  const numResultsUrl = getUrlResults
    ? generateSearchURLQuery(searchQuery, {
        page: 0,
        pageSize: 0,
      })
    : null;

  const { data, isLoading, error, run } = useAsync({
    deferFn: fetchSearchResults as unknown as DeferFn<SearchResults>,
  });

  // Automatically fetch results when component mounts if needed
  useEffect(() => {
    if (numResultsUrl) {
      run(numResultsUrl);
    }
  }, [numResultsUrl]);

  // Update the search query with the results count if it was fetched
  useEffect(() => {
    if (!isLoading && data) {
      let loadedCount = 0;
      if (project.isSTAC) {
        /* istanbul ignore next -- @preserve */
        const searchData = (data as { search?: { numMatched?: number; numberMatched?: number } })
          .search;
        loadedCount = searchData?.numMatched || searchData?.numberMatched || 0;
      } else {
        loadedCount = (data as { numFound?: number }).numFound || 0;
      }
      updateSearchQuery({
        ...searchQuery,
        resultsCount: loadedCount,
        searchTime: Date.now(),
      });
    }
  }, [isLoading, data]);

  // THIS SUBSCRIPTION FEATURE MAY BE ACTIVATED AT A LATER TIME
  // Handle subscription toggle
  // const handleSubscriptionToggle = () => {
  //   const newIsSubscribed = !isSubscribed;
  //   const newLastCheckedTime = newIsSubscribed ? Date.now() : null;

  //   updateSearchQuery({
  //     ...searchQuery,
  //     isSubscribed: newIsSubscribed,
  //     lastCheckedTime: newLastCheckedTime,
  //   });

  //   if (newIsSubscribed) {
  //     showNotice(messageApi, 'Subscribed to search changes');
  //   } else {
  //     showNotice(messageApi, 'Unsubscribed from search changes');
  //   }
  // };

  let numResultsText;

  if (!resultsCount) {
    if (error) {
      numResultsText = (
        <Alert message="There was an issue fetching the result count." type="error" />
      );
    } else if (isLoading) {
      numResultsText = <Skeleton title={{ width: '100%' }} paragraph={{ rows: 0 }} active />;
    }
  } else if (searchTime) {
    const formattedDateTime = new Date(searchTime).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    numResultsText = (
      <p>
        <span style={{ fontWeight: 'bold' }}>{resultsCount}</span> results found for {project.name}{' '}
        as of {formattedDateTime}
      </p>
    );
  } else {
    numResultsText = (
      <p>
        <span style={{ fontWeight: 'bold' }}>{resultsCount}</span> results found for {project.name}
      </p>
    );
  }

  return (
    <Col key={uuid} xs={20} sm={16} md={12} lg={10} xl={8} style={{ minWidth: '300px' }}>
      {contextHolder}
      <Card
        hoverable
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* THIS SUBSCRIPTION FEATURE MAY BE ACTIVATED AT A LATER TIME
               {project.isSTAC && (
                <Tooltip
                  title={
                    isSubscribed ? 'Unsubscribe from change tracking' : 'Subscribe to track changes'
                  }
                >
                  <BellFilled
                    data-testid={`subscribe-${index + 1}`}
                    onClick={handleSubscriptionToggle}
                    style={{
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: isSubscribed ? '#1890ff' : '#d9d9d9',
                    }}
                  />
                </Tooltip>
              )} */}
              <FileSearchOutlined /> Search #
              {project.isSTAC
                ? searchQuery.uuid.slice(0, 8)
                : `${searchQuery.uuid.slice(0, 8)} (Legacy)`}
            </div>
            {isSubscribed && (
              <Button type="primary" onClick={() => setShowChangesDialog(true)}>
                View Search Changes
              </Button>
            )}
          </div>
        }
        actions={[
          <Tooltip title="Apply search query and view results" trigger="hover">
            <SearchOutlined
              className={savedSearchTourTargets.applySearch.class()}
              data-testid={`apply-${index + 1}`}
              key="search"
              onClick={() => {
                // Set searchTime to 0 so that it'll be considered expired and updated
                updateSearchQuery({
                  ...searchQuery,
                  searchTime: 0,
                });
                setSavedSearchQuery(searchQuery);

                // Navigate to the search page with the query
                navigate('/search');
              }}
            />
          </Tooltip>,
          <Tooltip title="View results in JSON format">
            <a
              className={savedSearchTourTargets.jsonBtn.class()}
              href={createSearchRouteURL(
                url,
                project.isSTAC && project.projectName
                  ? convertSearchParamsIntoStacFilter(url, getStacProject(project.projectName))
                  : null,
              )}
              rel="noopener noreferrer"
              target="blank_"
            >
              <LinkOutlined key="json" /> JSON
            </a>
          </Tooltip>,
          <Tooltip title="Remove search query from library">
            <DeleteOutlined
              className={savedSearchTourTargets.removeBtn.class()}
              data-testid={`remove-${index + 1}`}
              onClick={() => onHandleRemoveSearchQuery(uuid)}
              style={{ color: 'red' }}
              key="remove"
            />
          </Tooltip>,
        ]}
      >
        <div
          className="search-card-content custom-scrollbar"
          style={{
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorBgContainer,
          }}
        >
          {numResultsText}
          <p className={savedSearchTourTargets.projectDescription.class()}>
            <span style={styles.category}>Project: </span>
            {project.fullName}
          </p>
          {project.isSTAC && project.stacApiUrl && (
            <p>
              <span style={styles.category}>STAC API URL: </span>
              <Typography.Text code style={{ fontSize: '12px' }}>
                {project.stacApiUrl}
              </Typography.Text>
            </p>
          )}
          <div className={savedSearchTourTargets.searchQueryString.class()}>
            <span style={styles.category}>
              Query String:{' '}
              <Button
                type="primary"
                size="small"
                style={{ marginLeft: '5px' }}
                icon={
                  <Tooltip title="Copy query to clipboard">
                    <CopyOutlined style={{ fontSize: '12px' }} />
                  </Tooltip>
                }
                onClick={() => {
                  const queryText = stringifyApiRequest(
                    project,
                    url,
                    textInputs,
                    versionType,
                    resultType,
                    minVersionDate,
                    maxVersionDate,
                    activeFacets,
                  );
                  if (navigator && navigator.clipboard) {
                    navigator.clipboard.writeText(queryText);
                    showNotice(messageApi, 'Query copied to clipboard!', {
                      icon: <CopyOutlined style={styles.messageAddIcon} />,
                    });
                  }
                }}
              />
            </span>
            <Typography.Text code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {stringifyApiRequest(
                project,
                url,
                textInputs,
                versionType,
                resultType,
                minVersionDate,
                maxVersionDate,
                activeFacets,
              )}
            </Typography.Text>
          </div>
          <p>
            <span style={styles.category}>Filename Searches: </span>
            <Typography.Text code>
              {filenameVars && filenameVars.length > 0 ? filenameVars.join(', ') : 'N/A'}
            </Typography.Text>
          </p>
        </div>
      </Card>
      {project.isSTAC && (
        <ChangesDialog
          open={showChangesDialog}
          onClose={() => setShowChangesDialog(false)}
          searchQuery={searchQuery}
        />
      )}
    </Col>
  );
};

export default SearchesCard;
