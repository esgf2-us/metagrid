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
    overflowY: 'scroll',
  },
  bodyContent: { padding: '0 24px' },
  footer: { textAlign: 'center' },
};

function App() {
  const [project, setProject] = React.useState('');
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
   */
  const handleRemoveTag = (removedTag, type) => {
    if (type === 'project') {
      clearConstraints();
    } else if (type === 'text') {
      setTextInputs(() => textInputs.filter((input) => input !== removedTag));
    } else if (type === 'facets') {
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
                <Sider style={styles.bodySider} width={250}>
                  <Facets
                    project={project}
                    onProjectChange={(selectedProject) =>
                      handleProjectChange(selectedProject)
                    }
                    onSetFacets={(facets) => setAppliedFacets(facets)}
                  />
                </Sider>
              )}
            />
            <Route
              path="/cart"
              render={() => (
                <Sider style={styles.bodySider} width={250}>
                  {' '}
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
                render={() => <Cart cart={cart} handleCart={handleCart} />}
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
