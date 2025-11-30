describe('Application Spec', () => {
  const request = require('supertest');
  const app = require('../index');

  it('should raise 404 error if page is not found', async () => {
    const res = await request(app).get('/api/hows-your-father');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
