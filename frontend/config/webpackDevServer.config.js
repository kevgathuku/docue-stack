'use strict';

const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const ignoredFiles = require('react-dev-utils/ignoredFiles');
const config = require('./webpack.config.dev');
const paths = require('./paths');
const fs = require('fs');

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const host = process.env.HOST || '0.0.0.0';

module.exports = function(proxy, allowedHost) {
  return {
    // Enable gzip compression of generated files.
    compress: true,
    // Serve static files from public directory
    static: {
      directory: paths.appPublic,
      publicPath: [config.output.publicPath],
      watch: {
        ignored: ignoredFiles(paths.appSrc),
      },
    },
    // Enable hot reloading
    hot: true,
    // Enable HTTPS if the HTTPS environment variable is set to 'true'
    https: protocol === 'https',
    host,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      disableDotRule: true,
    },
    allowedHosts: allowedHost ? [allowedHost] : 'all',
    proxy,
    // Setup middleware
    onBeforeSetupMiddleware(devServer) {
      if (fs.existsSync(paths.proxySetup)) {
        // This registers user provided middleware for proxy reasons
        require(paths.proxySetup)(devServer.app);
      }

      // This lets us fetch source contents from webpack for the error overlay
      devServer.app.use(evalSourceMapMiddleware(devServer));
      // This lets us open files from the runtime error overlay.
      devServer.app.use(errorOverlayMiddleware());

      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      devServer.app.use(noopServiceWorkerMiddleware());
    },
    client: {
      overlay: false,
    },
  };
};
