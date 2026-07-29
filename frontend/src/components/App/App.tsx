import {
  DeleteOutlined,
  HomeOutlined,
  QuestionOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  Affix,
  Breadcrumb,
  Button,
  ConfigProvider,
  FloatButton,
  Layout,
  Result,
  message,
  theme,
} from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { hotjar } from 'react-hotjar';
import { Link, Navigate, Route, Routes } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  addUserSearchQuery,
  fetchNodeStatus,
  fetchProjects,
  fetchUserCart,
  fetchUserSearchQueries,
  ResponseError,
  updateUserCart,
  updateUserSearchQuery,
} from '../../api';
import {
  clearDeprecatedStorageKeys,
  combineCarts,
  getStyle,
  searchAlreadyExists,
  showError,
  showNotice,
} from '../../common/utils';
import { useProjectsConfig } from '../../common/useProjectsConfig';
import { AuthContext } from '../../contexts/AuthContext';
import Cart from '../Cart';
import Summary from '../Cart/Summary';
import { UserCart, UserSearchQueries } from '../Cart/types';
import Facets from '../Facets';
import { RawProject } from '../Facets/types';
import NavBar from '../NavBar/index';
import NodeStatus from '../NodeStatus';
import NodeSummary from '../NodeStatus/NodeSummary';
import Search from '../Search';
import { ActiveSearchQuery, RawSearchResult, RawSearchResults } from '../Search/types';
import Support from '../Support';
import StartPopup from '../Messaging/StartPopup';
import './App.css';
import { miscTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import Footer from '../Footer/Footer';
import {
  isDarkModeAtom,
  userCartAtom,
  cartItemSelectionsAtom,
  userSearchQueriesAtom,
  activeSearchQueryAtom,
  supportModalVisibleAtom,
  nodeStatusAtom,
} from '../../common/atoms';
import Banner from '../Messaging/Banner';

const useHotjar = (): void => {
  /* istanbul ignore else -- @preserve */
  if (window.METAGRID.HOTJAR_ID != null && window.METAGRID.HOTJAR_SV != null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      /* istanbul ignore next -- @preserve */
      hotjar.initialize({
        id: Number(window.METAGRID.HOTJAR_ID),
        sv: Number(window.METAGRID.HOTJAR_SV),
      });
    }, []);
  }
};

export type Props = {
  searchQuery: ActiveSearchQuery;
};

