import React, { Component } from "react";

import "./App.css";
import NavBar from "./components/NavBar";
import Search from "./components/search/Search";

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

  render() {
    return (
      <div>
        <NavBar
          onProjectChange={this.handleProjectChange}
          onSearch={text => this.handleSubmitText(text)}
        ></NavBar>
        <Search
          project={this.state.project}
          textInputs={this.state.textInputs}
          onRemoveTag={removedTag => this.handleRemoveTag(removedTag)}
        ></Search>
      </div>
    );
  }
}
