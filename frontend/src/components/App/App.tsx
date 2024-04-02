/* eslint-disable no-void */

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
} from 'antd';
import React, { ReactElement } from 'react';
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
import { hjid, hjsv, previousPublicUrl, publicUrl } from '../../env';
import Cart from '../Cart';
import Summary from '../Cart/Summary';
import { UserCart, UserSearchQueries, UserSearchQuery } from '../Cart/types';
import { TagType, TagValue } from '../DataDisplay/Tag';
import Facets from '../Facets';
import { ActiveFacets, ParsedFacets, RawProject } from '../Facets/types';
import NavBar from '../NavBar/index';
import NodeStatus from '../NodeStatus';
import NodeSummary from '../NodeStatus/NodeSummary';
import Search from '../Search';
import {
  ActiveSearchQuery,
  RawSearchResult,
  RawSearchResults,
  ResultType,
  VersionDate,
  VersionType,
} from '../Search/types';
import Support from '../Support';
import StartPopup from '../Messaging/StartPopup';
import startupDisplayData from '../Messaging/messageDisplayData';
import './App.css';
import { miscTargets } from '../../common/reactJoyrideSteps';

const styles: CSSinJS = {
  bodySider: {
    background: '#fff',
    padding: '12px 12px 12px 12px',
    width: '384px',
    marginRight: '2px',
    boxShadow: '2px 0 4px 0 rgba(0, 0, 0, 0.2)',
  },
  bodyContent: { padding: '12px 12px', margin: 0 },
  messageAddIcon: { color: '#90EE90' },
  messageRemoveIcon: { color: '#ff0000' },
};

const useHotjar = (): void => {
  React.useEffect(() => {
    /* istanbul ignore next */
    if (hjid && hjsv) {
      hotjar.initialize(hjid, hjsv);
    }
  }, []);
};

export type Props = {
  searchQuery: ActiveSearchQuery;
};

const metagridVersion: string = startupDisplayData.messageToShow;

