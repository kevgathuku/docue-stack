'use strict';

const Documents = require('../server/models/documents');
const Roles = require('../server/models/roles');
const Users = require('../server/models/users');
const request = require('supertest');
const app = require('../index');

const testPassword = 'youKnowNothing';

const getLoginToken = (user) => {
  // Get a login token - returns a promise
  return new Promise((resolve, reject) => {
    request(app)
      .post('/api/users/login')
      .send({
        username: user.username,
        password: testPassword
      })
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body.token);
        }
      });
  });
};

const seedRoles = () => {
  // Users will be created with the first role
  const roles = [
    {
      title: 'viewer',
      accessLevel: 0
    },
    {
      title: 'staff',
      accessLevel: 1
    }
  ];
  // return a promise
  return Roles.create(roles);
};

const seedUsers = role => {
  // Documents will be created with the first user, role = viewer
  const users = [
    {
      username: 'jsnow',
      name: {
        first: 'John',
        last: 'Snow'
      },
      email: 'jsnow@winterfell.org',
      password: testPassword,
      role: role
    },
    {
      username: 'nstark',
      name: {
        first: 'Ned',
        last: 'Stark'
      },
      email: 'nstark@winterfell.org',
      password: 'winterIsComing',
      role: role
    }
  ];

  return Users.create(users);
};

const seedDocuments = async user => {
  // Create dates with clear separation to ensure proper ordering
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  // Create documents sequentially with explicit dates
  await Documents.create({
    title: 'Doc1',
    content: '1Doc',
    ownerId: user._id,
    role: user.role,
    dateCreated: now
  });

  await Documents.create({
    title: 'Doc2',
    content: '2Doc',
    ownerId: user._id,
    role: user.role,
    dateCreated: tomorrow
  });

  await Documents.create({
    title: 'Doc3',
    content: '3Doc',
    ownerId: user._id,
    role: user.role,
    dateCreated: dayAfterTomorrow
  });

  return user;
};

// Utility function for emptying the database
const clearDb = () => {
  // Delete all docs (Mongoose 8.x uses deleteMany instead of remove)
  return Documents.deleteMany({})
    .then(() => {
      // Delete all roles
      return Roles.deleteMany({});
    })
    .then(() => {
      // Delete all users
      return Users.deleteMany({});
    });
};

// Returns a promise of a generated token
const beforeEach = () => {
  // Empty the DB then fill in the Seed data
  return clearDb()
    .then(() => {
      return seedRoles();
    })
    .then(roles => {
      // Seed the users with the first role from the previous step
      return seedUsers(roles[0]);
    })
    .then(users => {
      // Seed the documents with the first user from the previous step
      return seedDocuments(users[0]);
    })
    .then(user => {
      // Return a promise that resolves with the eventual login token
      return getLoginToken(user);
    });
};

module.exports.beforeEach = beforeEach;
