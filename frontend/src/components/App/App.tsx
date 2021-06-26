/* eslint-disable no-void */
import {
  BookOutlined,
  DeleteOutlined,
  HomeOutlined,
  QuestionOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Affix, Breadcrumb, Button, Layout, message, Result } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import ReactGA from 'react-ga';
import { hotjar } from 'react-hotjar';
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  addUserSearchQuery,
  deleteUserSearchQuery,
  fetchNodeStatus,
  fetchUserCart,
  fetchUserSearchQueries,
  ResponseError,
  updateUserCart,
} from '../../api';
import { CSSinJS } from '../../common/types';
import { AuthContext } from '../../contexts/AuthContext';
import { gaTrackingID, hjid, hjsv } from '../../env';
import Cart from '../Cart';
import Summary from '../Cart/Summary';
import { UserCart, UserSearchQueries, UserSearchQuery } from '../Cart/types';
import { TagType, TagValue } from '../DataDisplay/Tag';
import Facets from '../Facets';
import { ActiveFacets, ParsedFacets, RawProject } from '../Facets/types';
import NavBar from '../NavBar';
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
import './App.css';

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

const useGoogleAnalytics = (): void => {
  const location = useLocation();

  React.useEffect(() => {
    /* istanbul ignore next */
    if (gaTrackingID) {
      ReactGA.initialize(gaTrackingID);
      ReactGA.pageview(location.pathname + location.search);
    }
  }, [location]);
};

const useHotjar = (): void => {
  React.useEffect(() => {
    /* istanbul ignore next */
    if (hjid && hjsv) {
      hotjar.initialize(hjid, hjsv);
    }
  }, []);
};

