import React, { Component } from "react";
import { Layout } from "antd";
import "./App.css";
import NavBar from "./components/NavBar";
import Facets from "./components/Facets";
import Search from "./components/Search";

const { Content, Sider } = Layout;

export default class App extends Component {
  state = {
    project: "",
    textInputs: [],
    appliedFacets: {},
    cart: []
  };

  handleProjectChange = value => {
    this.setState({ project: value });
  };

  handleSubmitText = text => {
    this.setState({
      textInputs: [...this.state.textInputs, text]
    });
  };

  handleRemoveTag = removedTag => {
    this.setState(() => {
      return {
        textInputs: this.state.textInputs.filter(input => input !== removedTag)
      };
    });
  };

  handleClearTags = () => {
    // TODO: Implement method
    this.setState({ project: "", textInputs: [] });
  };

  handleAddCart = items => {
    this.setState(() => {
      return {
        cart: [...this.state.cart, ...items]
      };
    });
  };

  handleSetFacets = facets => {
    this.setState({ appliedFacets: facets });
  };

  render() {
    return (
      <div>
        <NavBar
          onProjectChange={this.handleProjectChange}
          onSearch={text => this.handleSubmitText(text)}
          cartItems={this.state.cart.length}
        ></NavBar>
        <Layout style={{ padding: "24px 0" }}>
          <Content>
            <Layout>
              <Sider style={styles.sider} width={250}>
                <Facets
                  project={this.state.project}
                  onProjectChange={this.handleProjectChange}
                  onSetFacets={facets => this.handleSetFacets(facets)}
                />
              </Sider>
              <Content style={styles.bodyContent}>
                <Search
                  project={this.state.project}
                  textInputs={this.state.textInputs}
                  appliedFacets={this.state.appliedFacets}
                  onRemoveTag={removedTag => this.handleRemoveTag(removedTag)}
                  onClearTags={() => this.handleClearTags()}
                  onAddCart={this.handleAddCart}
                ></Search>
              </Content>
            </Layout>
          </Content>
        </Layout>
      </div>
    );
  }
}

const styles = {
  sider: {
    background: "#fff",
    padding: "25px 25px 25px 25px",
    marginLeft: "25px"
  },
  bodyContent: { padding: "0 24px", minHeight: 280 }
};
