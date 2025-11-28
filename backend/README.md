# Document Management System

[![Build Status](https://travis-ci.org/kevgathuku/docue.svg?branch=master)](https://travis-ci.org/kevgathuku/docue)   [![Coverage Status](https://coveralls.io/repos/github/kevgathuku/docue/badge.svg?branch=master)](https://coveralls.io/github/kevgathuku/docue?branch=master)

[View on Pivotal Tracker](https://www.pivotaltracker.com/n/projects/1515788)

The system manages documents, users and roles.

Each document defines access rights i.e. which roles can access it and the date it was published.

Users are categorized by roles. Each user must have a role defined for them.

## Requirements

- Node.js 22.x
- pnpm 10.x
- MongoDB 7.0+

## Installation

- Clone the repo locally and navigate to the newly created folder

    ```bash
    git clone https://github.com/kevgathuku/docue
    cd docue
    ```

 - Install the app dependencies (from the root directory)

    ```bash
    pnpm install
    ```

 - Copy the `.env.example` file to `.env`

     ```bash
     cp .env.example .env
     ```

 - Replace the values in the `.env` file with the appropriate values
         - `PORT` - The port where you want the application to be run
         - `SECRET` - A hard to guess string that is used in encrypting the tokens
         - `MONGODB_URL` - The URL to your MongoDB Database
         - `NODE_ENV` - The environment you are running the code in i.e `development`, `test` or `production`
             The default value of `development` is fine and should work for most cases

 - Start the project by running

    ```bash
    pnpm --filter backend start
    ```

  It can be accessed on `http://localhost:8000`

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
- Push to `main`, `develop`, or `backend-setup` branches
- Pull requests to `main` or `develop`
