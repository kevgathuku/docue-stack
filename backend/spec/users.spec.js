describe('User Spec', () => {
  'use strict';

  const helper = require('./helper');
  const request = require('supertest');
  const app = require('../index');
  const extractUserFromToken = require('../server/controllers/utils').extractUserFromToken;
  const Documents = require('../server/models/documents');
  const Roles = require('../server/models/roles');
  let token = null;

  beforeEach(async () => {
    token = await helper.beforeEach();
  });

  describe('User Creation', () => {
    it('should create a user successfully', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'johnSnow',
          firstname: 'John',
          lastname: 'Snow',
          email: 'snow@winterfell.org',
          password: 'knfenfenfen',
          role: Roles.schema.paths.title.default()
        })
        .set('Accept', 'application/json');
      
      expect(res.statusCode).toBe(201);
      expect(res.body.user.username).toBe('johnSnow');
      expect(res.body.user.name.first).toBe('John');
      expect(res.body.user.name.last).toBe('Snow');
      expect(res.body.token).not.toBeNull();
      expect(res.body.user.id).not.toBeNull();
    });

    it('should log in the user after signup', async () => {
      // Create the user
      const createRes = await request(app)
        .post('/api/users')
        .set('Accept', 'application/json')
        .send({
          username: 'jnSnow',
          firstname: 'John',
          lastname: 'Snow',
          email: 'Jjsnow@winterfell.org',
          password: 'knffenfen',
          role: Roles.schema.paths.title.default()
        });
      
      expect(createRes.statusCode).toBe(201);
      const userID = createRes.body.user._id;
      const userToken = createRes.body.token;
      
      const getRes = await request(app)
        .get('/api/users/' + userID)
        .set('x-access-token', userToken);
      
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.loggedIn).toBe(true);
    });

    it('should enforce a unique username field', async () => {
      // Try to provide a duplicate username field
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'jsnow',
          firstname: 'John',
          lastname: 'Snow',
          email: 'snow@winterfell.org',
          password: 'knfenfenfen',
          role: Roles.schema.paths.title.default()
        })
        .set('Accept', 'application/json');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('The User already exists');
    });

    it('should enforce a unique email field', async () => {
      // Try to provide a duplicate email field
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'jsnow67',
          firstname: 'John',
          lastname: 'Snow',
          email: 'jsnow@winterfell.org',
          password: 'knfenfenfen',
          role: Roles.schema.paths.title.default()
        })
        .set('Accept', 'application/json');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('The User already exists');
    });

    it('should populate the user\'s role if it is not defined', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'newUser',
          firstname: 'John',
          lastname: 'Snow',
          email: 'snow@winterfell.org',
          password: 'knfenfenfen'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).not.toBeNull();
      // The role should be populated i.e. an object
      expect(res.body.user.role).toEqual(jasmine.any(Object));
    });

    it('should raise an error if required attributes are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'kevin',
          firstname: 'Kevin',
          email: 'kev@winterfell.org',
          password: 'knnfenfen',
          role: Roles.schema.paths.title.default()
        })
        .set('Accept', 'application/json');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
        'Please provide the username, firstname, ' +
        'lastname, email, and password values');
    });

  });

  describe('User Get', () => {
    let user = null;
    let staffToken = null;

    beforeEach(async () => {
      // Create a new user with the staff role
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'staffUser',
          firstname: 'John',
          lastname: 'Snow',
          email: 'snow@staff.org',
          password: 'staff',
          role: 'staff'
        });
      
      // Save the staff token
      staffToken = res.body.token;
      // Decode the user object from the token
      user = extractUserFromToken(token);
    });

    it('should fetch the user\'s own profile successfully', async () => {
      const res = await request(app)
        .get('/api/users/' + user._id)
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(user._id);
      // The password should not be returned
      expect(res.body.password).toBeUndefined();
    });

    it('should not allow a user to fetch another user\'s profile', async () => {
      const res = await request(app)
        .get('/api/users/' + user._id)
        .set('Accept', 'application/json')
        .set('x-access-token', staffToken);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Unauthorized Access');
    });

  });

  describe('User update', () => {
    let userId = null;

    beforeEach(() => {
      // Decode the user object from the token
      userId = extractUserFromToken(token)._id;
    });

    it('should update a user successfully', async () => {
      const res = await request(app)
        .put('/api/users/' + userId)
        .send({
          username: 'theImp',
          firstname: 'Half',
          lastname: 'Man',
          email: 'masterofcoin@westeros.org'
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('theImp');
      expect(res.body.name.first).toBe('Half');
      expect(res.body.name.last).toBe('Man');
      expect(res.body.email).toBe('masterofcoin@westeros.org');
    });

    it('should throw an error if a user does not exist', async () => {
      const res = await request(app)
        .put('/api/users/i-do-not-exist')
        .send({
          username: 'theImp',
          firstname: 'Half',
          lastname: 'Man',
          email: 'masterofcoin@westeros.org'
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      // Should be treated as trying to access another user's profile
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Unauthorized Access');
    });

  });

  describe('User delete', () => {
    let userId = null;

    beforeEach(() => {
      // Decode the user object from the token
      userId = extractUserFromToken(token)._id;
    });

    it('should delete a user successfully', async () => {
      const res = await request(app)
        .delete('/api/users/' + userId)
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(204);
    });

    it('should raise an error when given an invalid user', async () => {
      const res = await request(app)
        .delete('/api/users/cant-touch-this')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Unauthorized Access');
    });

  });

  describe('User Documents', () => {
    it('should get a user\'s documents', async () => {
      const doc = await Documents.find({})
        .limit(1)
        .exec();
      
      const userId = doc[0].ownerId;
      const res = await request(app)
        .get('/api/users/' + userId + '/documents')
        .expect('Content-Type', /json/)
        .set('x-access-token', token)
        .expect(200);
      
      // It should return the user's 3 documents
      expect(res.body.length).toBe(3);
    });
  });

  describe('getAllUsers function', () => {
    let adminToken = null;

    beforeEach(async () => {
      // Create the admin role in the DB
      const adminRole = await Roles.create({
        title: 'admin'
      });
      
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'adminUser',
          firstname: 'John',
          lastname: 'Snow',
          email: 'snow@admin.org',
          password: 'admin',
          role: adminRole.title // 'admin'
        });
      
      adminToken = res.body.token;
    });

    it('should return all users when called by admin user', async () => {
      // The 3 seeded users should be returned
      const res = await request(app)
        .get('/api/users')
        .set('Accept', 'application/json')
        .set('x-access-token', adminToken);
      
      expect(res.body.length).toBe(3);
      const usernames = res.body.map(user => user.username);
      expect(usernames).toContain('jsnow');
      expect(usernames).toContain('nstark');
      expect(usernames).toContain('adminUser');
    });

    it('should not be accessible to regular users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Unauthorized Access');
    });
  });

  describe('User Actions', () => {
    let user = null;
    let userToken = null;
    const userPassword = 'knfenfenfen';

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'jeremy',
          firstname: 'not',
          lastname: 'ceo',
          email: 'jerenotceo@andela.com',
          password: userPassword
        })
        .set('Accept', 'application/json');
      
      // Save the new user in a variable
      user = res.body.user;
      userToken = res.body.token;
      // Expect the user to be logged in
      expect(res.body.user.loggedIn).toBe(true);
    });

    it('should login and logout user successfully', async () => {
      // logout the user
      const logoutRes = await request(app)
        .post('/api/users/logout')
        .set('x-access-token', userToken);
      
      expect(logoutRes.statusCode).toBe(200);
      expect(logoutRes.body.message).toBe('Successfully logged out');
      
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          username: user.username,
          password: userPassword
        });
      
      // The loggedIn flag should be set to true
      expect(loginRes.body.user.loggedIn).toBe(true);
    });
  });

  describe('User Session', () => {
    it('should return false if no token is provided', async () => {
      const res = await request(app)
        .get('/api/users/session');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.loggedIn).toBe(false);
      expect(typeof res.body.loggedIn).toBe('boolean');
    });

    it('should return true if the user is logged in', async () => {
      const res = await request(app)
        .get('/api/users/session')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.loggedIn).toBe(true);
      expect(typeof res.body.loggedIn).toBe('boolean');
      expect(res.body.user).toBeDefined();
      expect(res.body.user._id).toBeDefined();
    });

    it('should return false if the token is invalid', async () => {
      const res = await request(app)
        .get('/api/users/session')
        .set('x-access-token', 'i-will-hack-you');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.loggedIn).toBe(false);
      expect(typeof res.body.loggedIn).toBe('boolean');
    });

    it('should return false if the user is logged out', async () => {
      // logout the user
      const logoutRes = await request(app)
        .post('/api/users/logout')
        .set('x-access-token', token);
      
      expect(logoutRes.statusCode).toBe(200);
      
      const sessionRes = await request(app)
        .get('/api/users/session')
        .set('x-access-token', token);
      
      expect(sessionRes.statusCode).toBe(200);
      expect(sessionRes.body.loggedIn).toBe(false);
      expect(typeof sessionRes.body.loggedIn).toBe('boolean');
    });

  });
});
