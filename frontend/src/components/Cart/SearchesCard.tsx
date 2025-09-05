import {
  DeleteOutlined,
  FileSearchOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Alert, Card, Col, Skeleton, Typography, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';
import { fetchSearchResults, generateSearchURLQuery } from '../../api';
import { CSSinJS } from '../../common/types';
import { stringifyFilters } from '../Search';
import { UserSearchQuery } from './types';
import { createSearchRouteURL } from '../../common/utils';
import { savedSearchQueryAtom } from '../../common/atoms';
import { savedSearchTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

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

  // Only call useAsync if resultsCount is null or searchTime is an hour old
  const expirationTime = (searchTime || 0) + 60 * 60 * 1000; // Expires after an hour
  const getUrlResults: boolean = !resultsCount || expirationTime < Date.now();
  const numResultsUrl = getUrlResults
    ? generateSearchURLQuery(searchQuery, {
        page: 0,
        pageSize: 0,
      })
    : null;

  const { data, isLoading, error } = useAsync({
    promiseFn: numResultsUrl ? fetchSearchResults : undefined,
    reqUrl: numResultsUrl,
  });

  // Update the search query with the results count if it was fetched
  useEffect(() => {
    if (!isLoading && data) {
      let loadedCount = 0;
      if (project.isSTAC) {
        loadedCount = (data as { search?: { numMatched?: number } }).search?.numMatched || 0;
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
    <Col key={uuid} xs={20} sm={16} md={12} lg={10} xl={8}>
      <Card
        hoverable
        title={
          <>
            <FileSearchOutlined /> Search #{index + 1}
          </>
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
              href={createSearchRouteURL(url)}
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
        {numResultsText}
        <p className={savedSearchTourTargets.projectDescription.class()}>
          <span style={styles.category}>Project: </span>
          {project.fullName}
        </p>

        <p className={savedSearchTourTargets.searchQueryString.class()}>
          <span style={styles.category}>Query String: </span>
          <Typography.Text code>
            {stringifyFilters(
              versionType,
              resultType,
              minVersionDate,
              maxVersionDate,
              activeFacets,
              textInputs,
            )}
          </Typography.Text>
        </p>
        <p>
          <span style={styles.category}>Filename Searches: </span>
          <Typography.Text code>
            {filenameVars && filenameVars.length > 0 ? filenameVars.join(', ') : 'N/A'}
          </Typography.Text>
        </p>
      </Card>
    </Col>
  );
};

export default SearchesCard;
