describe('Documents Spec', () => {
  const request = require('supertest');
  const helper = require('./helper');
  const app = require('../index');
  const Roles = require('../server/models/roles');
  const defaultRole = Roles.schema.paths.title.default();
  let token = null;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

  beforeEach(async () => {
    token = await helper.beforeEach();
  });

  describe('Document Creation', () => {
    it('should create a document successfully', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Doc 1',
          content: 'JS Curriculum',
        })
        .set('x-access-token', token);

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Doc 1');
      expect(res.body.content).toBe('JS Curriculum');
      // The timestamps should be created
      expect(res.body.dateCreated).not.toBeNull();
      expect(res.body.lastModified).not.toBeNull();
      // The User Id should be added
      expect(res.body.ownerId).not.toBeNull();
    });

    it('should not create document if user is unauthenticated', async () => {
      // Send a request without a token
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Doc 1',
          content: 'JS Curriculum',
        })
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('No token provided.');
    });

    it('should not create new document if title is missing', async () => {
      // Send a request with an empty title
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: '',
          content: 'JS Curriculum',
        })
        .set('x-access-token', token);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('The document title is required');
    });

    it('should not create a duplicate document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Doc1',
          content: 'Duplicate document test',
        })
        .set('x-access-token', token);

      expect(res.statusCode).toBe(400);
      expect(res.body.title).toBeUndefined();
      expect(res.body.error).toBe('Document already exists');
    });

    it('should assign a default role if one is not defined', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Doc 1',
          content: 'JS Curriculum',
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);

      expect(res.statusCode).toBe(201);
      // It should assign the default role
      expect(res.body.role.title).toBe(defaultRole);
    });

    it('should assign defined roles correctly', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Doc 1',
          content: 'JS Curriculum',
          role: 'staff',
        })
        .set('Accept', 'application/json')
        .set('x-access-token', token);

      expect(res.statusCode).toBe(201);
      expect(res.body.role.title).toBe('staff');
    });
  });

  describe('Document Fetching', () => {
    it('should return all documents', async () => {
      const res = await request(app).get('/api/documents').set('x-access-token', token);

      expect(res.statusCode).toBe(200);
      // Should contain all 3 seeded docs
      expect(res.body.length).toBe(3);
    });

    it('should return documents limited by a specified number', async () => {
      const limit = 2;
      const res = await request(app)
        .get('/api/documents?limit=' + limit)
        .set('x-access-token', token);

      expect(res.statusCode).toBe(200);
      // Should return only the specified number of documents
      expect(res.body.length).toBe(limit);
    });

    it('should return documents in latest first order', async () => {
      const res = await request(app).get('/api/documents').set('x-access-token', token);

      expect(res.body.length).toBe(3);
      expect(res.body[0].title).toBe('Doc3');
      expect(res.body[1].title).toBe('Doc2');
      expect(res.body[2].title).toBe('Doc1');
    });
  });

  describe('Documents Update', () => {
    let documentID = null;

    beforeEach(async () => {
      const res = await request(app).get('/api/documents').set('x-access-token', token);

      expect(res.statusCode).toBe(200);
      // Store the first document's Id for later use
      documentID = res.body[0]._id;
    });

    it('should correctly update a document', async () => {
      const res = await request(app)
        .put('/api/documents/' + documentID)
        .set('x-access-token', token)
        .send({
          title: 'Brand',
          content: 'New',
        });

      expect(res.statusCode).toBe(200);
      // Should contain the updated doc attributes
      expect(res.body.title).toBe('Brand');
      expect(res.body.content).toBe('New');
    });
  });

  describe('Single Document Fetch', () => {
    let documentID = null;

    beforeEach(async () => {
      const res = await request(app).get('/api/documents').set('x-access-token', token);

      // Store the first document's Id for later use
      documentID = res.body[0]._id;
    });

    it('should correctly fetch a single document', async () => {
      const res = await request(app)
        .get('/api/documents/' + documentID)
        .set('x-access-token', token);

      expect(res.statusCode).toBe(200);
      // Should contain the doc's attributes
      expect(res.body.title).not.toBe(null);
      expect(res.body.content).not.toBe(null);
    });
  });

  describe('Document Role Access', () => {
    let staffToken = null;
    let documentID = null;

    beforeEach(async () => {
      // Create a new user with the staff role
      const userRes = await request(app).post('/api/users').send({
        username: 'staffUser',
        firstname: 'John',
        lastname: 'Snow',
        email: 'snow@staff.org',
        password: 'staff',
        role: 'staff',
      });

      staffToken = userRes.body.token;

      const docRes = await request(app)
        .post('/api/documents')
        .set('x-access-token', staffToken)
        .send({
          title: 'Staff Doc',
          description: 'Confidential',
          role: 'staff',
        });

      documentID = docRes.body._id;
    });

    it('should allow access to authorized users', async () => {
      const res = await request(app)
        .get('/api/documents/' + documentID)
        .set('x-access-token', staffToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).not.toBe(null);
      expect(res.body.content).not.toBe(null);
    });

    it('should not allow unauthorized viewing of a document', async () => {
      const res = await request(app)
        .get('/api/documents/' + documentID)
        .set('x-access-token', token);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('You are not allowed to access this document');
    });

    it('should not allow unauthorized editing of documents', async () => {
      const res = await request(app)
        .put('/api/documents/' + documentID)
        .set('x-access-token', token)
        .send({
          title: 'Users docs',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('You are not allowed to access this document');
    });

    it('should not allow unauthorized deletion of documents', async () => {
      const res = await request(app)
        .delete('/api/documents/' + documentID)
        .set('x-access-token', token);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('You are not allowed to delete this document');
    });

    it('should only return documents a user is allowed to access', async () => {
      const res = await request(app).get('/api/documents/').set('x-access-token', token);

      expect(res.statusCode).toBe(200);
      // Should not return the doc with the staff role
      expect(res.body.length).toBe(3);
    });
  });

  describe('Document delete', () => {
    let documentID = null;

    beforeEach(async () => {
      const res = await request(app).get('/api/documents').set('x-access-token', token);

      // Store the first document's Id for later use
      documentID = res.body[0]._id;
    });

    it('should correctly delete a document', async () => {
      const res = await request(app)
        .delete('/api/documents/' + documentID)
        .set('x-access-token', token);

      expect(res.statusCode).toBe(204);
      // should send back an empty body
      expect(res.body).toEqual({});
    });
  });

  describe('Get Documents by Role', () => {
    // The viewer role (default) is the test role
    const testRole = defaultRole;

    it('should return documents accessible by the given role', async () => {
      // Get the documents accessible by the test role
      const res = await request(app)
        .get('/api/documents/roles/' + testRole)
        .set('x-access-token', token)
        .set('Accept', 'application/json');

      expect(res.body.length).toBe(3);
      expect(res.body[0].role.title).toBe(testRole);
    });
  });

  describe('Get Documents by Date', () => {
    const today = new Date();
    // Build the date format to be sent from the current date
    // Formt should be YYYY-MM-DD
    const testDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    it('should return documents created on the date provided', async () => {
      const res = await request(app)
        .get('/api/documents/created/' + testDate)
        .set('x-access-token', token)
        .set('Accept', 'application/json');

      expect(res.body.length).toBeGreaterThan(0);
      // Doc1 should be in the results since it was created today
      const titles = res.body.map((doc) => doc.title);
      expect(titles).toContain('Doc1');
    });

    it('should return an error if the format is not valid', async () => {
      const res = await request(app)
        .get('/api/documents/created/' + '20er-343-343e3d')
        .set('x-access-token', token)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Date must be in the format YYYY-MM-DD');
    });
  });
});
