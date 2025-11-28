# Testing Guide

## How Tests Work

### Supertest vs Actual Server

The test suite uses **Supertest**, which:
- Creates an in-memory HTTP server from your Express app
- **Does NOT bind to an actual port**
- Allows multiple test suites to run simultaneously without port conflicts
- Faster than starting a real server

```javascript
// In tests (spec/*.spec.js)
const request = require('supertest');
const app = require('../index');

// This doesn't use a real port!
request(app)
  .get('/api/documents')
  .expect(200)
```

### How Port Conflicts Are Prevented

The `index.js` file only starts the server when run directly:

```javascript
// START THE SERVER only if this file is run directly (not required by tests)
if (require.main === module) {
  app.listen(port);
  console.log('Listening on port', port);
}

// Export the app object for tests
module.exports = app;
```

This means:
- ✅ `node index.js` or `pnpm start` → Server starts on port 8000
- ✅ `require('../index')` in tests → No server started, no port used
- ✅ Multiple test suites can run in parallel without port conflicts

### When You Need Different Ports

You only need different ports if:
1. Running actual server instances (`node index.js` or `pnpm start`)
2. Running the dev server alongside tests
3. Testing with real HTTP clients (not supertest)

## Test Database Configuration

The test database is configured in `backend/server/config/db.js`:

```javascript
if (process.env.NODE_ENV === 'test') {
  mongoose.connect(process.env.MONGO_TEST_URL || process.env.MONGODB_URL);
}
```

### Environment Variables

- `PORT` - Server port (default: 8000) - **Not used by tests with supertest**
- `MONGO_TEST_URL` - Dedicated test database URL (recommended)
- `MONGODB_URL` - Fallback if MONGO_TEST_URL is not set
- `NODE_ENV` - Must be set to `'test'` for test mode

## Running Tests in Parallel

To run tests in parallel without interference, each test process needs its own database and optionally its own port.

### Important: Tests Use Supertest (No Port Needed)

The test suite uses `supertest` which creates an in-memory test server. **Tests don't actually bind to a port**, so you can run multiple test suites simultaneously without port conflicts.

However, if you're running the actual server (`pnpm start`) alongside tests, you'll need different ports.

### Option 1: Use Different Database Names (Recommended for Tests)

Run each test suite with a unique database name:

```bash
# Terminal 1
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-1 pnpm --filter backend test:simple

# Terminal 2
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-2 pnpm --filter backend test:simple

# Terminal 3
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-3 pnpm --filter backend test:simple
```

### Option 2: Different Databases AND Ports (For Running Actual Servers)

If you need to run actual server instances (not just tests):

```bash
# Terminal 1 - Dev server
PORT=8000 MONGODB_URL=mongodb://localhost/docue-dev pnpm --filter backend start

# Terminal 2 - Test server instance 1
PORT=8001 NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-1 node index.js

# Terminal 3 - Test server instance 2
PORT=8002 NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-2 node index.js

# Terminal 4 - Run tests (uses supertest, no port needed)
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-3 pnpm --filter backend test:simple
```

### Option 3: Use Process ID in Database Name (Automatic)

The `test:parallel` script automatically uses a unique database per process:

```bash
# Each run gets a unique database based on process ID
pnpm --filter backend test:parallel
```

This is defined in `package.json`:
```json
"test:parallel": "NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-$$ node spec/run.js"
```

### Option 4: Run Multiple Server Instances with Different Ports

If you need to run actual server instances (not tests) in parallel:

```bash
# Terminal 1
PORT=8001 MONGODB_URL=mongodb://localhost/docue-instance-1 pnpm --filter backend start

# Terminal 2
PORT=8002 MONGODB_URL=mongodb://localhost/docue-instance-2 pnpm --filter backend start

# Terminal 3
PORT=8003 MONGODB_URL=mongodb://localhost/docue-instance-3 pnpm --filter backend start
```

### Option 3: Use Different Ports

If running multiple MongoDB instances:

```bash
# Terminal 1 - MongoDB on default port
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost:27017/docue-test pnpm --filter backend test:simple

# Terminal 2 - MongoDB on different port
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost:27018/docue-test pnpm --filter backend test:simple
```

## Test Database Cleanup

Tests automatically clean up the database in `beforeEach` hooks (see `spec/helper.js`):

```javascript
const clearDb = () => {
  return Documents.deleteMany({})
    .then(() => Roles.deleteMany({}))
    .then(() => Users.deleteMany({}));
};
```

This ensures each test starts with a clean slate.

## Recommended Setup for Local Development

### 1. Create a `.env.test` file:

