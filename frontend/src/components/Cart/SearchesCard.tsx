import React from 'react';
import { useHistory } from 'react-router-dom';
import { useAsync } from 'react-async';
import { Col, Typography } from 'antd';

import {
  SearchOutlined,
  LinkOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import Card from '../DataDisplay/Card';
import ToolTip from '../DataDisplay/ToolTip';

import { stringifyConstraints } from '../Search';
import { genUrlQuery, fetchResults } from '../../utils/api';
import { isEmpty } from '../../utils/utils';
import Skeleton from '../Feedback/Skeleton';

const styles: Record<string, React.CSSProperties> = {
  category: {
    fontWeight: 'bold',
  },
  facetCategory: {
    fontWeight: 'bold',
  },
};

export type Props = {
  savedSearch: SavedSearch;
  index: number;
  handleRemoveSearch: (id: string) => void;
  handleApplySearch: (savedSearch: SavedSearch) => void;
};

const SearchesCard: React.FC<Props> = ({
  savedSearch,
  index,
  handleApplySearch,
  handleRemoveSearch,
}) => {
  const history = useHistory();
  const { id, project, textInputs, activeFacets } = savedSearch;

  const reqUrl = genUrlQuery(project.facets_url, textInputs, activeFacets, {
    page: 0,
    pageSize: 0,
  });

  // Fetch the results count
  const { data, isLoading, error } = useAsync({
    promiseFn: fetchResults,
    reqUrl,
  });

  return (
    <Col key={id} xs={20} sm={16} md={12} lg={10} xl={8}>
      <Card
        hoverable
        title={
          <>
            <p>Search #{index + 1}</p>
            {isLoading ? (
              <Skeleton
                title={{ width: '250px' }}
                paragraph={{ rows: 0 }}
                active
              />
            ) : (
              <>
                <p>
                  <span style={{ fontWeight: 'bold' }}>
                    {
                      (data as { response: { numFound: number } }).response
                        .numFound
                    }
                  </span>{' '}
                  results found for {project.name}
                </p>
              </>
            )}
          </>
        }
        actions={[
          <ToolTip
            title="Apply search criteria and view results"
            trigger="hover"
          >
            <SearchOutlined
              key="search"
              onClick={() => {
                history.push('/search');
                handleApplySearch(savedSearch);
              }}
            />
          </ToolTip>,
          <ToolTip title="View results in JSON format">
            <a
              href={genUrlQuery(project.facets_url, textInputs, activeFacets, {
                page: 0,
                pageSize: 10,
              })}
              rel="noopener noreferrer"
              target="blank_"
            >
              <LinkOutlined key="json" /> JSON
            </a>
          </ToolTip>,
          <ToolTip title="Remove search criteria from library">
            <DeleteOutlined
              onClick={() => handleRemoveSearch(id)}
              style={{ color: 'red' }}
              key="remove"
            />
          </ToolTip>,
        ]}
      >
        <p>
          <span style={styles.category}>Project: </span>
          {project.full_name}
        </p>

        {project.description !== null && <p>{project.description}</p>}

        <p>
          <span style={styles.category}>Query String: </span>
          <Typography.Text code>
            {isEmpty(activeFacets) && isEmpty(textInputs)
              ? 'N/A'
              : stringifyConstraints(activeFacets, textInputs)}
          </Typography.Text>
        </p>
      </Card>
    </Col>
  );
};

export default SearchesCard;
