

const Documents = require('../server/models/documents');
const Roles = require('../server/models/roles');
const Users = require('../server/models/users');
const request = require('supertest');
const app = require('../index');

const testPassword = 'youKnowNothing';

const getLoginToken = async (user) => {
  // Get a login token using async/await
  const res = await request(app)
    .post('/api/users/login')
    .send({
      username: user.username,
      password: testPassword
    });
  
  return res.body.token;
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
const clearDb = async () => {
  // Delete all docs (Mongoose 8.x uses deleteMany instead of remove)
  await Documents.deleteMany({});
  await Roles.deleteMany({});
  await Users.deleteMany({});
};

// Returns a promise of a generated token
const beforeEach = async () => {
  // Empty the DB then fill in the Seed data
  await clearDb();
  const roles = await seedRoles();
  // Seed the users with the first role from the previous step
  const users = await seedUsers(roles[0]);
  // Seed the documents with the first user from the previous step
  const user = await seedDocuments(users[0]);
  // Return the login token
  return await getLoginToken(user);
};

module.exports.beforeEach = beforeEach;
