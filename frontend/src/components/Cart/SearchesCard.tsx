import {
  DeleteOutlined,
  FileSearchOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Col, Typography } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { useHistory } from 'react-router-dom';
import { fetchSearchResults, generateSearchURLQuery } from '../../api';
import { clickableRoute } from '../../api/routes';
import { CSSinJS } from '../../common/types';
import Card from '../DataDisplay/Card';
import ToolTip from '../DataDisplay/ToolTip';
import Alert from '../Feedback/Alert';
import Skeleton from '../Feedback/Skeleton';
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
  const history = useHistory();
  const {
    uuid,
    project,
    resultType,
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
              data-testid={`apply-${index + 1}`}
              key="search"
              onClick={() => {
                history.push('/search');
                onRunSearchQuery(searchQuery);
              }}
            />
          </ToolTip>,
          <ToolTip title="View results in JSON format">
            <a
              href={clickableRoute(url)}
              rel="noopener noreferrer"
              target="blank_"
            >
              <LinkOutlined key="json" /> JSON
            </a>
          </ToolTip>,
          <ToolTip title="Remove search query from library">
            <DeleteOutlined
              data-testid={`remove-${index + 1}`}
              onClick={() => onRemoveSearchQuery(uuid)}
              style={{ color: 'red' }}
              key="remove"
            />
          </ToolTip>,
        ]}
      >
        {numResults}
        <p>
          <span style={styles.category}>Project: </span>
          {project.fullName}
        </p>

        <p>
          <span style={styles.category}>Query String: </span>
          <Typography.Text code>
            {stringifyFilters(resultType, activeFacets, textInputs)}
          </Typography.Text>
        </p>
        <p>
          <span style={styles.category}>Filename Variables: </span>
          <Typography.Text code>
            {filenameVars ? filenameVars.join(', ') : 'N/A'}
          </Typography.Text>
        </p>
      </Card>
    </Col>
  );
};

export default SearchesCard;
