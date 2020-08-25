/* eslint-disable no-void */
import {
  BookOutlined,
  DeleteOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Layout, message } from 'antd';
import React from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  addUserSearch,
  deleteUserSearch,
  fetchUserCart,
  fetchUserSearches,
  updateUserCart,
} from '../../api';
import { AuthContext } from '../../contexts/AuthContext';
import { isEmpty } from '../../utils/utils';
import Cart from '../Cart';
import Summary from '../Cart/Summary';
import Facets from '../Facets';
import NavBar from '../NavBar';
import Search from '../Search';
import './App.css';

const styles = {
  bodyLayout: { padding: '24px 0' } as React.CSSProperties,
  bodySider: {
    background: '#fff',
    padding: '25px 25px 25px 25px',
    marginLeft: '25px',
    width: '350',
  } as React.CSSProperties,
  bodyContent: { padding: '0 24px' } as React.CSSProperties,
  footer: { textAlign: 'center' } as React.CSSProperties,
  messageAddIcon: { color: '#90EE90' },
  messageRemoveIcon: { color: '#ff0000' },
};

const App: React.FC = () => {
  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  // Active project selected in the current search
  const [activeProject, setActiveProject] = React.useState<
    Project | Record<string, unknown>
  >({});
  // Default facet filters
  const [defaultFacets, setDefaultFacets] = React.useState<DefaultFacets>({
    latest: true,
    replica: false,
  });
  // Available facets for an active project that the user can apply
  const [availableFacets, setAvailableFacets] = React.useState<
    ParsedFacets | Record<string, unknown>
  >({});
  // Applied free-text inputs in the current search
  const [textInputs, setTextInputs] = React.useState<TextInputs | []>([]);
  // Applied facet filters in the current search
  const [activeFacets, setActiveFacets] = React.useState<
    ActiveFacets | Record<string, unknown>
  >({});

  // User's cart containing datasets
  const [cart, setCart] = React.useState<Cart | []>(
    JSON.parse(localStorage.getItem('cart') || '[]')
  );
  // User's saved search criteria
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[] | []>(
    JSON.parse(localStorage.getItem('savedSearches') || '[]')
  );

  /**
   * Fetches the authenticated user's cart from the database
   */
  React.useEffect(() => {
    /* istanbul ignore else */
    if (isAuthenticated) {
      void fetchUserCart(pk as string, accessToken as string)
        .then((rawUserCart) => {
          setCart(rawUserCart.items);
        })
        .catch(() => {
          void message.error({
            content:
              'There was an issue fetching your cart. Please contact support or try again later.',
          });
        });

      void fetchUserSearches(accessToken as string)
        .then((rawUserSearches) => {
          setSavedSearches(rawUserSearches.results);
        })
        .catch(() => {
          void message.error({
            content:
              'There was an issue fetching your saved searches. Please contact support or try again later.',
          });
        });
    }
  }, [isAuthenticated, pk, accessToken]);

  /**
   * Stores the anonoymous user's cart in local storage.
   */
  React.useEffect(() => {
    /* istanbul ignore else */
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [isAuthenticated, cart]);

  /**
   * Stores the savedSearches in local storage.
   */
  React.useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    }
  }, [isAuthenticated, savedSearches]);

  /**
   * Handles clearing constraints for a selected project.
   */
  const clearConstraints = (): void => {
    setTextInputs([]);
    setActiveFacets({});
    setDefaultFacets({ latest: true, replica: false });
  };

  /**
   * Handles when the selected project changes.
   *
   * This functions checks if the current project is not an empty object or
   * equal to the selected project to reset textInputs and activeFacets, then
   * it updates the selected project.
   */
  const handleProjectChange = (selectedProject: Project): void => {
    if (!isEmpty(activeProject) && activeProject !== selectedProject) {
      clearConstraints();
    }

    setActiveProject(selectedProject);
    void message.loading(
      'Project selected. Please wait for results and facets to load...',
      2
    );
  };

  /**
   * Handles removing applied tags.
   */
  const handleRemoveTag = (removedTag: Tag, type: string): void => {
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
    } else {
      throw new Error(
        `handleRemoveTag does not support argument 'type' of value ${type}`
      );
    }
  };

  /**
   * Handles adding or removing items from the cart.
   * If the user is authenticated, update their cart in the database.
   * @param {arrayOf(objectOf(any))} selectedItems
   */
  const handleCart = (
    selectedItems: RawSearchResult[],
    operation: 'add' | 'remove'
  ): void => {
    let newCart: Cart = [];

    /* istanbul ignore else */
    if (operation === 'add') {
      const itemsNotInCart = selectedItems.filter((item) => {
        return !cart.includes(item as never);
      });
      newCart = [...cart, ...itemsNotInCart];
      setCart(newCart);

      void message.success({
        content: 'Added item(s) to your cart',
        icon: <ShoppingCartOutlined style={styles.messageAddIcon} />,
      });
    } else if (operation === 'remove') {
      newCart = cart.filter((item) => {
        return !selectedItems.includes(item);
      });
      setCart(newCart);

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

  /**
   * Handles clearing the user's cart.
   * If the user is authenticated, update their cart in the database.
   */
  const handleClearCart = (): void => {
    setCart([]);

    /* instabul ignore else */
    if (isAuthenticated) {
      void updateUserCart(pk as string, accessToken as string, []);
    }
  };
  /**
   * Handles free-text search form submission.
   */
  const handleOnSearch = (text: string): void => {
    if (textInputs.includes(text as never)) {
      void message.error(`Input "${text}" has already been applied`);
    } else {
      setTextInputs([...textInputs, text]);
    }
  };

  /**
   * Handles available facets fetched from the API.
   */
  const handleSetAvailableFacets = (facets: ParsedFacets): void => {
    setAvailableFacets(facets);
  };

  /**
   * Handles saving searches to the user's library.
   */
  const handleSaveSearch = (url: string): void => {
    const savedSearch: SavedSearch = {
      uuid: uuidv4(),
      user: pk,
      project: activeProject as Project,
      projectId: activeProject.pk as string,
      defaultFacets,
      activeFacets,
      textInputs,
      url,
    };

    /**
     * Update the state saved searches and displays success message
     */
    const saveSuccess = (): void => {
      setSavedSearches([...savedSearches, savedSearch]);
      void message.success({
        content: 'Saved search criteria to your library',
        icon: <BookOutlined style={styles.messageAddIcon} />,
      });
    };

    if (isAuthenticated) {
      void addUserSearch(pk as string, accessToken as string, savedSearch)
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

  /**
   * Handles removing searches from the user's library.
   */
  const handleRemoveSearch = (searchUUID: string): void => {
    /**
     * Updates the state of saved searches and display success
     */
    const deleteSuccess = (): void => {
      setSavedSearches(
        savedSearches.filter(
          (searchItem: SavedSearch) => searchItem.uuid !== searchUUID
        )
      );
      void message.success({
        content: 'Removed search criteria from your library',
        icon: <DeleteOutlined style={styles.messageRemoveIcon} />,
      });
    };

    if (isAuthenticated) {
      void deleteUserSearch(searchUUID, accessToken as string)
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

  /**
   * Handles applying saved search criteria
   */
  const handleApplySearch = (savedSearch: SavedSearch): void => {
    setActiveProject(savedSearch.project);
    setActiveFacets(savedSearch.activeFacets);
    setTextInputs(savedSearch.textInputs);
  };

  return (
    <Router>
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
              numCartItems={cart.length}
              numSavedSearches={savedSearches.length}
              onProjectChange={(selectedProj) =>
                handleProjectChange(selectedProj)
              }
              onSearch={(text) => handleOnSearch(text)}
            ></NavBar>
          )}
        />
        <Layout id="body-layout" style={styles.bodyLayout}>
          <Switch>
            <Route
              path="/search"
              render={() => (
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width}
                >
                  <Facets
                    activeProject={activeProject}
                    defaultFacets={defaultFacets}
                    activeFacets={activeFacets}
                    availableFacets={availableFacets}
                    handleProjectChange={(selectedProj) =>
                      handleProjectChange(selectedProj)
                    }
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
              path="/cart"
              render={() => (
                <Layout.Sider
                  style={styles.bodySider}
                  width={styles.bodySider.width}
                >
                  <Summary cart={cart} />
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
                      cart={cart}
                      setAvailableFacets={(facets) =>
                        handleSetAvailableFacets(facets)
                      }
                      handleCart={(selectedItems, operation) =>
                        handleCart(selectedItems, operation)
                      }
                      onRemoveTag={(removedTag, type) =>
                        handleRemoveTag(removedTag, type)
                      }
                      onClearTags={() => clearConstraints()}
                      handleSaveSearch={handleSaveSearch}
                    ></Search>
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
                      cart={cart}
                      savedSearches={savedSearches}
                      handleCart={handleCart}
                      clearCart={() => handleClearCart()}
                      handleRemoveSearch={(uuid: string) =>
                        handleRemoveSearch(uuid)
                      }
                      handleApplySearch={(savedSearch: SavedSearch) =>
                        handleApplySearch(savedSearch)
                      }
                    />
                  </>
                )}
              />
            </Switch>
          </Layout.Content>
        </Layout>
        <Layout.Footer data-testid="footer" style={styles.footer}>
          ESGF Search UI ©2020
        </Layout.Footer>
      </div>
    </Router>
  );
};

export default App;
