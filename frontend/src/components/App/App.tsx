import {
  BookOutlined,
  DeleteOutlined,
  HomeOutlined,
  QuestionOutlined,
  ShareAltOutlined,
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
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useAsync } from 'react-async';
import { hotjar } from 'react-hotjar';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  addUserSearchQuery,
  deleteUserSearchQuery,
  fetchNodeStatus,
  fetchProjects,
  fetchUserCart,
  fetchUserSearchQueries,
  ResponseError,
  updateUserCart,
} from '../../api';
import { CSSinJS } from '../../common/types';
import {
  combineCarts,
  getUrlFromSearch,
  searchAlreadyExists,
  showError,
  showNotice,
  unsavedLocalSearches,
} from '../../common/utils';
import { AuthContext } from '../../contexts/AuthContext';
import Cart from '../Cart';
import Summary from '../Cart/Summary';
import { UserCart, UserSearchQueries, UserSearchQuery } from '../Cart/types';
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
import { miscTargets } from '../../common/reactJoyrideSteps';
import {
  activeSearchQueryAtom,
  isDarkModeAtom,
  supportModalVisibleAtom,
  userCartAtom,
  userSearchQueriesAtom,
} from './recoil/atoms';
import Footer from '../Footer/Footer';
import { cartItemSelectionsAtom } from '../Cart/recoil/atoms';

const bodySider = {
  padding: '12px 12px 12px 12px',
  width: '384px',
  marginRight: '2px',
};

const bodySiderDark = {
  background: 'rgba(255, 255, 255, 0.1)',
};
const bodySiderLight = {
  background: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '2px 0 4px 0 rgba(0, 0, 0, 0.2)',
};

const useHotjar = (): void => {
  if (window.METAGRID.HOTJAR_ID != null && window.METAGRID.HOTJAR_SV != null) {
    React.useEffect(() => {
      /* istanbul ignore next */
      hotjar.initialize(Number(window.METAGRID.HOTJAR_ID), Number(window.METAGRID.HOTJAR_SV));
    }, []);
  }
};

// Provides appropriate styling based on current theme
function getStyle(isDark: boolean): CSSinJS {
  const colorsToUse = isDark ? bodySiderDark : bodySiderLight;
  const styles: CSSinJS = {
    bodySider: {
      ...bodySider,
      ...colorsToUse,
    },
    bodyContent: { padding: '12px 12px', margin: 0 },
    messageAddIcon: { color: '#90EE90' },
    messageRemoveIcon: { color: '#ff0000' },
  };

  return styles;
}

export type Props = {
  searchQuery: ActiveSearchQuery;
};

const App: React.FC<React.PropsWithChildren<Props>> = ({ searchQuery }) => {
  // Recoil state
  const [isDarkMode] = useRecoilState<boolean>(isDarkModeAtom);

  const [userCart, setUserCart] = useRecoilState<UserCart>(userCartAtom);

  const [itemSelections, setItemSelections] = useRecoilState<RawSearchResults>(
    cartItemSelectionsAtom
  );

  const [userSearchQueries, setUserSearchQueries] = useRecoilState<UserSearchQueries>(
    userSearchQueriesAtom
  );

  const [activeSearchQuery, setActiveSearchQuery] = useRecoilState<ActiveSearchQuery>(
    activeSearchQueryAtom
  );

  const setSupportModalVisible = useSetRecoilState<boolean>(supportModalVisibleAtom);

  // Third-party tool integration
  useHotjar();

  const [messageApi, contextHolder] = message.useMessage();

  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  const { defaultAlgorithm, darkAlgorithm } = theme;

  const styles = getStyle(isDarkMode);

  const {
    run: runFetchNodeStatus,
    data: nodeStatus,
    error: nodeStatusApiError,
    isLoading: nodeStatusIsLoading,
  } = useAsync({
    deferFn: fetchNodeStatus,
  });

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

  const handleClearCart = (): void => {
    setUserCart([]);

    setItemSelections([]);

    /* istanbul ignore else */
    if (isAuthenticated) {
      updateUserCart(pk, accessToken, []);
    }
  };

  const handleSaveSearchQuery = (url: string): void => {
    const savedSearch: UserSearchQuery = {
      uuid: uuidv4(),
      user: pk,
      project: activeSearchQuery.project as RawProject,
      projectId: activeSearchQuery.project.pk as string,
      versionType: activeSearchQuery.versionType,
      resultType: activeSearchQuery.resultType,
      minVersionDate: activeSearchQuery.minVersionDate,
      maxVersionDate: activeSearchQuery.maxVersionDate,
      filenameVars: activeSearchQuery.filenameVars,
      activeFacets: activeSearchQuery.activeFacets,
      textInputs: activeSearchQuery.textInputs,
      url,
    };

    if (searchAlreadyExists(userSearchQueries, savedSearch)) {
      showNotice(messageApi, 'Search query is already in your library', {
        icon: <BookOutlined style={styles.messageAddIcon} />,
        type: 'info',
      });
      return;
    }

    const saveSuccess = (): void => {
      setUserSearchQueries([...userSearchQueries, savedSearch]);
      showNotice(messageApi, 'Saved search query to your library', {
        icon: <BookOutlined style={styles.messageAddIcon} />,
      });
    };

    if (isAuthenticated) {
      addUserSearchQuery(pk, accessToken, savedSearch)
        .then(() => {
          saveSuccess();
        })
        .catch(
          /* istanbul ignore next */
          (error: ResponseError) => {
            showError(messageApi, error.message);
          }
        );
    } else {
      saveSuccess();
    }
  };

  const handleShareSearchQuery = (): void => {
    /* istanbul ignore else */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(getUrlFromSearch(activeSearchQuery));
      showNotice(messageApi, 'Search copied to clipboard!', {
        icon: <ShareAltOutlined style={styles.messageAddIcon} />,
      });
    }
  };

  const handleRemoveSearchQuery = (searchUUID: string): void => {
    const deleteSuccess = (): void => {
      setUserSearchQueries(
        userSearchQueries.filter((searchItem: UserSearchQuery) => searchItem.uuid !== searchUUID)
      );
      showNotice(messageApi, 'Removed search query from your library', {
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
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
                  <NodeSummary nodeStatus={nodeStatus} />
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
                      <Search
                        activeSearchQuery={activeSearchQuery}
                        userCart={userCart}
                        onUpdateCart={handleUpdateCart}
                        onSaveSearchQuery={handleSaveSearchQuery}
                        onShareSearchQuery={handleShareSearchQuery}
                      ></Search>
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
                      <Cart
                        userCart={userCart}
                        userSearchQueries={userSearchQueries}
                        onUpdateCart={handleUpdateCart}
                        onClearCart={handleClearCart}
                        onRemoveSearchQuery={handleRemoveSearchQuery}
                      />
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