const App: React.FC = () => {
  // Third-party tool integration
  useGoogleAnalytics();
  useHotjar();

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
    JSON.parse(localStorage.getItem('userCart') || '[]')
  );
  const [userSearchQueries, setUserSearchQueries] = React.useState<
    UserSearchQueries | []
  >(JSON.parse(localStorage.getItem('userSearchQueries') || '[]'));

  React.useEffect(() => {
    /* istanbul ignore else */
    if (isAuthenticated) {
      void fetchUserCart(pk as string, accessToken as string)
        .then((rawUserCart) => {
          setUserCart(rawUserCart.items);
        })
        .catch((error: ResponseError) => {
          void message.error({
            content: error.message,
          });
        });

      void fetchUserSearchQueries(accessToken as string)
        .then((rawUserSearches) => {
          setUserSearchQueries(rawUserSearches.results);
        })
        .catch((error: ResponseError) => {
          void message.error({
            content: error.message,
          });
        });
    }
  }, [isAuthenticated, pk, accessToken]);

  React.useEffect(() => {
    /* istanbul ignore else */
    if (!isAuthenticated) {
      localStorage.setItem('userCart', JSON.stringify(userCart));
    }
  }, [isAuthenticated, userCart]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(
        'userSearchQueries',
        JSON.stringify(userSearchQueries)
      );
    }
  }, [isAuthenticated, userSearchQueries]);

  React.useEffect(() => {
    /* istanbul ignore else */
    runFetchNodeStatus();
    const interval = setInterval(() => {
      runFetchNodeStatus();
    }, 295000);
    return () => clearInterval(interval);
  }, [runFetchNodeStatus]);

  const handleTextSearch = (
    selectedProject: RawProject,
    text: string
  ): void => {
    if (activeSearchQuery.textInputs.includes(text as never)) {
      void message.error(`Input "${text}" has already been applied`);
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
      void message.error(`Input "${filenameVar}" has already been applied`);
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
    setActiveSearchQuery(projectBaseQuery(selectedProject));
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

      void message.success({
        content: 'Added item(s) to your cart',
        icon: <ShoppingCartOutlined style={styles.messageAddIcon} />,
      });
    } else if (operation === 'remove') {
      newCart = userCart.filter((item) =>
        selectedItems.some((dataset: RawSearchResult) => dataset.id !== item.id)
      );
      setUserCart(newCart);

      void message.success({
        content: 'Removed item(s) from your cart',
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    }

    /* istanbul ignore else */
    if (isAuthenticated) {
      void updateUserCart(pk as string, accessToken as string, newCart);
    }
  };

  const handleClearCart = (): void => {
    setUserCart([]);

    /* istanbul ignore else */
    if (isAuthenticated) {
      void updateUserCart(pk as string, accessToken as string, []);
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

    const saveSuccess = (): void => {
      setUserSearchQueries([...userSearchQueries, savedSearch]);
      void message.success({
        content: 'Saved search query to your library',
        icon: <BookOutlined style={styles.messageAddIcon} />,
      });
    };

    if (isAuthenticated) {
      void addUserSearchQuery(pk as string, accessToken as string, savedSearch)
        .then(() => {
          saveSuccess();
        })
        .catch((error: ResponseError) => {
          void message.error({
            content: error.message,
          });
        });
    } else {
      saveSuccess();
    }
  };

  const handleRemoveSearchQuery = (searchUUID: string): void => {
    const deleteSuccess = (): void => {
      setUserSearchQueries(
        userSearchQueries.filter(
          (searchItem: UserSearchQuery) => searchItem.uuid !== searchUUID
        )
      );
      void message.success({
        content: 'Removed search query from your library',
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    };

    if (isAuthenticated) {
      void deleteUserSearchQuery(searchUUID, accessToken as string)
        .then(() => {
          deleteSuccess();
        })
        .catch((error: ResponseError) => {
          void message.error({
            content: error.message,
          });
        });
    } else {
      deleteSuccess();
    }
  };

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

  return (
    <>
      <Switch>
        <Redirect from="/" exact to="/search" />
        <Redirect from="/cart" exact to="/cart/items" />
      </Switch>
      <div>
        <Route
          path="/"
          render={() => (
            <NavBar
              numCartItems={userCart.length}
              numSavedSearches={userSearchQueries.length}
              onTextSearch={handleTextSearch}
            ></NavBar>
          )}
        />
        <Layout id="body-layout">
          <Switch>
            <Route
              path="/search"
              render={() => (
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
              )}
            />
            <Route
              path="/nodes"
              render={() => (
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width as number}
                >
                  <NodeSummary nodeStatus={nodeStatus} />
                </Layout.Sider>
              )}
            />
            <Route
              path="/cart"
              render={() => (
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width as number}
                >
                  <Summary userCart={userCart} />
                </Layout.Sider>
              )}
            />
          </Switch>
          <Layout.Content style={styles.bodyContent}>
            <Switch>
              <Route
                path="/search"
                render={() => (
                  <>
                    <Breadcrumb>
                      <Breadcrumb.Item>
                        <HomeOutlined /> Home
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>Search</Breadcrumb.Item>
                    </Breadcrumb>
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
                    ></Search>
                  </>
                )}
              />
              <Route
                path="/nodes"
                render={() => (
                  <>
                    <Breadcrumb>
                      <Breadcrumb.Item>
                        <HomeOutlined /> Home
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>Data Node Status</Breadcrumb.Item>
                    </Breadcrumb>
                    <NodeStatus
                      nodeStatus={nodeStatus}
                      apiError={nodeStatusApiError as ResponseError}
                      isLoading={nodeStatusIsLoading}
                    />
                  </>
                )}
              />
              <Route
                path="/cart"
                render={() => (
                  <>
                    <Breadcrumb>
                      <Breadcrumb.Item>
                        <HomeOutlined /> Home
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>Cart</Breadcrumb.Item>
                    </Breadcrumb>
                    <Cart
                      userCart={userCart}
                      userSearchQueries={userSearchQueries}
                      onUpdateCart={handleUpdateCart}
                      onClearCart={handleClearCart}
                      onRunSearchQuery={handleRunSearchQuery}
                      onRemoveSearchQuery={handleRemoveSearchQuery}
                    />
                  </>
                )}
              />
              <Route
                render={() => (
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
                )}
              />
            </Switch>
          </Layout.Content>
        </Layout>
        <Affix style={{ position: 'fixed', bottom: 70, right: 45 }}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<QuestionOutlined style={{ fontSize: '24px' }} />}
            onClick={() => setSupportModalVisible(true)}
          ></Button>
        </Affix>
        <Support
          visible={supportModalVisible}
          onClose={() => setSupportModalVisible(false)}
        />
      </div>
    </>
  );
};

export default App;
