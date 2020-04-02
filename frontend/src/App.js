import React, { Component } from 'react';
import { Layout } from 'antd';
import './App.css';
import NavBar from './components/NavBar';
import Facets from './components/Facets';
import Search from './components/Search';

const { Content, Sider, Footer } = Layout;

export default class App extends Component {
  state = {
    project: '',
    textInputs: [],
    appliedFacets: {},
    cart: [],
  };

  handleProjectChange = (value) => {
    this.setState({ project: value });
  };

  handleSubmitText = (text) => {
    this.setState({
      textInputs: [...this.state.textInputs, text],
    });
  };

  handleRemoveTag = (removedTag) => {
    this.setState(() => {
      return {
        textInputs: this.state.textInputs.filter(
          (input) => input !== removedTag
        ),
      };
    });
  };

  handleClearTags = () => {
    // TODO: Implement method
    this.setState({ project: '', textInputs: [] });
  };

  /**
   * Handles adding to the cart.
   * It only adds selected items if they are not already in the cart.
   * The Ant Design API returns all of the selected rows, regardless of whether
   * they are checked and disabled so they must be filtered out or duplicates
   * will appear.
   *
   */
  handleAddCart = (selectedItems) => {
    this.setState(() => {
      const itemsNotInCart = selectedItems.filter((item) => {
        return !this.state.cart.includes(item);
      });
      return {
        cart: [...this.state.cart, ...itemsNotInCart],
      };
    });
  };

  handleSetFacets = (facets) => {
    this.setState({ appliedFacets: facets });
  };

  render() {
    return (
      <div>
        <NavBar
          onProjectChange={this.handleProjectChange}
          onSearch={(text) => this.handleSubmitText(text)}
          cartItems={this.state.cart.length}
        ></NavBar>
        <Layout id="body-layout" style={styles.bodyLayout}>
          <Sider style={styles.bodySider} width={250}>
            <Facets
              project={this.state.project}
              onProjectChange={this.handleProjectChange}
              onSetFacets={(facets) => this.handleSetFacets(facets)}
            />
          </Sider>
          <Content style={styles.bodyContent}>
            <Search
              project={this.state.project}
              textInputs={this.state.textInputs}
              appliedFacets={this.state.appliedFacets}
              cart={this.state.cart}
              onRemoveTag={(removedTag) => this.handleRemoveTag(removedTag)}
              onClearTags={() => this.handleClearTags()}
              onAddCart={this.handleAddCart}
            ></Search>
          </Content>
        </Layout>
        <Footer style={styles.footer}>ESGF Search UI ©2020</Footer>
      </div>
    );
  }
}

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
