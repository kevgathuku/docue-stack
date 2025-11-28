import React from 'react';
import Elm from '../../utils/ReactElm';

import BaseActions from '../../actions/BaseActions';
import * as ElmRolesAdmin from '../RolesAdmin.elm';

export default class extends React.Component {
  flags = {
    token: localStorage.getItem('user'),
    baseURL: BaseActions.BASE_URL,
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
