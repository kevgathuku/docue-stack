describe('Roles Spec', () => {
  'use strict';

  const request = require('supertest');
  const helper = require('./helper');
  const app = require('../index');
  let token = null;

  beforeEach(async () => {
    token = await helper.beforeEach();
  });

  describe('Role Creation', () => {
    it('should create a role successfully', async () => {
      // Try to create an allowed but non-existent role
      const res = await request(app)
        .post('/api/roles')
        .send({
          title: 'admin'
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('admin');
      // Should assign the accessLevel correctly
      expect(res.body.accessLevel).toBe(2);
      expect(res.body.id).not.toBeNull();
    });

    it('should not create a role without a title', async () => {
      const res = await request(app)
        .post('/api/roles')
        .send({
          title: ''
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('The role title is required');
    });

    it('should not create a duplicate role', async () => {
      // Try to create a duplicate role
      const res = await request(app)
        .post('/api/roles')
        .send({
          title: 'viewer'
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.title).toBeUndefined();
      expect(res.body.error).toBe('Role already exists');
    });

    it('should not create a role if the user is unauthenticated', async () => {
      // Try to send a request without a token
      const res = await request(app)
        .post('/api/roles')
        .send({
          title: 'viewer'
        })
        .set('Accept', 'application/json');
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('No token provided.');
    });

    it('should not create an invalid role', async () => {
      const invalidTitle = 'invalid title';
      const res = await request(app)
        .post('/api/roles')
        .send({
          title: invalidTitle
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(invalidTitle + ' is not a valid role title');
    });

  });

  describe('Get All Roles', () => {
    it('should return all roles', async () => {
      // The 2 seeded Roles should be returned
      const res = await request(app)
        .get('/api/roles')
        .set('x-access-token', token)
        .set('Accept', 'application/json');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('getAllRoles should return the correct roles', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('x-access-token', token);
      
      const allRoles = res.body.map(role => role.title);
      expect(res.body.length).toBe(2);
      expect(allRoles).toContain('viewer');
      expect(allRoles).toContain('staff');
    });

  });

});
