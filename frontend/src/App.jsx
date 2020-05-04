import React from 'react';

import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';

import { Layout, message } from 'antd';

import NavBar from './components/NavBar';
import Facets from './components/Facets';
import Search from './components/Search';
import Cart from './components/Cart';
import Summary from './components/Cart/Summary';

import './App.css';

const { Content, Sider, Footer } = Layout;
const styles = {
  bodyLayout: { padding: '24px 0' },
  bodySider: {
    background: '#fff',
    padding: '25px 25px 25px 25px',
    marginLeft: '25px',
    overflowY: 'auto',
  },
  bodyContent: { padding: '0 24px' },
  footer: { textAlign: 'center' },
};

/**
 * Joins adjacent elements of the facets obj into a tuple using reduce().
 * https://stackoverflow.com/questions/37270508/javascript-function-that-converts-array-to-array-of-2-tuples
 * @param {Object.<string, Array.<Array<string, number>>} facets
 */
const parseFacets = (facets) => {
  const res = facets;
  const keys = Object.keys(facets);

  keys.forEach((key) => {
    res[key] = res[key].reduce((r, a, i) => {
      if (i % 2) {
        r[r.length - 1].push(a);
      } else {
        r.push([a]);
      }
      return r;
    }, []);
  });
  return res;
};

function App() {
  const [project, setProject] = React.useState({});
  const [availableFacets, setAvailableFacets] = React.useState({});
  const [textInputs, setTextInputs] = React.useState([]);
  const [appliedFacets, setAppliedFacets] = React.useState({});
  const [cart, setCart] = React.useState([]);

  /**
   * Handles clearing constraints for a selected project.
   */
  const clearConstraints = () => {
    setTextInputs([]);
    setAppliedFacets({});
  };

  /**
   * Handles when the selected project changes.
   *
   * This functions checks if the current project is not an empty string or
   * equal to the selected project to reset textInputs and appliedFacets, then
   * it updates the selected project.
   * @param {*} selectedProject
   */
  const handleProjectChange = (selectedProject) => {
    if (project !== '' && project !== selectedProject) {
      clearConstraints();
    }

    setProject(selectedProject);
  };

  /**
   * Handles removing applied tags.
   * @param {string} removedTag
   * TODO: Fix removing from applied facets by key value pair
   */
  const handleRemoveTag = (removedTag, type) => {
    if (type === 'project') {
      clearConstraints();
    } else if (type === 'text') {
      setTextInputs(() => textInputs.filter((input) => input !== removedTag));
    } else if (type === 'facet') {
      const newAppliedFacets = appliedFacets;
      delete newAppliedFacets[removedTag];
      setAppliedFacets(newAppliedFacets);
    }
  };

  /**
   * Handles adding or removing items from the cart.
   * For adding, it filters out items in the selectedItems array that is not in
   * the cart and adds the items to the cart.
   * For removing, it only includes items in the cart that aren't in the
   * selectedItems
   * @param {arrayOf(objectOf(any))} selectedItems
   */
  const handleCart = (selectedItems, operation) => {
    if (operation === 'add') {
      setCart(() => {
        const itemsNotInCart = selectedItems.filter((item) => {
          return !cart.includes(item);
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
    }
  };

  /**
   * Handles free-text search form submission.
   *
   * @param {string} input - free-text input to query for search results
   */
  const handleOnSearch = (input) => {
    if (textInputs.includes(input)) {
      message.error(`Input "${input}" has already been applied`);
    } else {
      setTextInputs([...textInputs, input]);
    }
  };

  const handleSetAvailableFacets = (facets) => {
    setAvailableFacets(parseFacets(facets));
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
              project={project}
              cartItems={cart.length}
              onProjectChange={(value) => handleProjectChange(value)}
              onSearch={(input) => handleOnSearch(input)}
            ></NavBar>
          )}
        />
        <Layout id="body-layout" style={styles.bodyLayout}>
          <Switch>
            <Route
              path="/search"
              render={() => (
                <Sider style={styles.bodySider} width={275}>
                  <Facets
                    project={project}
                    availableFacets={availableFacets}
                    setAvailableFacets={(facets) =>
                      handleSetAvailableFacets(facets)
                    }
                    onProjectChange={(selectedProject) =>
                      handleProjectChange(selectedProject)
                    }
                    onSetAppliedFacets={(facets) => setAppliedFacets(facets)}
                  />
                </Sider>
              )}
            />
            <Route
              path="/cart"
              render={() => (
                <Sider style={styles.bodySider} width={275}>
                  <Summary numItems={cart.length} />
                </Sider>
              )}
            />
          </Switch>
          <Content style={styles.bodyContent}>
            <Switch>
              <Route
                path="/search"
                render={() => (
                  <Search
                    project={project}
                    setAvailableFacets={(facets) =>
                      handleSetAvailableFacets(facets)
                    }
                    textInputs={textInputs}
                    appliedFacets={appliedFacets}
                    cart={cart}
                    handleCart={handleCart}
                    onRemoveTag={(removedTag, type) =>
                      handleRemoveTag(removedTag, type)
                    }
                    onClearTags={() => clearConstraints()}
                  ></Search>
                )}
              />
              <Route
                path="/cart"
                render={() => (
                  <Cart
                    cart={cart}
                    handleCart={handleCart}
                    clearCart={() => setCart([])}
                  />
                )}
              />
            </Switch>
          </Content>
        </Layout>
        <Footer data-testid="footer" style={styles.footer}>
          ESGF Search UI ©2020
        </Footer>
      </div>
    </Router>
  );
}

export default App;
