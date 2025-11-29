import React from 'react';
import Elm from '../../utils/ReactElm';
import * as ElmAdmin from '../Admin.elm';

const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://docue.herokuapp.com';

export default class Main extends React.Component {
  flags = {
    token: localStorage.getItem('user'),
    baseURL: BASE_URL
  };

  render() {
    return <Elm src={ElmAdmin} flags={this.flags} />;
  }
}
