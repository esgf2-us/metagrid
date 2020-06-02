import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import { Breadcrumb, Layout, message } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import NavBar from './components/NavBar';
import Facets from './components/Facets';
import Search from './components/Search';
import Cart from './components/Cart';
import Summary from './components/Cart/Summary';

import { isEmpty } from './utils/utils';
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
};

const App: React.FC = () => {
  const [activeProject, setActiveProject] = React.useState<Project | {}>({});
  const [availableFacets, setAvailableFacets] = React.useState<
    AvailableFacets | {}
  >({});
  const [textInputs, setTextInputs] = React.useState<TextInputs | []>([]);
  const [activeFacets, setActiveFacets] = React.useState<ActiveFacets | {}>({});
  const [cart, setCart] = React.useState<Cart | []>(
    JSON.parse(localStorage.getItem('cart') || '[]')
  );

  /**
   * Stores the cart in localStorage
   */
  React.useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Handles clearing constraints for a selected project.
   */
  const clearConstraints = (): void => {
    setTextInputs([]);
    setActiveFacets({});
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
  };

  /**
   * Handles removing applied tags.
   */
  const handleRemoveTag = (removedTag: Tag, type: string): void => {
    /* istanbul ignore else */
    if (type === 'text') {
      setTextInputs(() => textInputs.filter((input) => input !== removedTag));
    } else if (type === 'facet') {
      // Need to cast variable to type since it can be an empty object
      const prevActiveFacets = activeFacets as ActiveFacets;
      const facet = ([removedTag[0]] as unknown) as string;
      const option = ([removedTag[1]] as unknown) as string;

      const updateFacet = {
        facet: prevActiveFacets[facet].filter((item) => item !== option),
      };
      setActiveFacets({ ...activeFacets, ...updateFacet });
    } else {
      throw new Error(
        `handleRemoveTag does not support argument 'type' of value ${type}`
      );
    }
  };

  /**
   * Handles adding or removing items from the cart.
   * @param {arrayOf(objectOf(any))} selectedItems
   */
  const handleCart = (
    selectedItems: SearchResult[],
    operation: string
  ): void => {
    /* istanbul ignore else */
    if (operation === 'add') {
      setCart(() => {
        const itemsNotInCart = selectedItems.filter((item) => {
          return !cart.includes(item as never);
        });
        return [...cart, ...itemsNotInCart];
      });
      message.success('Added items to the cart');
    } else if (operation === 'remove') {
      setCart(
        cart.filter((item) => {
          return !selectedItems.includes(item);
        })
      );
      message.error('Removed items from the cart');
    } else {
      throw new Error(
        `handleCart does not support argument 'operation' of value ${operation}`
      );
    }
  };

  /**
   * Handles free-text search form submission.
   */
  const handleOnSearch = (text: string): void => {
    if (textInputs.includes(text as never)) {
      message.error(`Input "${text}" has already been applied`);
    } else {
      setTextInputs([...textInputs, text]);
    }
  };

  // Handles available facets fetched from the API
  const handleSetAvailableFacets = (facets: AvailableFacets): void => {
    setAvailableFacets(facets);
  };

  return (
    <Router>
      <Switch>
        <Redirect from="/" exact to="/search" />
      </Switch>
      <div>
        <Route
          path="/"
          render={() => (
            <NavBar
              activeProject={activeProject}
              cartItems={cart.length}
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
                    activeFacets={activeFacets}
                    availableFacets={availableFacets}
                    handleProjectChange={(selectedProj) =>
                      handleProjectChange(selectedProj)
                    }
                    onSetActiveFacets={(facets: ActiveFacets) =>
                      setActiveFacets(facets)
                    }
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
                  <Summary
                    numItems={cart.length}
                    numFiles={
                      cart.length > 0
                        ? (cart as SearchResult[]).reduce(
                            (acc: number, dataset: SearchResult) =>
                              acc + dataset.number_of_files,
                            0
                          )
                        : 0
                    }
                  />
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
                      setAvailableFacets={(facets) =>
                        handleSetAvailableFacets(facets)
                      }
                      textInputs={textInputs}
                      activeFacets={activeFacets}
                      cart={cart}
                      handleCart={handleCart}
                      onRemoveTag={(removedTag, type) =>
                        handleRemoveTag(removedTag, type)
                      }
                      onClearTags={() => clearConstraints()}
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
                      handleCart={handleCart}
                      clearCart={() => setCart([])}
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
