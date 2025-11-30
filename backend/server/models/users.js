const mongoose = require('../config/db');
const bcrypt = require('bcrypt');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  name: {
    first: {
      type: String,
      required: true,
      trim: true
    },
    last: {
      type: String,
      required: true,
      trim: true
    }
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  loggedIn: {
    type: Boolean,
    default: false
  }
});

UserSchema.pre('save', function(next) {

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the user's password with 10 salt rounds
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) {
      return next(err);
    }
    // Replace the cleartext password with the hashed one
    this.password = hash;
    next();
  });
});

// Check if entered password is the same as the stored password
// Returns true if the passwords match, false otherwise
UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
