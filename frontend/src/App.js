import React from 'react';
import { Layout, message } from 'antd';
import './App.css';
import NavBar from './components/NavBar';
import Facets from './components/Facets';
import Search from './components/Search';
import dbJson from './mocks/db.json';

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

/**
 * Fetches list of projects.
 * TODO: Call an API instead of mock data
 */
const fetchProjects = async () => {
  return JSON.parse(JSON.stringify(dbJson.projects));
};

/**
 * Custom hooks for returning list of projects based on its state.
 */
export function useProjects() {
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    fetchProjects()
      .then((res) => {
        setProjects(res);
      })
      .catch(() => {
        // TODO: Handle catching errors
      });
  }, []);
  return projects;
}

function App() {
  const [project, setProject] = React.useState('');
  const projects = useProjects();
  const [textInputs, setTextInputs] = React.useState([]);
  const [appliedFacets, setAppliedFacets] = React.useState({});
  const [cart, setCart] = React.useState([]);

  /**
   * Handles clearing all of the constraints applied by the user.
   */
  const handleClearTags = () => {
    // TODO: Implement method
    setProject('');
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
        projects={projects}
        cartItems={cart.length}
        onProjectChange={(value) => setProject(value)}
        onSearch={(text) => setTextInputs([...textInputs, text])}
      ></NavBar>
      <Layout id="body-layout" style={styles.bodyLayout}>
        <Sider style={styles.bodySider} width={250}>
          <Facets
            projects={projects}
            project={project}
            onProjectChange={(value) => setProject(value)}
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
