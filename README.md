# Document Management System

[![CI](https://github.com/kevgathuku/docue-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/kevgathuku/docue-stack/actions/workflows/ci.yml)

A full-stack document management system that manages documents, users, and roles with role-based access control.

Each document defines access rights (which roles can access it) and tracks publication dates. Users are categorized by roles, and each user must have a defined role.

## Tech Stack

### Backend
- **Runtime**: Node.js 22.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB 7.0+ with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Testing**: Jasmine with Supertest

### Frontend
- **Framework**: React 16.x + Elm (hybrid architecture)
- **State Management**: Redux with redux-thunk
- **Routing**: React Router 4.x
- **Build Tool**: Webpack 4.x
- **Testing**: Jest + Enzyme for React, elm-test for Elm

### Monorepo
- **Package Manager**: pnpm 10.x with workspaces
- **Code Quality**: ESLint, Biome formatter
- **CI/CD**: GitHub Actions

## Requirements

- Node.js 22.x
- pnpm 10.x
- MongoDB 7.0+

## Installation

1. Clone the repository and navigate to the project folder:

   ```bash
   git clone https://github.com/kevgathuku/docue-stack
   cd docue-stack
   ```

2. Install all dependencies (from the root directory):

   ```bash
   pnpm install
   ```

3. Set up environment variables for the backend:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `backend/.env` with your configuration:
   - `PORT` - Server port (default: 8000)
   - `SECRET` - Secret key for JWT token encryption
   - `MONGODB_URL` - MongoDB connection URL
   - `NODE_ENV` - Environment (`development`, `test`, or `production`)

4. Set up environment variables for the frontend:

   ```bash
   cd ../frontend
   cp .env.example .env
   ```

   Edit `frontend/.env` with your configuration:
   - `NODE_ENV` - Environment (`development`, `test`, or `production`)
   - `VITE_API_BASE_URL` - Backend API URL (default: `http://localhost:8000`)

## Running the Application

### Development Mode

Run both backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend (runs on port 8000)
pnpm --filter backend start

# Terminal 2 - Frontend (runs on port 3000, proxies API to backend)
pnpm --filter frontend start
```

Access the application at `http://localhost:3000`

### Individual Services

```bash
# Backend only
pnpm --filter backend start

# Frontend only
pnpm --filter frontend start
```

## Testing

```bash
# Run all tests
pnpm test

# Backend tests only
pnpm --filter backend test:simple

# Frontend tests only
pnpm --filter frontend test

# Frontend Elm tests
pnpm --filter frontend test:elm
```

For advanced testing scenarios (parallel execution, custom databases), see [backend/TESTING.md](backend/TESTING.md).

## Code Quality

```bash
# Format all code with Biome
pnpm format

# Lint backend
pnpm --filter backend lint

# Lint and auto-fix backend
pnpm --filter backend lint:fix
```

## Project Structure

```
docue-stack/
├── backend/              # Express.js API server
│   ├── server/
│   │   ├── config/      # Database and app configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Mongoose schemas
│   │   └── routes/      # API routes
│   ├── spec/            # Jasmine tests
│   └── migrations/      # Database migrations
├── frontend/            # React + Elm application
│   ├── src/            # React components and logic
│   ├── public/         # Static assets
│   ├── config/         # Webpack configuration
│   └── tests/          # Jest and Elm tests
└── .github/            # CI/CD workflows
```

## API Documentation

The backend API runs on `http://localhost:8000` and provides the following endpoints:

- **Authentication**: `/api/users/login`, `/api/users/logout`
- **Users**: `/api/users` (CRUD operations)
- **Documents**: `/api/documents` (CRUD operations with role-based access)
- **Roles**: `/api/roles` (CRUD operations)

All authenticated endpoints require an `x-access-token` header with a valid JWT token.

## Deployment

This project can be deployed to Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick deploy:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend && vercel --prod

# Deploy frontend
cd frontend && vercel --prod
```

## Continuous Integration

This project uses GitHub Actions for CI/CD. Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/` for workflow configurations.

## Development Workflow

For detailed development guidelines, see:
- [Backend Testing Guide](backend/TESTING.md)
- [Test Patterns](backend/TEST_PATTERNS.md)
- [Monorepo Structure](.kiro/steering/monorepo-structure.md)
- [Development Workflow](.kiro/steering/development-workflow.md)

## Contributing

1. Create a feature branch from `develop`
2. Make your changes with tests
3. Ensure all tests pass: `pnpm test`
4. Format code: `pnpm format`
5. Submit a pull request to `develop`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
