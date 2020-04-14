import React from 'react';
import { Layout, message } from 'antd';

import './App.css';
import NavBar from './components/NavBar';
import Facets from './components/Facets';
import Search from './components/Search';

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
   * Handles when the selected project changes.
   *
   * This function first checks if the current project is not an empty string
   * to reset textInputs and appliedFacets, then updates the selected project.
   * @param {*} selectedProject
   */
  const handleProjectChange = (selectedProject) => {
    if (project !== '') {
      setTextInputs([]);
      setAppliedFacets({});
    }
    setProject(selectedProject);
  };

  /**
   * Handles clearing constraints for a selected project.
   */
  const handleClearTags = () => {
    setTextInputs([]);
    setAppliedFacets({});
  };

  /**
   * Handles removing applied tags.
   * @param {string} removedTag
   */
  const handleRemoveTag = (removedTag, type) => {
    if (type === 'project') {
      handleClearTags();
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

  return (
    <div>
      <NavBar
        cartItems={cart.length}
        onProjectChange={(value) => handleProjectChange(value)}
        onSearch={(text) => setTextInputs([...textInputs, text])}
      ></NavBar>
      <Layout id="body-layout" style={styles.bodyLayout}>
        <Sider style={styles.bodySider} width={250}>
          <Facets
            project={project}
            onProjectChange={(selectedProject) =>
              handleProjectChange(selectedProject)
            }
            onSetFacets={(facets) => setAppliedFacets(facets)}
          />
        </Sider>
        <Content style={styles.bodyContent}>
          <Search
            project={project}
            textInputs={textInputs}
            appliedFacets={appliedFacets}
            cart={cart}
            handleCart={handleCart}
            onRemoveTag={(removedTag, type) =>
              handleRemoveTag(removedTag, type)
            }
            onClearTags={() => handleClearTags()}
          ></Search>
        </Content>
      </Layout>
      <Footer style={styles.footer}>ESGF Search UI ©2020</Footer>
    </div>
  );
}

export default App;
