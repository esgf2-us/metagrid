import { Empty, message, Row, theme, Button, Popconfirm } from 'antd';
import React from 'react';
import { DeleteOutlined, ClearOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAtom, useAtomValue } from 'jotai';
import SearchesCard from './SearchesCard';
import SearchCardErrorBoundary from './SearchCardErrorBoundary';
import { UserSearchQueries, UserSearchQuery } from './types';
import { deleteUserSearchQuery, updateUserSearchQuery, ResponseError } from '../../api';
import { showNotice, showError, getStyle } from '../../common/utils';
import { AuthContext } from '../../contexts/AuthContext';
import { isDarkModeAtom, userSearchQueriesAtom } from '../../common/atoms';
import { savedSearchTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import './SearchesCard.css';

export type Props = {
  onClearButtonMount?: (element: React.ReactNode) => void;
};

const Searches: React.FC<Props> = ({ onClearButtonMount }) => {
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

  const appStyles = React.useMemo(() => getStyle(isDarkMode), [isDarkMode]);

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

  const handleClearAll = React.useCallback((): void => {
    if (isAuthenticated) {
      // Delete all searches from backend
      const deletePromises = userSearchQueries.map((query) =>
        deleteUserSearchQuery(query.uuid, accessToken),
      );

      Promise.all(deletePromises)
        .then(() => {
          setUserSearchQueries([]);
          localStorage.removeItem('userSearchQueries');
          showNotice(messageApi, 'Cleared all saved searches', {
            icon: <ClearOutlined style={appStyles.messageRemoveIcon} />,
          });
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });
    } else {
      setUserSearchQueries([]);
      localStorage.removeItem('userSearchQueries');
      showNotice(messageApi, 'Cleared all saved searches', {
        icon: <ClearOutlined style={appStyles.messageRemoveIcon} />,
      });
    }
  }, [
    isAuthenticated,
    userSearchQueries,
    accessToken,
    setUserSearchQueries,
    messageApi,
    appStyles,
  ]);

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

    // Sync with backend if authenticated
    if (isAuthenticated) {
      updateUserSearchQuery(searchQuery.uuid, accessToken, searchQuery).catch(
        (error: ResponseError) => {
          showError(messageApi, error.message);
        },
      );
    }
  };

  /* istanbul ignore next -- @preserve */
  const searchFilter = (query: UserSearchQuery) => !stacDisabled || !query.project.isSTAC;

  // Create the clear button element (memoized to prevent infinite loops)
  const clearButton = React.useMemo(
    () =>
      userSearchQueries.length > 0 ? (
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
      ) : null,
    [userSearchQueries.length, handleClearAll],
  );

  // Pass the button to parent to render in tab bar
  React.useEffect(() => {
    if (onClearButtonMount) {
      onClearButtonMount(clearButton);
    }
    return () => {
      if (onClearButtonMount) {
        onClearButtonMount(null);
      }
    };
  }, [clearButton, onClearButtonMount]);

  // Show empty state if no searches
  if (userSearchQueries.length === 0) {
    return (
      <div data-testid="saved-search-library">
        {contextHolder}
        <Empty description="Your search library is empty" />
      </div>
    );
  }

  return (
    <div
      data-testid="saved-search-library"
      className={savedSearchTourTargets.savedSearches.class()}
    >
      {contextHolder}
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
