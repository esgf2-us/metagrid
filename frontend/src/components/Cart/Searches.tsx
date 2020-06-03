import React from 'react';
import { Row, Col, Typography } from 'antd';
import {
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined,
} from '@ant-design/icons';

import Card from '../DataDisplay/Card';
import ToolTip from '../DataDisplay/ToolTip';
import { genUrlQuery } from '../../utils/api';
import { stringifyConstraints } from '../Search';

type Props = {
  savedSearches: SavedSearch[] | [];
};

const Searches: React.FC<Props> = ({ savedSearches }) => {
  return (
    <div>
      <Row gutter={[18, 18]}>
        {savedSearches.length > 0 &&
          (savedSearches as SavedSearch[]).map(
            (search: SavedSearch, index: number) => {
              return (
                <Col xs={20} sm={16} md={12} lg={10} xl={8}>
                  <Card
                    hoverable
                    title={
                      <>
                        <p>
                          Search #{index + 1}:{' '}
                          <span style={{ fontWeight: 'bold' }}>
                            {search.numResults}
                          </span>{' '}
                          results found for {search.project.name}
                        </p>
                      </>
                    }
                    actions={[
                      <ToolTip
                        title="Apply search criteria and view results"
                        trigger="hover"
                      >
                        <SearchOutlined key="search" />
                      </ToolTip>,
                      <ToolTip title="View results in JSON format">
                        <a
                          href={genUrlQuery(
                            search.project.facets_url,
                            search.textInputs,
                            search.activeFacets,
                            { page: 0, pageSize: 10 }
                          )}
                          rel="noopener noreferrer"
                          target="blank_"
                        >
                          <LinkOutlined key="json" /> JSON
                        </a>
                      </ToolTip>,
                      <ToolTip title="Remove search criteria from library">
                        <DeleteOutlined style={{ color: 'red' }} key="remove" />
                      </ToolTip>,
                    ]}
                  >
                    <p>
                      <span style={{ fontWeight: 'bold' }}>Project: </span>
                      {search.project.full_name}
                    </p>

                    {search.project.description !== null && (
                      <p>{search.project.description}</p>
                    )}

                    <p>
                      <span style={{ fontWeight: 'bold' }}>Query String: </span>
                      <Typography.Text code>
                        {stringifyConstraints(
                          search.activeFacets,
                          search.textInputs
                        )}
                      </Typography.Text>
                    </p>
                  </Card>
                </Col>
              );
            }
          )}
      </Row>
    </div>
  );
};

export default Searches;
