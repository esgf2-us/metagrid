import React, { Component } from "react";
import { Layout } from "antd";
import "./App.css";
import NavBar from "./components/NavBar/index";
import Search from "./components/Search/index";

const { Content, Sider } = Layout;

export default class App extends Component {
  state = {
    project: "",
    textInputs: []
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

  render() {
    return (
      <div>
        <NavBar
          onProjectChange={this.handleProjectChange}
          onSearch={text => this.handleSubmitText(text)}
        ></NavBar>
        <Layout style={{ padding: "24px 0" }}>
          <Content>
            <Layout>
              <Sider style={styles.sider} width={200}></Sider>
              <Content style={{ padding: "0 24px", minHeight: 280 }}>
                <Search
                  project={this.state.project}
                  textInputs={this.state.textInputs}
                  onRemoveTag={removedTag => this.handleRemoveTag(removedTag)}
                  onClearTags={() => this.handleClearTags()}
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
  sider: { background: "#fff" }
};
