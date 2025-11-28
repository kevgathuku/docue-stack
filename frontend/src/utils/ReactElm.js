/* eslint-disable */
import React from 'react';

export default class Elm extends React.Component {
  shouldComponentUpdate = () => {
    return false;
  };
  ref = (node) => {
    if (node === null) return;
    
    // Handle different export formats from vite-plugin-elm
    let elmModule = this.props.src;
    
    // If src is undefined, log error with helpful info
    if (!elmModule) {
      console.error('Elm module is undefined. Props:', this.props);
      return;
    }
    
    // Check if we need to access .init directly or through a nested structure
    if (!elmModule.init && elmModule.Elm) {
      // Handle Elm.ModuleName.init pattern
      const moduleName = Object.keys(elmModule.Elm)[0];
      if (moduleName) {
        elmModule = elmModule.Elm[moduleName];
      }
    }
    
    if (!elmModule || !elmModule.init) {
      console.error('Elm module does not have init method. Module:', elmModule);
      return;
    }
    
    const app = elmModule.init({
      node,
      flags: this.props.flags,
    });

    if (typeof this.props.ports !== 'undefined') {
      this.props.ports(app.ports);
    }
  };
  render = () => {
    return <div ref={this.ref} />;
  };
}
