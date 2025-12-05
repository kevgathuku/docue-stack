describe('Application Spec', () => {
  const request = require('supertest');
  const app = require('../index');

  it('should return health status on /api/health', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('docue-api');
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('should raise 404 error if page is not found', async () => {
    const res = await request(app).get('/api/hows-your-father');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
