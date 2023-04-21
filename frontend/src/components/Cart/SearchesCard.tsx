import {
  DeleteOutlined,
  FileSearchOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Alert, Col, Skeleton, Typography } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { useNavigate } from 'react-router-dom';
import { fetchSearchResults, generateSearchURLQuery } from '../../api';
import { clickableRoute } from '../../api/routes';
import { savedSearchTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import Card from '../DataDisplay/Card';
import ToolTip from '../DataDisplay/ToolTip';
import { stringifyFilters } from '../Search';
import { UserSearchQuery } from './types';

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
  index: number;
  onRunSearchQuery: (savedSearch: UserSearchQuery) => void;
  onRemoveSearchQuery: (uuid: string) => void;
};

const SearchesCard: React.FC<Props> = ({
  searchQuery,
  index,
  onRunSearchQuery,
  onRemoveSearchQuery,
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
    numResults = (
      <Alert
        message="There was an issue fetching the result count."
        type="error"
      />
    );
  } else if (isLoading) {
    numResults = (
      <Skeleton title={{ width: '100%' }} paragraph={{ rows: 0 }} active />
    );
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
          <ToolTip title="Apply search query and view results" trigger="hover">
            <SearchOutlined
              className={savedSearchTourTargets.applySearch.class()}
              data-testid={`apply-${index + 1}`}
              key="search"
              onClick={() => {
                navigate('/search');
                onRunSearchQuery(searchQuery);
              }}
            />
          </ToolTip>,
          <ToolTip title="View results in JSON format">
            <a
              className={savedSearchTourTargets.jsonBtn.class()}
              href={clickableRoute(url)}
              rel="noopener noreferrer"
              target="blank_"
            >
              <LinkOutlined key="json" /> JSON
            </a>
          </ToolTip>,
          <ToolTip title="Remove search query from library">
            <DeleteOutlined
              className={savedSearchTourTargets.removeBtn.class()}
              data-testid={`remove-${index + 1}`}
              onClick={() => onRemoveSearchQuery(uuid)}
              style={{ color: 'red' }}
              key="remove"
            />
          </ToolTip>,
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
            {filenameVars && filenameVars.length > 0
              ? filenameVars.join(', ')
              : 'N/A'}
          </Typography.Text>
        </p>
      </Card>
    </Col>
  );
};

export default SearchesCard;