```bash
PORT=8000
MONGO_TEST_URL='mongodb://localhost/docue-test'
SECRET='test-secret-key'
NODE_ENV='test'
```

### 2. Update package.json:

```json
{
  "scripts": {
    "test:simple": "NODE_ENV=test node spec/run.js",
    "test:parallel": "NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-$$ node spec/run.js"
  }
}
```

### 3. Run tests:

```bash
# Single test run
pnpm --filter backend test:simple

# Parallel runs (each gets unique DB)
pnpm --filter backend test:parallel &
pnpm --filter backend test:parallel &
pnpm --filter backend test:parallel &
```

## CI/CD Configuration

In GitHub Actions, each job gets its own MongoDB instance, so no special configuration is needed:

```yaml
- name: Run backend tests
  run: pnpm --filter backend test:simple
  env:
    NODE_ENV: test
    MONGODB_URL: mongodb://localhost:27017/docue-test
```

## Troubleshooting

### Tests Interfere with Each Other

**Problem:** Tests fail when run in parallel but pass individually.

**Solution:** Ensure each test process uses a different database:
```bash
MONGO_TEST_URL=mongodb://localhost/docue-test-unique-name
```

### Database Not Cleaned Between Tests

**Problem:** Tests fail due to existing data.

**Solution:** Check that `beforeEach` hooks are running:
```javascript
beforeEach((done) => {
  helper.beforeEach()
    .then(token => {
      // Test setup
      done();
    });
});
```

### Connection Errors

**Problem:** `MongoError: failed to connect`

**Solution:** 
1. Ensure MongoDB is running: `mongosh` or `mongo`
2. Check the connection string in your environment variables
3. Verify MongoDB is listening on the correct port

## Quick Reference

| Scenario | Need Different Ports? | Need Different DBs? | Command |
|----------|----------------------|---------------------|---------|
| Run tests | ❌ No (uses supertest) | ✅ Yes (if parallel) | `NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-1 pnpm test:simple` |
| Dev server + tests | ❌ No (tests use supertest) | ✅ Yes | Dev: `pnpm start`<br>Test: `NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test pnpm test:simple` |
| Multiple test suites | ❌ No (uses supertest) | ✅ Yes | `pnpm test:parallel` (automatic) |
| Multiple real servers | ✅ Yes | ✅ Yes | `PORT=8001 MONGODB_URL=mongodb://localhost/db1 node index.js` |

## Best Practices

1. **Always use `NODE_ENV=test`** when running tests
2. **Use dedicated test databases** - never point tests at development or production DBs
3. **Tests don't need different ports** - supertest handles this automatically
4. **Use unique database names** for parallel test runs
5. **Only specify PORT** if running actual server instances (not tests)
6. **Don't commit `.env.test`** - add it to `.gitignore`

## Practical Examples

### Example 1: Run Tests While Dev Server is Running

```bash
# Terminal 1 - Development server on port 8000
PORT=8000 MONGODB_URL=mongodb://localhost/docue-dev pnpm --filter backend start

# Terminal 2 - Run tests (uses supertest, no port conflict!)
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test pnpm --filter backend test:simple
```

**No port conflict** because tests use supertest, not a real server.

### Example 2: Run Multiple Test Suites Simultaneously

```bash
# All three can run at the same time - no port conflicts!
# Terminal 1
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-1 pnpm --filter backend test:simple

# Terminal 2
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-2 pnpm --filter backend test:simple

# Terminal 3
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-3 pnpm --filter backend test:simple
```

### Example 3: Run Multiple Actual Server Instances

```bash
# If you need real servers (not tests), use different ports:
# Terminal 1
PORT=8001 MONGODB_URL=mongodb://localhost/docue-instance-1 node index.js

# Terminal 2
PORT=8002 MONGODB_URL=mongodb://localhost/docue-instance-2 node index.js

# Terminal 3
PORT=8003 MONGODB_URL=mongodb://localhost/docue-instance-3 node index.js
```

### Example 4: Automated Parallel Test Runner

```bash
# Create a test runner script
cat > run-parallel-tests.sh << 'EOF'
#!/bin/bash

# Run 3 test suites in parallel (no port needed!)
for i in {1..3}; do
  NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-$i \
    pnpm --filter backend test:simple &
done

# Wait for all to complete
wait
echo "All test suites completed"
EOF

chmod +x run-parallel-tests.sh
./run-parallel-tests.sh
```

### Example 5: Using the Automatic Parallel Script

```bash
# Run multiple times - each gets unique DB automatically
pnpm --filter backend test:parallel &
pnpm --filter backend test:parallel &
pnpm --filter backend test:parallel &
wait
```
