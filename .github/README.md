# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### `backend-tests.yml`
Runs backend tests on specific backend changes.

**Triggers:**
- Push to `main`, `develop`, or `backend-setup` branches (when backend files change)
- Pull requests to `main` or `develop` (when backend files change)

**What it does:**
- Sets up Node.js 22.x and pnpm
- Starts MongoDB 7.0 with replica set
- Installs dependencies
- Runs ESLint on backend code
- Runs backend test suite
- Uploads test results as artifacts

### `ci.yml`
Comprehensive CI workflow for the entire monorepo.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **Backend Tests** - Runs backend linting and tests with MongoDB
2. **Frontend Tests** - Runs frontend linting and tests
3. **Format Check** - Validates code formatting with Biome

## Environment Variables

The workflows use the following environment variables for testing:

- `NODE_ENV=test` - Sets the environment to test mode
- `MONGODB_URL=mongodb://localhost:27017/docue-test` - MongoDB connection string
- `SECRET=test-secret-key-for-ci` - JWT secret for testing
- `PORT=8000` - Backend server port

## Local Testing

To run tests locally as they run in CI:

```bash
# Backend tests
NODE_ENV=test MONGODB_URL=mongodb://localhost:27017/docue-test pnpm --filter docue test:simple

# Frontend tests (when configured)
pnpm --filter docue-frontend test:ci

# Linting
pnpm --filter docue lint

# Format check
pnpm format
```

## Requirements

- Node.js 22.x
- pnpm 10.x
- MongoDB 7.0+ (for backend tests)

## Artifacts

Test results and coverage reports are uploaded as artifacts and retained for 30 days:
- `backend-test-results` - Backend test coverage
- `frontend-test-results` - Frontend test coverage (when available)

## Status Badges

Add these badges to your main README.md:

```markdown
![Backend Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Backend%20Tests/badge.svg)
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
```