const App: React.FC<React.PropsWithChildren<Props>> = ({ searchQuery }) => {
  // Clear deprectated local storage
  clearDeprecatedStorageKeys();

  // Global states
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const [userCart, setUserCart] = useAtom<UserCart>(userCartAtom);

  const [itemSelections, setItemSelections] = useAtom<RawSearchResults>(cartItemSelectionsAtom);

  const [userSearchQueries, setUserSearchQueries] =
    useAtom<UserSearchQueries>(userSearchQueriesAtom);

  const setActiveSearchQuery = useSetAtom(activeSearchQueryAtom);

  const setSupportModalVisible = useSetAtom(supportModalVisibleAtom);

  // Load projects configuration (includes STAC projects from projects.json)
  const { config: projectsConfig, loading: configLoading } = useProjectsConfig();

  // Third-party tool integration
  useHotjar();

  const [messageApi, contextHolder] = message.useMessage();

  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  const { defaultAlgorithm, darkAlgorithm } = theme;

  const {
    run: runFetchNodeStatus,
    data: loadedNodeStatus,
    error: nodeStatusApiError,
    isLoading: nodeStatusIsLoading,
  } = useAsync({
    deferFn: fetchNodeStatus,
  });

  const styles = getStyle(isDarkMode);

  const setNodeStatus = useSetAtom(nodeStatusAtom);

  React.useEffect(() => {
    /* istanbul ignore else -- @preserve */
    if (isAuthenticated) {
      fetchUserCart(pk, accessToken)
        .then((rawUserCart) => {
          const databaseItems = rawUserCart.items as RawSearchResults;
          const combinedCarts = combineCarts(databaseItems, userCart);
          updateUserCart(pk, accessToken, combinedCarts);
          setUserCart(combinedCarts);
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });

      fetchUserSearchQueries(accessToken)
        .then((rawUserSearches) => {
          const databaseItems = rawUserSearches.results;

          // Repair or remove corrupted local searches before syncing
          const repairedLocalSearches = userSearchQueries.filter((query) => {
            // Basic validation - if missing critical fields, remove it
            return query.project && query.project.name && query.uuid && query.url;
          });

          // Separate local searches into new ones and updates to existing database items
          const searchQueriesToAdd: UserSearchQueries = [];
          const searchQueriesToUpdate: UserSearchQueries = [];

          repairedLocalSearches.forEach((localQuery) => {
            const dbMatch = databaseItems.find((dbQuery) => dbQuery.uuid === localQuery.uuid);
            if (dbMatch) {
              // Check if local version has newer subscription data or other changes
              const hasChanges =
                localQuery.isSubscribed !== dbMatch.isSubscribed ||
                localQuery.lastCheckedTime !== dbMatch.lastCheckedTime ||
                localQuery.minCreatedDate !== dbMatch.minCreatedDate ||
                localQuery.maxCreatedDate !== dbMatch.maxCreatedDate ||
                localQuery.filterCreatedSince !== dbMatch.filterCreatedSince;

              if (hasChanges) {
                searchQueriesToUpdate.push(localQuery);
              }
            } else if (!searchAlreadyExists(databaseItems, localQuery)) {
              // This is a new search that doesn't exist in database
              searchQueriesToAdd.push(localQuery);
            }
          });

          /* istanbul ignore next -- @preserve */
          // Add new searches to database
          searchQueriesToAdd.forEach((query) => {
            addUserSearchQuery(pk, accessToken, query);
          });

          /* istanbul ignore next -- @preserve */
          // Update existing searches in database with local changes
          searchQueriesToUpdate.forEach((query) => {
            updateUserSearchQuery(query.uuid, accessToken, query);
          });

          // Combine all searches: updated local + new local + database items
          const combinedItems = [...searchQueriesToAdd, ...databaseItems];

          // Apply updates from local to database items
          const updatedItems = combinedItems.map((item) => {
            const updateMatch = searchQueriesToUpdate.find((upd) => upd.uuid === item.uuid);
            return updateMatch || item;
          });

          // Remove all duplicates
          const dedupedSearches: UserSearchQueries = [];
          updatedItems.forEach((search) => {
            /* istanbul ignore else -- @preserve */
            if (!searchAlreadyExists(dedupedSearches, search)) {
              dedupedSearches.push(search);
            }
          });

          setUserSearchQueries(dedupedSearches);

          // Show message if any local searches were removed during sync
          const removedCount = userSearchQueries.length - repairedLocalSearches.length;
          if (removedCount > 0) {
            showError(
              messageApi,
              `Removed ${removedCount} corrupted search${removedCount > 1 ? 'es' : ''} during sync`,
            );
          }
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });
    }
  }, [isAuthenticated, pk, accessToken]);

  React.useEffect(() => {
    /* istanbul ignore else -- @preserve */
    const showStatus = window.METAGRID.STATUS_URL !== null;
    if (showStatus) {
      runFetchNodeStatus();
    }
    const interval = setInterval(
      /* istanbul ignore next -- @preserve */
      () => {
        if (window.METAGRID.STATUS_URL !== null) {
          runFetchNodeStatus();
        }
      },
      295000,
    );
    return () => clearInterval(interval);
  }, [runFetchNodeStatus]);

  React.useEffect(() => {
    // Wait for projects config to load before fetching projects
    if (configLoading) {
      return;
    }

    fetchProjects(projectsConfig)
      .then((data) => {
        const projectName = searchQuery ? searchQuery.project.name : '';
        /* istanbul ignore else -- @preserve */
        if (data && projectName && projectName !== '') {
          const rawProj: RawProject | undefined = data.results.find((proj) => {
            return proj.name.toLowerCase() === (projectName as string).toLowerCase();
          });
          /* istanbul ignore next -- @preserve */
          if (rawProj) {
            setActiveSearchQuery({ ...searchQuery, project: rawProj });
          } else if (!searchQuery.project.pk) {
            // Only show error if we have a project name from URL but it's not a full project object yet
            // (This prevents showing error if activeSearchQuery was already set elsewhere)
            showError(
              messageApi,
              `Project "${projectName as string}" not found. Please select a valid project from the dropdown.`,
            );
          }
        }
      })
      .catch(
        /* istanbul ignore next -- @preserve */
        (error: ResponseError) => {
          showError(messageApi, error.message);
        },
      );
  }, [configLoading, projectsConfig]);

  React.useEffect(() => {
    if (loadedNodeStatus) {
      setNodeStatus(loadedNodeStatus);
    }
  }, [loadedNodeStatus]);

  const handleUpdateCart = (selectedItems: RawSearchResults, operation: 'add' | 'remove'): void => {
    let newCart: UserCart = [];
    let newSelections: RawSearchResults = [];

    /* istanbul ignore else -- @preserve */
    if (operation === 'add') {
      const itemsNotInCart = selectedItems.filter(
        (item: RawSearchResult) => !userCart.some((dataset) => dataset.id === item.id),
      );

      newCart = [...userCart, ...itemsNotInCart];
      newSelections = [...itemSelections, ...itemsNotInCart];
      setUserCart(newCart);
      setItemSelections(newSelections);

      showNotice(messageApi, 'Added item(s) to your cart', {
        icon: <ShoppingCartOutlined style={styles.messageAddIcon} />,
      });
    } else if (operation === 'remove') {
      newCart = userCart.filter((item) =>
        selectedItems.some((dataset: RawSearchResult) => dataset.id !== item.id),
      );

      newSelections = itemSelections.filter((item) =>
        selectedItems.some((dataset: RawSearchResult) => dataset.id !== item.id),
      );

      setUserCart(newCart);
      setItemSelections(newSelections);

      showNotice(messageApi, 'Removed item(s) from your cart', {
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    }

    /* istanbul ignore else -- @preserve */
    if (isAuthenticated) {
      updateUserCart(pk, accessToken, newCart);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 3,
        },
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <Layout className={isDarkMode ? 'dark-mode' : ''}>
        <Routes>
          <Route path="*" element={<NavBar />} />
        </Routes>
        <Layout id="body-layout">
          {contextHolder}
          <Routes>
            <Route path="/" element={<Navigate to="/search" />} />
            <Route path="/cart" element={<Navigate to="/cart/items" />} />
            <Route
              path="/search/*"
              element={
                <Layout.Sider style={styles.bodySider} width={styles.bodySider.width as number}>
                  <Facets />
                </Layout.Sider>
              }
            />
            <Route
              path="/nodes"
              element={
                <Layout.Sider style={styles.bodySider} width={styles.bodySider.width as number}>
                  <NodeSummary />
                </Layout.Sider>
              }
            />
            <Route
              path="/cart/*"
              element={
                <Layout.Sider style={styles.bodySider} width={styles.bodySider.width as number}>
                  <Summary />
                </Layout.Sider>
              }
            />
          </Routes>
          <Layout>
            <Layout.Content style={styles.bodyContent}>
              <Banner />
              <Routes>
                <Route
                  path="/search/*"
                  element={
                    <>
                      <Breadcrumb
                        items={[
                          {
                            title: (
                              <>
                                <HomeOutlined /> Home
                              </>
                            ),
                          },
                        ]}
                      />
                      <Search onUpdateCart={handleUpdateCart} />
                    </>
                  }
                />
                <Route
                  path="/nodes"
                  element={
                    <>
                      <Breadcrumb
                        items={[
                          {
                            title: (
                              <Link to="/">
                                <HomeOutlined /> Home
                              </Link>
                            ),
                          },
                          { title: 'Data Node Status' },
                        ]}
                      />
                      <NodeStatus
                        apiError={nodeStatusApiError as ResponseError}
                        isLoading={nodeStatusIsLoading}
                      />
                    </>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <>
                      <Breadcrumb
                        items={[
                          {
                            title: (
                              <Link to="../">
                                <HomeOutlined /> Home
                              </Link>
                            ),
                          },
                          { title: 'Cart' },
                        ]}
                      />
                      <Cart onUpdateCart={handleUpdateCart} />
                    </>
                  }
                >
                  <Route path="*" element={<div />} />
                </Route>
                <Route
                  path="*"
                  element={
                    <Result
                      status="404"
                      title="404"
                      subTitle="Sorry, the page you visited does not exist."
                      extra={
                        <Button type="primary">
                          <Link to="/">Back to Home</Link>
                        </Button>
                      }
                    />
                  }
                />
              </Routes>
            </Layout.Content>
            <Layout.Footer>
              <Footer />
            </Layout.Footer>
          </Layout>
        </Layout>
        <Affix
          className={miscTargets.questionBtn.class()}
          style={{
            position: 'absolute',
            bottom: 50,
            right: 50,
          }}
        >
          <FloatButton
            type="primary"
            shape="circle"
            style={{ width: '48px', height: '48px' }}
            icon={<QuestionOutlined style={{ fontSize: '28px', marginLeft: '-5px' }} />}
            onClick={() => setSupportModalVisible(true)}
          />
        </Affix>
        <Support />
        <StartPopup />
      </Layout>
    </ConfigProvider>
  );
};

export default App;
