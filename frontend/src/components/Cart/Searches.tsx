import { Empty, message, Row } from 'antd';
import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { useAtom, useAtomValue } from 'jotai';
import SearchesCard from './SearchesCard';
import { UserSearchQueries, UserSearchQuery } from './types';
import { deleteUserSearchQuery, ResponseError } from '../../api';
import { showNotice, showError, getStyle } from '../../common/utils';
import { AuthContext } from '../../contexts/AuthContext';
import { isDarkModeAtom, userSearchQueriesAtom } from '../../common/atoms';
import { savedSearchTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

const Searches: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  // Global states
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const [userSearchQueries, setUserSearchQueries] = useAtom<UserSearchQueries>(
    userSearchQueriesAtom
  );

  const appStyles = getStyle(isDarkMode);

  if (userSearchQueries.length === 0) {
    return <Empty description="Your search library is empty" />;
  }

  // Handles removing a search query
  const handleRemoveSearchQuery = (searchUUID: string): void => {
    const deleteSuccess = (): void => {
      setUserSearchQueries(
        userSearchQueries.filter((searchItem: UserSearchQuery) => searchItem.uuid !== searchUUID)
      );
      showNotice(messageApi, 'Removed search query from your library', {
        icon: <DeleteOutlined style={appStyles.messageRemoveIcon} />,
      });
    };

    if (isAuthenticated) {
      deleteUserSearchQuery(searchUUID, accessToken)
        .then(() => {
          deleteSuccess();
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });
    } else {
      deleteSuccess();
    }
  };

  return (
    <div
      data-testid="saved-search-library"
      className={savedSearchTourTargets.savedSearches.class()}
    >
      {contextHolder}
      <Row gutter={[18, 18]}>
        {userSearchQueries.map((searchQuery: UserSearchQuery, index: number) => (
          <SearchesCard
            key={searchQuery.uuid}
            searchQuery={searchQuery}
            index={index}
            onHandleRemoveSearchQuery={handleRemoveSearchQuery}
          />
        ))}
      </Row>
    </div>
  );
};

export default Searches;
