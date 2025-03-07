import { Empty, Row } from 'antd';
import React from 'react';
import { useSetRecoilState } from 'recoil';
import { savedSearchTourTargets } from '../../common/reactJoyrideSteps';
import SearchesCard from './SearchesCard';
import { UserSearchQueries, UserSearchQuery } from './types';
import { savedSearchQueryAtom } from '../App/recoil/atoms';
import { ActiveSearchQuery } from '../Search/types';

export type Props = {
  userSearchQueries: UserSearchQueries | [];
  onRemoveSearchQuery: (uuid: string) => void;
};

const Searches: React.FC<React.PropsWithChildren<Props>> = ({
  userSearchQueries,
  onRemoveSearchQuery,
}) => {
  const setSavedSearchQuery = useSetRecoilState<ActiveSearchQuery | null>(savedSearchQueryAtom);

  if (userSearchQueries.length === 0) {
    return <Empty description="Your search library is empty" />;
  }

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

  return (
    <div className={savedSearchTourTargets.savedSearches.class()}>
      <Row gutter={[18, 18]}>
        {(userSearchQueries as UserSearchQueries).map(
          (searchQuery: UserSearchQuery, index: number) => (
            <SearchesCard
              key={searchQuery.uuid}
              searchQuery={searchQuery}
              index={index}
              onRunSearchQuery={handleRunSearchQuery}
              onRemoveSearchQuery={onRemoveSearchQuery}
            />
          )
        )}
      </Row>
    </div>
  );
};

export default Searches;
