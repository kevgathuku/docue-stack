import React from 'react';
import BaseActions from '../../actions/BaseActions';
import Elm from '../../utils/ReactElm';
import * as ElmAdmin from '../Admin.elm';

export default class Main extends React.Component {
  flags = {
    token: localStorage.getItem('user'),
    baseURL: BaseActions.BASE_URL
  };

  render() {
    return <Elm src={ElmAdmin} flags={this.flags} />;
  }
}
