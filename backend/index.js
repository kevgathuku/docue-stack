

const express = require('express'),
  compression = require('compression'),
  cors = require('cors'),
  morgan = require('morgan'),
  app = express(),
  isProduction = process.env.NODE_ENV === 'production';

// Load the env variables only in DEV mode
if (!isProduction) {
  require('dotenv').config();
}

// Set JWT secret on the app object
app.set('superSecret', process.env.SECRET);

// use morgan to log requests to the console
if (!isProduction) {
  app.use(morgan('dev'));
}

// compress all requests
app.use(compression());

// configure app to parse request bodies
// this will let us get the data from a POST
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(express.json());

// Enable CORS
app.use(
  cors({
    allowedHeaders: [
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, x-access-token'
    ]
  })
);

const port = process.env.PORT || 8000; // set our port

app.use(require('./server/routes'));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message
  });
});

// catch 404 errors
app.use((req, res) => {
  const err = new Error('Not Found');
  res.status(404).json({
    error: err.message
  });
});

// START THE SERVER only if this file is run directly (not required by tests)
if (require.main === module) {
  app.listen(port);
  console.log('Listening on port', port);
}

// Export the app object
module.exports = app;
