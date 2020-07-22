import React from 'react';
import { Row } from 'antd';

import Empty from '../DataDisplay/Empty';
import SearchesCard from './SearchesCard';

export type Props = {
  savedSearches: SavedSearch[] | [];
  handleRemoveSearch: (uuid: string) => void;
  handleApplySearch: (savedSearch: SavedSearch) => void;
};

const Searches: React.FC<Props> = ({
  savedSearches,
  handleRemoveSearch,
  handleApplySearch,
}) => {
  if (savedSearches.length === 0) {
    return <Empty description="Your search library is empty" />;
  }

  return (
    <div>
      <Row gutter={[18, 18]}>
        {(savedSearches as SavedSearch[]).map(
          (savedSearch: SavedSearch, index: number) => {
            return (
              <SearchesCard
                key={savedSearch.uuid}
                savedSearch={savedSearch}
                index={index}
                handleApplySearch={handleApplySearch}
                handleRemoveSearch={handleRemoveSearch}
              />
            );
          }
        )}
      </Row>
    </div>
  );
};

export default Searches;
