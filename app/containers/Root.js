import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import App from './App';

export default class Root extends Component {

  static propTypes = {
    store: PropTypes.object.isRequired
  };

  render() {
    return (
        <App />
    );
  }
}
