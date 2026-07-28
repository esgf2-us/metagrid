import { Empty, message, Row, theme, Button, Popconfirm } from 'antd';
import React from 'react';
import { DeleteOutlined, ClearOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAtom, useAtomValue } from 'jotai';
import SearchesCard from './SearchesCard';
import SearchCardErrorBoundary from './SearchCardErrorBoundary';
import { UserSearchQueries, UserSearchQuery } from './types';
import { deleteUserSearchQuery, ResponseError } from '../../api';
import { showNotice, showError, getStyle } from '../../common/utils';
import { AuthContext } from '../../contexts/AuthContext';
import { isDarkModeAtom, userSearchQueriesAtom } from '../../common/atoms';
import { savedSearchTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import './SearchesCard.css';

const Searches: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = theme.useToken();

  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  // Global states
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const [userSearchQueries, setUserSearchQueries] =
    useAtom<UserSearchQueries>(userSearchQueriesAtom);

  const appStyles = getStyle(isDarkMode);

  const stacDisabled = window.METAGRID.STAC_URL === '' || window.METAGRID.STAC_URL === null;

  // Remove corrupted searches on mount
  React.useEffect(() => {
    const validSearches: UserSearchQuery[] = [];
    const corruptedSearches: UserSearchQuery[] = [];

    userSearchQueries.forEach((query) => {
      // Check if search has minimum required fields
      if (query.project && query.project.name && query.uuid && query.url) {
        validSearches.push(query);
      } else {
        corruptedSearches.push(query);
      }
    });

    // Update state if corrupted searches found
    if (corruptedSearches.length > 0) {
      setUserSearchQueries(validSearches);
      showError(
        messageApi,
        `Removed ${corruptedSearches.length} corrupted search${corruptedSearches.length > 1 ? 'es' : ''} from your library`,
      );
    }
  }, []); // Only run once on mount

  const handleClearAll = (): void => {
    setUserSearchQueries([]);
    localStorage.removeItem('userSearchQueries');
    showNotice(messageApi, 'Cleared all saved searches', {
      icon: <ClearOutlined style={appStyles.messageRemoveIcon} />,
    });
  };

  if (userSearchQueries.length === 0) {
    return <Empty description="Your search library is empty" />;
  }

  // Handles removing a search query
  const handleRemoveSearchQuery = (searchUUID: string): void => {
    const deleteSuccess = (): void => {
      setUserSearchQueries(
        userSearchQueries.filter((searchItem: UserSearchQuery) => searchItem.uuid !== searchUUID),
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

  const updateSearchQuery = (searchQuery: UserSearchQuery): void => {
    const updatedSearchQueries = userSearchQueries.map((query: UserSearchQuery) => {
      if (query.uuid === searchQuery.uuid) {
        return searchQuery;
      }
      return query;
    });
    setUserSearchQueries(updatedSearchQueries);
  };

  /* istanbul ignore next -- @preserve */
  const searchFilter = (query: UserSearchQuery) => !stacDisabled || !query.project.isSTAC;

  return (
    <div
      data-testid="saved-search-library"
      className={savedSearchTourTargets.savedSearches.class()}
    >
      {contextHolder}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Popconfirm
          title={
            <p>
              Do you wish to remove all
              <br /> saved searches?
            </p>
          }
          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          onConfirm={handleClearAll}
          okButtonProps={{
            'data-testid': 'clear-all-searches-confirm-button',
          }}
        >
          <Button danger data-testid="clear-all-searches-button">
            Remove All Searches
          </Button>
        </Popconfirm>
      </div>
      <div
        style={{
          height: 'calc(100vh - 300px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          border: `1px solid ${token.colorBorder}`,
          backgroundColor: token.colorBgLayout,
        }}
        className="custom-scrollbar"
      >
        <Row gutter={[18, 18]}>
          {userSearchQueries
            .filter(searchFilter)
            .map((searchQuery: UserSearchQuery, index: number) => (
              <SearchCardErrorBoundary
                key={searchQuery.uuid}
                uuid={searchQuery.uuid}
                onError={handleRemoveSearchQuery}
                searchData={{
                  projectName: searchQuery.projectName || searchQuery.project?.name,
                  url: searchQuery.url,
                }}
              >
                <SearchesCard
                  updateSearchQuery={updateSearchQuery}
                  searchQuery={searchQuery}
                  index={index}
                  onHandleRemoveSearchQuery={handleRemoveSearchQuery}
                />
              </SearchCardErrorBoundary>
            ))}
        </Row>
      </div>
    </div>
  );
};

export default Searches;
