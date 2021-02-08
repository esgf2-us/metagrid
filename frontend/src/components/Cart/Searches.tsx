import { Row } from 'antd';
import React from 'react';
import Empty from '../DataDisplay/Empty';
import SearchesCard from './SearchesCard';
import { UserSearchQueries, UserSearchQuery } from './types';

export type Props = {
  userSearchQueries: UserSearchQueries | [];
  onRunSearchQuery: (savedSearch: UserSearchQuery) => void;
  onRemoveSearchQuery: (uuid: string) => void;
};

const Searches: React.FC<Props> = ({
  userSearchQueries,
  onRunSearchQuery,
  onRemoveSearchQuery,
}) => {
  if (userSearchQueries.length === 0) {
    return <Empty description="Your search library is empty" />;
  }

  return (
    <div>
      <Row gutter={[18, 18]}>
        {(userSearchQueries as UserSearchQueries).map(
          (searchQuery: UserSearchQuery, index: number) => (
              <SearchesCard
                key={searchQuery.uuid}
                searchQuery={searchQuery}
                index={index}
                onRunSearchQuery={onRunSearchQuery}
                onRemoveSearchQuery={onRemoveSearchQuery}
              />
            )
        )}
      </Row>
    </div>
  );
};

export default Searches;
