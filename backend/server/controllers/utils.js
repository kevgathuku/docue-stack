const jwt = require('jsonwebtoken');

// Takes a JWT token object and extracts the user info from the token
module.exports = {
  extractUserFromToken: (token) => {
    const decodedUser = jwt.decode(token, {
      complete: true,
    });
    // Returns the user object stored in the token
    return decodedUser.payload;
  },
};
