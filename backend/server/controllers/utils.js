const jwt = require('jsonwebtoken');

// Takes a JWT token object and extracts the user info from the token
const extractUserFromToken = (token) => {
  const decodedUser = jwt.decode(token, {
    complete: true,
  });
  // Returns the user object stored in the token
  return decodedUser.payload;
};

// Checks if a user is the owner of a document
// Handles ObjectId vs string comparison safely
// Also handles populated ownerId (when it's a User object vs just an ID)
const isDocumentOwner = (userId, documentOwnerId) => {
  // If ownerId is populated (an object with _id), extract the _id
  const ownerIdValue = documentOwnerId._id || documentOwnerId;
  return userId.toString() === ownerIdValue.toString();
};

// Checks if a user has permission to access a document based on role
const canAccessDocument = (user, document) => {
  // Owner always has access
  if (isDocumentOwner(user._id, document.ownerId)) {
    return true;
  }

  // Check role-based access
  if (document.role && user.role) {
    return user.role.accessLevel >= document.role.accessLevel;
  }

  return false;
};

// Checks if a user can delete a document (owner or admin)
const canDeleteDocument = (user, document) => {
  // Owner can delete
  if (isDocumentOwner(user._id, document.ownerId)) {
    return true;
  }

  // Admin (accessLevel 2) can delete
  if (user.role && user.role.accessLevel === 2) {
    return true;
  }

  return false;
};

module.exports = {
  extractUserFromToken,
  isDocumentOwner,
  canAccessDocument,
  canDeleteDocument,
};
