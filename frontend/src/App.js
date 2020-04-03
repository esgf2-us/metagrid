import React from 'react';
import { Layout } from 'antd';
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
 * Fetch list of projects
 * TODO: Call an API instead of mock data
 */
const fetchProjects = async () => {
  return JSON.parse(JSON.stringify(dbJson.projects));
};

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

  const handleProjectChange = (value) => {
    setProject(value);
  };

  const handleSubmitText = (text) => {
    setTextInputs([...textInputs, text]);
  };

  const handleRemoveTag = (removedTag) => {
    setTextInputs(() => textInputs.filter((input) => input !== removedTag));
  };

  const handleClearTags = () => {
    // TODO: Implement method
    setProject('');
    setTextInputs([]);
  };

  /**
@@ -48,63 75,53 @@ export default class App extends Component {
    * will appear.
    *
    */

  const handleAddCart = (selectedItems) => {
    setCart(() => {
      const itemsNotInCart = selectedItems.filter((item) => {
        return !cart.includes(item);
      });
      return {
        cart: [...cart, ...itemsNotInCart],
      };
    });
  };

  const handleSetFacets = (facets) => {
    setAppliedFacets(facets);
  };

  return (
    <div>
      <NavBar
        projects={projects}
        onProjectChange={handleProjectChange}
        onSearch={(text) => handleSubmitText(text)}
        cartItems={cart.length}
      ></NavBar>
      <Layout id="body-layout" style={styles.bodyLayout}>
        <Sider style={styles.bodySider} width={250}>
          <Facets
            projects={projects}
            project={project}
            onProjectChange={handleProjectChange}
            onSetFacets={(facets) => handleSetFacets(facets)}
          />
        </Sider>
        <Content style={styles.bodyContent}>
          <Search
            project={project}
            textInputs={textInputs}
            appliedFacets={appliedFacets}
            cart={cart}
            onRemoveTag={(removedTag) => handleRemoveTag(removedTag)}
            onClearTags={() => handleClearTags()}
            onAddCart={handleAddCart}
          ></Search>
        </Content>
      </Layout>
      <Footer style={styles.footer}>ESGF Search UI ©2020</Footer>
    </div>
  );
}

export default App;