const App: React.FC<React.PropsWithChildren<Props>> = ({ searchQuery }) => {
  // Third-party tool integration
  useHotjar();

  const [messageApi, contextHolder] = message.useMessage();

  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  const [supportModalVisible, setSupportModalVisible] = React.useState<boolean>(
    false
  );

  const {
    run: runFetchNodeStatus,
    data: nodeStatus,
    error: nodeStatusApiError,
    isLoading: nodeStatusIsLoading,
  } = useAsync({
    deferFn: fetchNodeStatus,
  });

  const projectBaseQuery = (
    project: Record<string, unknown> | RawProject
  ): ActiveSearchQuery => ({
    project,
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: null,
    maxVersionDate: null,
    filenameVars: [],
    activeFacets: {},
    textInputs: [],
  });

  const [
    activeSearchQuery,
    setActiveSearchQuery,
  ] = React.useState<ActiveSearchQuery>(projectBaseQuery({}));

  const [availableFacets, setAvailableFacets] = React.useState<
    ParsedFacets | Record<string, unknown>
  >({});

  const [userCart, setUserCart] = React.useState<UserCart | []>(
    JSON.parse(localStorage.getItem('userCart') || '[]') as RawSearchResults
  );

  const [userSearchQueries, setUserSearchQueries] = React.useState<
    UserSearchQueries | []
  >(
    JSON.parse(
      localStorage.getItem('userSearchQueries') || '[]'
    ) as UserSearchQueries
  );

  React.useEffect(() => {
    /* istanbul ignore else */
    if (isAuthenticated) {
      void fetchUserCart(pk, accessToken)
        .then((rawUserCart) => {
          /* istanbul ignore next */
          const localItems = JSON.parse(
            localStorage.getItem('userCart') || '[]'
          ) as RawSearchResults;
          const databaseItems = rawUserCart.items as RawSearchResults;
          const combinedCarts = combineCarts(databaseItems, localItems);
          void updateUserCart(pk, accessToken, combinedCarts);
          setUserCart(combinedCarts);
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });

      void fetchUserSearchQueries(accessToken)
        .then((rawUserSearches) => {
          /* istanbul ignore next */
          const localItems = JSON.parse(
            localStorage.getItem('userSearchQueries') || '[]'
          ) as UserSearchQueries;
          const databaseItems = rawUserSearches.results;
          const searchQueriesToAdd = unsavedLocalSearches(
            databaseItems,
            localItems
          );
          /* istanbul ignore next */
          searchQueriesToAdd.forEach((query) => {
            void addUserSearchQuery(pk, accessToken, query);
          });
          setUserSearchQueries(databaseItems.concat(searchQueriesToAdd));
        })
        .catch((error: ResponseError) => {
          showError(messageApi, error.message);
        });
    }
  }, [isAuthenticated, pk, accessToken]);

  React.useEffect(() => {
    localStorage.setItem('userCart', JSON.stringify(userCart));
  }, [isAuthenticated, userCart]);

  React.useEffect(() => {
    localStorage.setItem(
      'userSearchQueries',
      JSON.stringify(userSearchQueries)
    );
  }, [isAuthenticated, userSearchQueries]);

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
            return (
              proj.name.toLowerCase() === (projectName as string).toLowerCase()
            );
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

  const handleTextSearch = (
    selectedProject: RawProject,
    text: string
  ): void => {
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

  const handleOnSetFilenameVars = (filenameVar: string): void => {
    if (activeSearchQuery.filenameVars.includes(filenameVar as never)) {
      showError(messageApi, `Input "${filenameVar}" has already been applied`);
    } else {
      setActiveSearchQuery({
        ...activeSearchQuery,
        filenameVars: [...activeSearchQuery.filenameVars, filenameVar],
      });
    }
  };

  const handleOnSetGeneralFacets = (
    versionType: VersionType,
    resultType: ResultType,
    minVersionDate: VersionDate,
    maxVersionDate: VersionDate
  ): void => {
    setActiveSearchQuery({
      ...activeSearchQuery,
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
    });
  };

  const handleOnSetActiveFacets = (activeFacets: ActiveFacets): void => {
    setActiveSearchQuery({ ...activeSearchQuery, activeFacets });
  };

  const handleClearFilters = (): void => {
    setActiveSearchQuery(projectBaseQuery(activeSearchQuery.project));
  };

  const handleProjectChange = (selectedProject: RawProject): void => {
    if (selectedProject.pk !== activeSearchQuery.project.pk) {
      setActiveSearchQuery(projectBaseQuery(selectedProject));
    } else {
      setActiveSearchQuery({ ...activeSearchQuery, project: selectedProject });
    }
  };

  const handleRemoveFilter = (removedTag: TagValue, type: TagType): void => {
    /* istanbul ignore else */
    if (type === 'text') {
      setActiveSearchQuery({
        ...activeSearchQuery,
        textInputs: activeSearchQuery.textInputs.filter(
          (input) => input !== removedTag
        ),
      });
    } else if (type === 'filenameVar') {
      setActiveSearchQuery({
        ...activeSearchQuery,
        filenameVars: activeSearchQuery.filenameVars.filter(
          (input) => input !== removedTag
        ),
      });
    } else if (type === 'facet') {
      const prevActiveFacets = activeSearchQuery.activeFacets as ActiveFacets;

      const facet = (removedTag[0] as unknown) as string;
      const facetOption = (removedTag[1] as unknown) as string;
      const updateFacet = {
        [facet]: prevActiveFacets[facet].filter((item) => item !== facetOption),
      };

      if (updateFacet[facet].length === 0) {
        delete prevActiveFacets[facet];
        setActiveSearchQuery({
          ...activeSearchQuery,
          activeFacets: { ...prevActiveFacets },
        });
      } else {
        setActiveSearchQuery({
          ...activeSearchQuery,
          activeFacets: { ...prevActiveFacets, ...updateFacet },
        });
      }
    }
  };

  const handleUpdateCart = (
    selectedItems: RawSearchResults,
    operation: 'add' | 'remove'
  ): void => {
    let newCart: UserCart = [];

    /* istanbul ignore else */
    if (operation === 'add') {
      const itemsNotInCart = selectedItems.filter(
        (item: RawSearchResult) =>
          !userCart.some((dataset) => dataset.id === item.id)
      );

      newCart = [...userCart, ...itemsNotInCart];
      setUserCart(newCart);
      showNotice(messageApi, 'Added item(s) to your cart', {
        icon: <ShoppingCartOutlined style={styles.messageAddIcon} />,
      });
    } else if (operation === 'remove') {
      newCart = userCart.filter((item) =>
        selectedItems.some((dataset: RawSearchResult) => dataset.id !== item.id)
      );
      setUserCart(newCart);

      showNotice(messageApi, 'Removed item(s) from your cart', {
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    }

    /* istanbul ignore else */
    if (isAuthenticated) {
      void updateUserCart(pk, accessToken, newCart);
    }
  };

  const handleClearCart = (): void => {
    setUserCart([]);

    /* istanbul ignore else */
    if (isAuthenticated) {
      void updateUserCart(pk, accessToken, []);
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
      void addUserSearchQuery(pk, accessToken, savedSearch)
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
        userSearchQueries.filter(
          (searchItem: UserSearchQuery) => searchItem.uuid !== searchUUID
        )
      );
      showNotice(messageApi, 'Removed search query from your library', {
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    };

    if (isAuthenticated) {
      void deleteUserSearchQuery(searchUUID, accessToken)
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

  // This converts a saved search to the active search query
  const handleRunSearchQuery = (savedSearch: UserSearchQuery): void => {
    setActiveSearchQuery({
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

  /* istanbul ignore next */
  const generateRedirects = (): ReactElement => {
    if (!publicUrl && previousPublicUrl) {
      return (
        <Route
          path={`${previousPublicUrl}/*`}
          element={<Navigate to="/search" />}
        />
      );
    }

    return <></>;
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 3,
        },
      }}
    >
      <div>
        <Routes>
          <Route
            path="*"
            element={
              <NavBar
                numCartItems={userCart.length}
                numSavedSearches={userSearchQueries.length}
                onTextSearch={handleTextSearch}
                supportModalVisible={setSupportModalVisible}
              ></NavBar>
            }
          />
        </Routes>
        <Layout id="body-layout">
          {contextHolder}
          <Routes>
            <Route path="/" element={<Navigate to="/search" />} />
            <Route path="/cart" element={<Navigate to="/cart/items" />} />
            {generateRedirects()}
            <Route
              path="/search/*"
              element={
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width as number}
                >
                  <Facets
                    activeSearchQuery={activeSearchQuery}
                    availableFacets={availableFacets}
                    nodeStatus={nodeStatus}
                    onProjectChange={handleProjectChange}
                    onSetFilenameVars={handleOnSetFilenameVars}
                    onSetGeneralFacets={handleOnSetGeneralFacets}
                    onSetActiveFacets={handleOnSetActiveFacets}
                  />
                </Layout.Sider>
              }
            />
            <Route
              path="/nodes"
              element={
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width as number}
                >
                  <NodeSummary nodeStatus={nodeStatus} />
                </Layout.Sider>
              }
            />
            <Route
              path="/cart/*"
              element={
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width as number}
                >
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
                        nodeStatus={nodeStatus}
                        onUpdateAvailableFacets={(facets) =>
                          setAvailableFacets(facets)
                        }
                        onUpdateCart={handleUpdateCart}
                        onRemoveFilter={handleRemoveFilter}
                        onClearFilters={handleClearFilters}
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
                        nodeStatus={nodeStatus}
                        apiError={nodeStatusApiError as ResponseError}
                        isLoading={nodeStatusIsLoading}
                      />
                    </>
                  }
                />
                <Route
                  path="/cart/*"
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
                          { title: 'Cart' },
                        ]}
                      />
                      <Cart
                        userCart={userCart}
                        userSearchQueries={userSearchQueries}
                        onUpdateCart={handleUpdateCart}
                        onClearCart={handleClearCart}
                        onRunSearchQuery={handleRunSearchQuery}
                        onRemoveSearchQuery={handleRemoveSearchQuery}
                        nodeStatus={nodeStatus}
                      />
                    </>
                  }
                />
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
              <p style={{ fontSize: '10px' }}>
                Metagrid Version: {metagridVersion}
                <br />
                Privacy &amp; Legal Notice:{' '}
                <a href="https://www.llnl.gov/disclaimer.html">
                  https://www.llnl.gov/disclaimer.html
                </a>
                <br />
                Learn about the Department of Energy&apos;s Vulnerability
                Disclosure Program (VDP):{' '}
                <a href="https://doe.responsibledisclosure.com/hc/en-us">
                  https://doe.responsibledisclosure.com/hc/en-us
                </a>
              </p>
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
            icon={
              <QuestionOutlined
                style={{ fontSize: '28px', marginLeft: '-5px' }}
              />
            }
            onClick={() => setSupportModalVisible(true)}
          ></FloatButton>
        </Affix>
        <Support
          open={supportModalVisible}
          onClose={() => setSupportModalVisible(false)}
        />
        <StartPopup />
      </div>
    </ConfigProvider>
  );
};

export default App;
