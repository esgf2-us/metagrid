import { Row } from 'antd';
import React from 'react';
import { savedSearchTourTargets } from '../../common/reactJoyrideSteps';
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
    <div className={savedSearchTourTargets.getClass('savedSearches')}>
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
