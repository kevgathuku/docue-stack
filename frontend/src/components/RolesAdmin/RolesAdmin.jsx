import React from 'react';
import Elm from '../../utils/ReactElm';
import * as ElmRolesAdmin from '../RolesAdmin.elm';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default class extends React.Component {
  flags = {
    token: localStorage.getItem('user'),
    baseURL: BASE_URL,
  };

  setupPorts(ports) {
    ports.tooltips.subscribe(function() {
      window.$('.tooltipped').tooltip();
    });
  }

  render() {
    return (
      <Elm
        src={ElmRolesAdmin}
        flags={this.flags}
        ports={this.setupPorts}
      />
    );
  }
}
