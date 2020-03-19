import React, { Component } from "react";

import "./App.css";
import NavBar from "./components/NavBar";
import Search from "./components/search/Search";

export default class App extends Component {
  state = {
    text: "",
    project: ""
  };

  handleSubmitText = text => {
    this.setState({
      text: [...this.state.text, text]
    });
  };

  handleProjectChange = value => {
    this.setState({ project: value });
  };

  render() {
    return (
      <div>
        <NavBar
          text={this.state.text}
          project={this.state.project}
          onProjectChange={this.handleProjectChange}
          onSearch={text => this.handleSubmitText(text)}
        ></NavBar>
        <Search text={this.state.text} project={this.state.project}></Search>
      </div>
    );
  }
}
