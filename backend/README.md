# Backend - Document Management API

Express.js REST API for the document management system.

## Tech Stack

- **Runtime**: Node.js 22.x
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB 7.0+ with Mongoose 8.x
- **Authentication**: JWT (jsonwebtoken) with bcrypt
- **Testing**: Jasmine 5.x with Supertest 7.x
- **Code Quality**: ESLint 9.x with flat config

## Quick Start

See the [root README](../README.md) for installation instructions.

To run the backend:

```bash
# From the root directory
pnpm --filter backend start
```

The API will be available at `http://localhost:8000`

## Running tests

The tests are run using Jasmine with Mongoose 8.x and Node.js 22.x

To run the tests:

```bash
# Run tests
pnpm --filter backend test:simple

# Run tests with custom database (for parallel runs)
NODE_ENV=test MONGO_TEST_URL=mongodb://localhost/docue-test-custom pnpm --filter backend test:simple

# Run linter
pnpm --filter backend lint

# Auto-fix linting issues
pnpm --filter backend lint:fix
```

**For parallel test execution and advanced testing scenarios, see [TESTING.md](TESTING.md)**

## Continuous Integration

This project uses GitHub Actions for CI. See `.github/workflows/` for configuration.

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
