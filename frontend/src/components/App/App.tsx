/* eslint-disable no-void */
import {
  BookOutlined,
  DeleteOutlined,
  HomeOutlined,
  QuestionOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Affix, Breadcrumb, Button, Layout, message } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  addUserSearchQuery,
  deleteUserSearchQuery,
  fetchNodeStatus,
  fetchUserCart,
  fetchUserSearchQueries,
  updateUserCart,
} from '../../api';
import { CSSinJS } from '../../common/types';
import { objectIsEmpty } from '../../common/utils';
import { AuthContext } from '../../contexts/AuthContext';
import Cart from '../Cart';
import Summary from '../Cart/Summary';
import { UserCart, UserSearchQueries, UserSearchQuery } from '../Cart/types';
import { TagType } from '../DataDisplay/Tag';
import Facets from '../Facets';
import {
  ActiveFacets,
  DefaultFacets,
  ParsedFacets,
  RawProject,
} from '../Facets/types';
import NavBar from '../NavBar';
import NodeStatus from '../NodeStatus';
import NodeSummary from '../NodeStatus/NodeSummary';
import Search from '../Search';
import { RawSearchResults, TextInputs } from '../Search/types';
import Support from '../Support';
import './App.css';

const styles: CSSinJS = {
  bodySider: {
    background: '#fff',
    padding: '48px 24px 24px 24px',
    width: '384px',
    marginRight: '2px',
    boxShadow: '2px 0 4px 0 rgba(0, 0, 0, 0.2)',
  },
  bodyContent: { padding: '48px 24px', margin: 0 },
  messageAddIcon: { color: '#90EE90' },
  messageRemoveIcon: { color: '#ff0000' },
};

