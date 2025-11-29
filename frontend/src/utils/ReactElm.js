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
      console.error('[ReactElm] Elm module is undefined. Props:', this.props);
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
      console.error('[ReactElm] Elm module does not have init method. Module:', elmModule);
      return;
    }
    
    // Log Elm initialization in development
    if (process.env.NODE_ENV === 'development') {
      const moduleName = elmModule.constructor?.name || 'Unknown';
      console.log(`[ReactElm] Initializing Elm module with flags:`, this.props.flags);
    }
    
    try {
      const app = elmModule.init({
        node,
        flags: this.props.flags,
      });

      // Store app instance for debugging
      if (process.env.NODE_ENV === 'development') {
        window.__ELM_APPS__ = window.__ELM_APPS__ || [];
        window.__ELM_APPS__.push(app);
        console.log('[ReactElm] Elm app initialized. Access via window.__ELM_APPS__');
      }

      if (typeof this.props.ports !== 'undefined') {
        this.props.ports(app.ports);
      }
    } catch (error) {
      console.error('[ReactElm] Error initializing Elm app:', error);
      console.error('[ReactElm] Flags:', this.props.flags);
    }
  };
  
  render = () => {
    return <div ref={this.ref} />;
  };
}
