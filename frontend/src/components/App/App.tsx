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
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  addUserSearchQuery,
  fetchNodeStatus,
  fetchProjects,
  fetchUserCart,
  fetchUserSearchQueries,
  ResponseError,
  updateUserCart,
} from '../../api';
import {
  combineCarts,
  getStyle,
  searchAlreadyExists,
  showError,
  showNotice,
  unsavedLocalSearches,
} from '../../common/utils';
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

const useHotjar = (): void => {
  if (window.METAGRID.HOTJAR_ID != null && window.METAGRID.HOTJAR_SV != null) {
    React.useEffect(() => {
      /* istanbul ignore next */
      hotjar.initialize(Number(window.METAGRID.HOTJAR_ID), Number(window.METAGRID.HOTJAR_SV));
    }, []);
  }
};

export type Props = {
  searchQuery: ActiveSearchQuery;
};

const App: React.FC<React.PropsWithChildren<Props>> = ({ searchQuery }) => {
  // Global states
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const [userCart, setUserCart] = useAtom<UserCart>(userCartAtom);

  const [itemSelections, setItemSelections] = useAtom<RawSearchResults>(cartItemSelectionsAtom);

  const setUserSearchQueries = useSetAtom(userSearchQueriesAtom);

  const [activeSearchQuery, setActiveSearchQuery] = useAtom<ActiveSearchQuery>(
    activeSearchQueryAtom
  );

  const setSupportModalVisible = useSetAtom(supportModalVisibleAtom);

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
    /* istanbul ignore else */
    if (isAuthenticated) {
      fetchUserCart(pk, accessToken)
        .then((rawUserCart) => {
          /* istanbul ignore next */
          const localItems = JSON.parse(
            localStorage.getItem('userCart') || '[]'
          ) as RawSearchResults;
          const databaseItems = rawUserCart.items as RawSearchResults;
          const combinedCarts = combineCarts(databaseItems, localItems);
          updateUserCart(pk, accessToken, combinedCarts);
          setUserCart(combinedCarts);
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });

      fetchUserSearchQueries(accessToken)
        .then((rawUserSearches) => {
          /* istanbul ignore next */
          const localItems = JSON.parse(
            localStorage.getItem('userSearchQueries') || '[]'
          ) as UserSearchQueries;
          const databaseItems = rawUserSearches.results;
          const searchQueriesToAdd = unsavedLocalSearches(databaseItems, localItems);
          /* istanbul ignore next */
          searchQueriesToAdd.forEach((query) => {
            addUserSearchQuery(pk, accessToken, query);
          });

          // Combine local and database saved searches
          const combinedItems = [...searchQueriesToAdd, ...databaseItems];

          // Remove all duplicates
          const dedupedSearches: UserSearchQueries = [];
          combinedItems.forEach((search) => {
            if (!searchAlreadyExists(dedupedSearches, search)) {
              dedupedSearches.push(search);
            }
          });

          setUserSearchQueries(dedupedSearches);
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });
    }
  }, [isAuthenticated, pk, accessToken]);

  React.useEffect(() => {
    /* istanbul ignore else */
    runFetchNodeStatus();
    const interval = setInterval(() => {
      runFetchNodeStatus();
    }, 295000);
    return () => clearInterval(interval);
  }, [runFetchNodeStatus]);

  React.useEffect(() => {
    fetchProjects()
      .then((data) => {
        const projectName = searchQuery ? searchQuery.project.name : '';
        /* istanbul ignore else */
        if (data && projectName && projectName !== '') {
          const rawProj: RawProject | undefined = data.results.find((proj) => {
            return proj.name.toLowerCase() === (projectName as string).toLowerCase();
          });
          /* istanbul ignore next */
          if (rawProj) {
            setActiveSearchQuery({ ...searchQuery, project: rawProj });
          }
        }
      })
      .catch(
        /* istanbul ignore next */
        (error: ResponseError) => {
          showError(messageApi, error.message);
        }
      );
  }, [fetchProjects]);

  React.useEffect(() => {
    if (loadedNodeStatus) {
      setNodeStatus(loadedNodeStatus);
    }
  }, [loadedNodeStatus]);

  const handleTextSearch = (selectedProject: RawProject, text: string): void => {
    if (activeSearchQuery.textInputs.includes(text as never)) {
      showError(messageApi, `Input "${text}" has already been applied`);
    } else {
      setActiveSearchQuery({
        ...activeSearchQuery,
        project: selectedProject,
        textInputs: [...activeSearchQuery.textInputs, text],
      });
    }
  };

  const handleUpdateCart = (selectedItems: RawSearchResults, operation: 'add' | 'remove'): void => {
    let newCart: UserCart = [];
    let newSelections: RawSearchResults = [];

    /* istanbul ignore else */
    if (operation === 'add') {
      const itemsNotInCart = selectedItems.filter(
        (item: RawSearchResult) => !userCart.some((dataset) => dataset.id === item.id)
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
        selectedItems.some((dataset: RawSearchResult) => dataset.id !== item.id)
      );

      newSelections = itemSelections.filter((item) =>
        selectedItems.some((dataset: RawSearchResult) => dataset.id !== item.id)
      );

      setUserCart(newCart);
      setItemSelections(newSelections);

      showNotice(messageApi, 'Removed item(s) from your cart', {
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    }

    /* istanbul ignore else */
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
      <Layout>
        <Routes>
          <Route path="*" element={<NavBar onTextSearch={handleTextSearch}></NavBar>} />
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
                  <Summary userCart={userCart} />
                </Layout.Sider>
              }
            />
          </Routes>
          <Layout>
            <Layout.Content style={styles.bodyContent}>
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
                      ></Breadcrumb>
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
                  <Route path="*" element={<></>} />
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
          ></FloatButton>
        </Affix>
        <Support />
        <StartPopup />
      </Layout>
    </ConfigProvider>
  );
};

export default App;