const App: React.FC = () => {
  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  const [supportModalVisible, setSupportModalVisible] = React.useState<boolean>(
    false
  );

  const {
    data: nodeStatus,
    run: runFetchNodeStatus,
    isLoading: nodeStatusisLoading,
  } = useAsync({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deferFn: fetchNodeStatus,
  });

  const [activeProject, setActiveProject] = React.useState<
    RawProject | Record<string, unknown>
  >({});
  const [defaultFacets, setDefaultFacets] = React.useState<DefaultFacets>({
    latest: true,
    replica: false,
  });
  const [projectFacets, setProjectFacets] = React.useState<
    ParsedFacets | Record<string, unknown>
  >({});
  const [activeFacets, setActiveFacets] = React.useState<
    ActiveFacets | Record<string, unknown>
  >({});
  const [textInputs, setTextInputs] = React.useState<TextInputs | []>([]);

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
        .catch(() => {
          void message.error({
            content:
              'There was an issue fetching your cart. Please contact support or try again later.',
          });
        });

      void fetchUserSearchQueries(accessToken as string)
        .then((rawUserSearches) => {
          setUserSearchQueries(rawUserSearches.results);
        })
        .catch(() => {
          void message.error({
            content:
              'There was an issue fetching your saved searches. Please contact support or try again later.',
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

  const handleTextSearch = (text: string): void => {
    if (textInputs.includes(text as never)) {
      void message.error(`Input "${text}" has already been applied`);
    } else {
      setTextInputs([...textInputs, text]);
    }
  };

  const handleUpdateProjectFacets = (facets: ParsedFacets): void => {
    setProjectFacets(facets);
  };

  const handleClearFilters = (): void => {
    setTextInputs([]);
    setActiveFacets({});
    setDefaultFacets({ latest: true, replica: false });
  };

  const handleProjectChange = (selectedProject: RawProject): void => {
    if (!objectIsEmpty(activeProject) && activeProject !== selectedProject) {
      handleClearFilters();
    }

    setActiveProject(selectedProject);
    void message.loading(
      'Project selected. Please wait for results and facets to load...',
      2
    );
  };

  const handleRemoveFilter = (removedTag: TagType, type: string): void => {
    /* istanbul ignore else */
    if (type === 'text') {
      setTextInputs(() => textInputs.filter((input) => input !== removedTag));
    } else if (type === 'facet') {
      const prevActiveFacets = activeFacets as ActiveFacets;

      const facet = (removedTag[0] as unknown) as string;
      const facetOption = (removedTag[1] as unknown) as string;
      const updateFacet = {
        [facet]: prevActiveFacets[facet].filter((item) => item !== facetOption),
      };

      if (updateFacet[facet].length === 0) {
        delete prevActiveFacets[facet];
        setActiveFacets({ ...prevActiveFacets });
      } else {
        setActiveFacets({ ...prevActiveFacets, ...updateFacet });
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
      const itemsNotInCart = selectedItems.filter((item) => {
        return !userCart.includes(item as never);
      });
      newCart = [...userCart, ...itemsNotInCart];
      setUserCart(newCart);

      void message.success({
        content: 'Added item(s) to your cart',
        icon: <ShoppingCartOutlined style={styles.messageAddIcon} />,
      });
    } else if (operation === 'remove') {
      newCart = userCart.filter((item) => {
        return !selectedItems.includes(item);
      });
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
      project: activeProject as RawProject,
      projectId: activeProject.pk as string,
      defaultFacets,
      activeFacets,
      textInputs,
      url,
    };

    const saveSuccess = (): void => {
      setUserSearchQueries([...userSearchQueries, savedSearch]);
      void message.success({
        content: 'Saved search criteria to your library',
        icon: <BookOutlined style={styles.messageAddIcon} />,
      });
    };

    if (isAuthenticated) {
      void addUserSearchQuery(pk as string, accessToken as string, savedSearch)
        .then(() => {
          saveSuccess();
        })
        .catch(() => {
          void message.error({
            content:
              'There was an issue updating your cart. Please contact support or try again later.',
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
        content: 'Removed search criteria from your library',
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    };

    if (isAuthenticated) {
      void deleteUserSearchQuery(searchUUID, accessToken as string)
        .then(() => {
          deleteSuccess();
        })
        .catch(() => {
          void message.error({
            content:
              'There was an issue updating your cart. Please contact support or try again later.',
          });
        });
    } else {
      deleteSuccess();
    }
  };

  const handleRunSearchQuery = (savedSearch: UserSearchQuery): void => {
    setActiveProject(savedSearch.project);
    setActiveFacets(savedSearch.activeFacets);
    setTextInputs(savedSearch.textInputs);
  };

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Switch>
        <Redirect from="/" exact to="/search" />
        <Redirect from="/cart" exact to="/cart/items" />
      </Switch>
      <div>
        <Route
          path="/"
          render={() => (
            <NavBar
              activeProject={activeProject}
              numCartItems={userCart.length}
              numSavedSearches={userSearchQueries.length}
              onProjectChange={handleProjectChange}
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
                    activeProject={activeProject}
                    defaultFacets={defaultFacets}
                    projectFacets={projectFacets}
                    activeFacets={activeFacets}
                    nodeStatus={nodeStatus}
                    onProjectChange={handleProjectChange}
                    onSetFacets={(
                      defaults: DefaultFacets,
                      active: ActiveFacets
                    ) => {
                      setDefaultFacets(defaults);
                      setActiveFacets(active);
                    }}
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
                      activeProject={activeProject}
                      defaultFacets={defaultFacets}
                      activeFacets={activeFacets}
                      textInputs={textInputs}
                      userCart={userCart}
                      nodeStatus={nodeStatus}
                      onUpdateProjectFacets={handleUpdateProjectFacets}
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
                      isLoading={nodeStatusisLoading}
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
            </Switch>
          </Layout.Content>
        </Layout>
        <Affix style={{ position: 'fixed', bottom: 20, right: 20 }}>
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
    </Router>
  );
};

export default App;
