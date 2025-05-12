import {
  DeleteOutlined,
  FileSearchOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Alert, Card, Col, Skeleton, Typography, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { useNavigate } from 'react-router-dom';
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
  } = searchQuery;

  const setSavedSearchQuery = useSetAtom(savedSearchQueryAtom);

  // Only call useAsync if resultsCount is null
  const numResultsUrl = resultsCount
    ? null
    : generateSearchURLQuery(searchQuery, {
        page: 0,
        pageSize: 0,
      });

  const { data, isLoading, error } = useAsync({
    promiseFn: numResultsUrl ? fetchSearchResults : undefined,
    reqUrl: numResultsUrl,
  });

  // Update the search query with the results count if it was fetched
  useEffect(() => {
    if (!isLoading && data) {
      const loadedCount = (data as {
        response: { numFound: number };
      }).response.numFound;
      updateSearchQuery({
        ...searchQuery,
        resultsCount: loadedCount,
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
                navigate('/search');
                setSavedSearchQuery(searchQuery);
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
              textInputs
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
