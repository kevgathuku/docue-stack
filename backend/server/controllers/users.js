const _ = require('underscore');
const jwt = require('jsonwebtoken');
const extractUserFromToken = require('./utils').extractUserFromToken;
const Documents = require('../models/documents');
const Users = require('../models/users');
const Roles = require('../models/roles');

module.exports = {
  create: (req, res, next) => {
    const required = ['username', 'firstname', 'lastname', 'email', 'password'];
    // If all the required fields are not present, raise an error
    // Returns true only if all the required fields are found in req.body
    if (!required.every((field) => field in req.body)) {
      const err = new Error(
        'Please provide the username, firstname, ' + 'lastname, email, and password values'
      );
      err.status = 400;
      next(err);
    } else if (!req.body.role) {
      // Set the role field to the default value if not provided
      req.body.role = Roles.schema.paths.title.default();
    }
    // Find the role passed from the request body in the DB
    Roles.findOne({
      title: req.body.role,
    })
      .exec()
      .then((role) => {
        // Create the user with the role specified
        // Return the user create promise
        return Users.create({
          username: req.body.username,
          name: {
            first: req.body.firstname,
            last: req.body.lastname,
          },
          email: req.body.email,
          password: req.body.password,
          role: role,
          loggedIn: true,
        });
      })
      .then((user) => {
        // Successful signup
        const tokenUser = _.pick(user, '_id', 'role', 'loggedIn');
        // Sign the user object with the app secret
        const token = jwt.sign(tokenUser, req.app.get('superSecret'), {
          expiresIn: 86400, // expires in 24 hours
        });
        // Return the newly created user with the token included
        res.status(201).json({
          user: _.omit(user, 'password'),
          token: token,
        });
      })
      .catch((err) => {
        if (err.code === 11000) {
          // The user already exists
          const error = new Error('The User already exists');
          error.status = 400;
          next(error);
        } else {
          next(err);
        }
      });
  },

  get: (req, res, next) => {
    // Only an admin or owner can view their own profile
    if (req.decoded._id === req.params.id || req.decoded.role.title === 'admin') {
      // Don't send back the password field
      Users.findById(req.params.id, '_id name username email role loggedIn')
        .populate('role')
        .exec()
        .then((user) => {
          res.json(user);
        })
        .catch((err) => {
          next(err);
        });
    } else {
      res.status(403).json({
        error: 'Unauthorized Access',
      });
    }
  },

  update: (req, res, next) => {
    // A user can only update their own profile
    // An admin can edit any user's profile i.e. roles
    if (req.decoded._id === req.params.id || req.decoded.role.title === 'admin') {
      // Set the name fields in the format expected by the model
      if (_.has(req.body, 'firstname') || _.has(req.body, 'lastname')) {
        req.body.name = {
          first: req.body.firstname,
          last: req.body.lastname,
        };
      }
      Users.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        // Return the updated user object
        {
          new: true,
        }
      )
        .populate('role')
        .exec()
        .then((user) => {
          res.send(user);
        })
        .catch((err) => {
          next(err);
        });
    } else {
      res.status(403).json({
        error: 'Unauthorized Access',
      });
    }
  },

  delete: async (req, res, next) => {
    try {
      // A user can only delete their own profile
      // An admin can also delete a user
      if (req.decoded._id === req.params.id || req.decoded.role.title === 'admin') {
        await Users.findOneAndDelete({
          _id: req.params.id,
        }).exec();

        res.sendStatus(204);
      } else {
        res.status(403).json({
          error: 'Unauthorized Access',
        });
      }
    } catch (err) {
      next(err);
    }
  },

  // Get all documents created by this user
  getDocs: async (req, res, next) => {
    try {
      const docs = await Documents.find()
        .where({
          ownerId: req.params.id,
        })
        .exec();

      res.json(docs);
    } catch (err) {
      next(err);
    }
  },

  all: (req, res) => {
    // This action is available to admin roles only
    if (req.decoded.role.title !== 'admin') {
      res.status(403).json({
        error: 'Unauthorized Access',
      });
    } else {
      Users.find()
        .populate('role')
        .exec()
        .then((users) => {
          res.json(users);
        })
        .catch((err) => {
          res.next(err);
        });
    }
  },

  login: (req, res, next) => {
    // Find the user and set the loggedIn flag to true
    Users.findOneAndUpdate(
      {
        username: req.body.username,
      },
      {
        $set: {
          loggedIn: true,
        },
      }, // Return the updated user object
      {
        new: true,
      }
    )
      .populate('role')
      .exec()
      .then((user) => {
        let err;
        if (!user) {
          err = new Error('Authentication failed. User Not Found.');
          err.status = 404;
          throw err;
        }
        if (!user.comparePassword(req.body.password)) {
          // If the password provided is wrong.
          err = new Error('Authentication failed. Wrong password.');
          err.status = 401;
          throw err;
        }
        user.password = null;
        const tokenUser = {
          _id: user._id,
          role: user.role,
          loggedIn: user.loggedIn,
        };
        // User is found and password is correct
        // Sign the user object with the app secret
        const token = jwt.sign(tokenUser, req.app.get('superSecret'), {
          expiresIn: 86400, // expires in 24 hours
        });
        res.json({
          user: user,
          token: token,
        });
      })
      .catch((err) => {
        next(err);
      });
  },

  logout: (req, res, next) => {
    // Set the loggedIn flag for the user to false
    const token = req.body.token || req.headers['x-access-token'];
    const user = extractUserFromToken(token);
    Users.findByIdAndUpdate(user._id, {
      loggedIn: false,
    })
      .exec()
      .then(() => {
        res.json({
          message: 'Successfully logged out',
        });
      })
      .catch((err) => {
        next(err);
      });
  },

  // route middleware to verify a token
  authenticate: (req, res, next) => {
    // check header or post parameters for token
    const token = req.body.token || req.headers['x-access-token'];

    // decode token
    if (token) {
      // Check if the user is logged in
      const user = extractUserFromToken(token);
      if (!user.loggedIn) {
        return res.status(401).json({
          error: 'Unauthorized Access. Please login first',
        });
      }

      try {
        // verifies secret and checks expiry time
        const decoded = jwt.verify(token, req.app.get('superSecret'));
        // if everything is good, save to request for use in other routes
        decoded.password = null;
        req.decoded = decoded;
        next();
      } catch {
        res.status(401).json({
          error: 'Failed to authenticate token.',
        });
      }
    } else {
      // if there is no token return an error
      res.status(403).send({
        error: 'No token provided.',
      });
    }
  },

  getSession: async (req, res) => {
    // check header or post parameters for token
    const token = req.body.token || req.headers['x-access-token'];

    // decode token
    if (token) {
      try {
        // verifies secret and checks expiry time
        const decoded = jwt.verify(token, req.app.get('superSecret'));

        // Return user's loggedIn status from the DB
        const user = await Users.findById(decoded._id).populate('role').exec();

        if (!user) {
          res.json({
            loggedIn: false,
          });
        } else {
          res.json({
            user: user,
            loggedIn: user.loggedIn,
          });
        }
      } catch {
        // If the token cannot be verified, return false
        res.json({
          loggedIn: false,
        });
      }
    } else {
      // if there is no token, return a logged out status
      res.json({
        loggedIn: false,
      });
    }
  },
};
