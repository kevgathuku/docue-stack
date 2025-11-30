const mongoose = require('mongoose');
// load .env only in dev mode
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

// Mongoose 8.x uses native promises by default, no need to set mongoose.Promise

if (process.env.NODE_ENV === 'test') {
  mongoose.connect(process.env.MONGO_TEST_URL || process.env.MONGODB_URL);
} else {
  // MONGOLAB_URI is the MongoDB url config in Heroku
  mongoose.connect(process.env.MONGODB_URL || process.env.MONGOLAB_URI);
}

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection Error : '));
db.once('open', () => {
  console.log('Connection ok!');
});

module.exports = mongoose;
