import {
  DeleteOutlined,
  FileSearchOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Alert, Card, Col, Skeleton, Typography, Tooltip } from 'antd';
import React from 'react';
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
  onHandleRemoveSearchQuery: (searchUUID: string) => void;
  index: number;
};

const SearchesCard: React.FC<React.PropsWithChildren<Props>> = ({
  searchQuery,
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
  } = searchQuery;

  const setSavedSearchQuery = useSetAtom(savedSearchQueryAtom);

  // This converts a saved search to the active search query
  const handleRunSearchQuery = (savedSearch: UserSearchQuery): void => {
    setSavedSearchQuery({
      project: savedSearch.project,
      versionType: savedSearch.versionType,
      resultType: 'all',
      minVersionDate: savedSearch.minVersionDate,
      maxVersionDate: savedSearch.maxVersionDate,
      filenameVars: savedSearch.filenameVars,
      activeFacets: savedSearch.activeFacets,
      textInputs: savedSearch.textInputs,
    });
  };

  // Generate the URL for receiving only the result count to reduce response time

  const numResultsUrl = generateSearchURLQuery(searchQuery, {
    page: 0,
    pageSize: 0,
  });
  const { data, isLoading, error } = useAsync({
    promiseFn: fetchSearchResults,
    reqUrl: numResultsUrl,
  });

  let numResults;
  if (error) {
    numResults = <Alert message="There was an issue fetching the result count." type="error" />;
  } else if (isLoading) {
    numResults = <Skeleton title={{ width: '100%' }} paragraph={{ rows: 0 }} active />;
  } else {
    numResults = (
      <p>
        <span style={{ fontWeight: 'bold' }}>
          {(data as {
            response: { numFound: number };
          }).response.numFound.toLocaleString()}
        </span>{' '}
        results found for {project.name}
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
                handleRunSearchQuery(searchQuery);
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
        {numResults}
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
