# AI Agent Development Guide

This document provides essential context for AI agents working on the Docue document management system codebase.

## Project Overview

Docue is a full-stack document management system with role-based access control. It manages documents, users, and roles where each document defines access rights and users are categorized by roles.

**Key Features:**
- Document CRUD with role-based access control
- User management with JWT authentication
- Role management and assignment
- Publication date tracking

## Architecture

### Monorepo Structure

This is a **pnpm workspace monorepo** with two main packages:

```
docue-stack/
├── backend/              # Express.js + MongoDB API (Node 22.x)
│   ├── server/
│   │   ├── config/      # Database configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Mongoose schemas
│   │   └── routes/      # API routes
│   ├── spec/            # Jasmine tests
│   └── migrations/      # Database migrations
├── frontend/            # React + ReScript application
│   ├── src/
│   │   ├── components/  # React and ReScript components
│   │   ├── bindings/    # ReScript JS interop bindings
│   │   ├── features/    # Redux slices and ReScript types
│   │   └── store/       # Redux store configuration
│   ├── public/          # Static assets
│   └── bsconfig.json    # ReScript compiler config
└── .kiro/
    └── steering/        # Development standards and guidelines
```

### Tech Stack

**Backend:**
- Node.js 22.x with Express.js 4.x
- MongoDB 7.0+ with Mongoose ODM
- JWT authentication with bcrypt
- Jasmine + Supertest for testing

**Frontend:**
- React 18.3.1 with functional components and hooks
- ReScript 12.0.0 for type-safe components (8 components migrated)
- Redux Toolkit 2.11.0 for state management
- React Router 6.30.2 for routing
- Vite 6.x for build tooling (100x faster than Webpack)
- Jest 29.x + React Testing Library for testing

**Modernization Status:** 95% complete
- ✅ React 18, Vite, Redux Toolkit, ReScript integration
- ✅ All 204 tests passing
- ⚡ Dev server: 135ms startup (was 10-15s)
- 🔥 HMR: <100ms (was 1-3s)

## Package Manager: pnpm

**CRITICAL:** Always use `pnpm`, never `npm` or `yarn`.

### Common Commands

```bash
# Install dependencies (from root)
pnpm install

# Run backend (port 8000)
pnpm --filter backend start

# Run frontend (port 3000)
pnpm --filter frontend start

# Run tests
pnpm --filter backend test
pnpm --filter frontend test

# Add dependencies
pnpm --filter <package> add <dependency>
pnpm --filter <package> add -D <dev-dependency>

# Format code (entire monorepo)
pnpm format
```

## Frontend Development

### Technology Choices

**Type Safety:** Use **ReScript** (not TypeScript) for frontend type safety
- 8 components already migrated (Login, SignUp, Profile, Admin, RolesAdmin, CreateRole, Landing, NotFound)
- Compile-time type safety with sound type system
- No null/undefined errors
- Compiles to optimized JavaScript

**State Management:** Redux Toolkit (migrated from Flux)
- Use `createSlice` for reducers and actions
- Use `createAsyncThunk` for async operations
- Use typed hooks: `useAppDispatch` and `useAppSelector`

### ReScript Development Workflow

**Recommended setup (2 terminals):**

```bash
# Terminal 1: ReScript compiler in watch mode
pnpm --filter frontend res:watch

# Terminal 2: Vite dev server
pnpm --filter frontend start
```

**ReScript Commands:**
```bash
pnpm --filter frontend res:build   # Compile once
pnpm --filter frontend res:watch   # Watch mode (recommended)
pnpm --filter frontend res:clean   # Clean build artifacts
```

### Key Frontend Patterns

**Authentication:**
- Always check `session.loggedIn` before redirecting
- Never trust user object alone (can contain stale data)
- Use session validation guard pattern

**Component Structure:**
- Functional components with hooks
- Co-locate tests in `__tests__/` directories
- ReScript components export with `let default = make`

**Testing:**
- Unit tests: `*.test.js` (Jest + React Testing Library)
- Property-based tests: `*.properties.test.js` (fast-check)
- Run with: `pnpm --filter frontend test`

### File Organization

```
frontend/src/
├── bindings/              # ReScript JS interop
│   ├── Redux.res         # Redux Toolkit bindings
│   ├── ReactRouter.res   # React Router bindings
│   ├── LocalStorage.res  # localStorage API
│   ├── Materialize.res   # Toast notifications
│   └── Fetch.res         # HTTP client
├── features/             # Redux slices + ReScript types
│   ├── auth/
│   │   ├── authSlice.js  # Redux slice (JavaScript)
│   │   └── AuthTypes.res # Type definitions (ReScript)
│   ├── documents/
│   └── roles/
└── components/           # React + ReScript components
    ├── Login/
    │   ├── Login.res     # ReScript component
    │   ├── Login.res.js  # Compiled (auto-generated)
    │   └── __tests__/
    └── [other components...]
```

## Backend Development

### Key Patterns

**Database:**
- Mongoose 4.7.9 (legacy, needs update to 8.x)
- Models in `server/models/`
- Migrations in `migrations/`

**Authentication:**
- JWT tokens with bcrypt password hashing
- Token passed in `x-access-token` header
- Middleware validates tokens on protected routes

**Testing:**
- Jasmine with Supertest for API testing
- Tests in `spec/` directory
- Run with: `pnpm --filter backend test`

### API Endpoints

- **Auth**: `/api/users/login`, `/api/users/logout`
- **Users**: `/api/users` (CRUD)
- **Documents**: `/api/documents` (CRUD with role-based access)
- **Roles**: `/api/roles` (CRUD)

All authenticated endpoints require `x-access-token` header.

## Environment Configuration

### Backend (.env)
```bash
PORT=8000
SECRET=your-jwt-secret
MONGODB_URL=mongodb://localhost:27017/docue
NODE_ENV=development
```

### Frontend (.env)
```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000
```

**Important:** 
- Never commit `.env` files
- Always update `.env.example` when adding variables
- Frontend env vars must be prefixed with `VITE_` to be exposed to client

## Development Workflow

### Starting Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start MongoDB** (if running locally)

4. **Run services:**
   ```bash
   # Terminal 1: Backend
   pnpm --filter backend start

   # Terminal 2: Frontend (ReScript watch)
   pnpm --filter frontend res:watch

   # Terminal 3: Frontend (Vite)
   pnpm --filter frontend start
   ```

5. **Access app:** http://localhost:3000

### Before Committing

```bash
# Run tests
pnpm test

# Format code
pnpm format

# Check for issues
pnpm --filter backend lint
```

## Common Issues & Solutions

### Port Conflicts
- Backend: 8000 (change in backend/.env)
- Frontend: 3000 (change with `--port` flag)

### MongoDB Connection
- Ensure MongoDB is running
- Check `MONGODB_URL` in backend/.env
- Test environment uses in-memory database

### ReScript Compilation
- Run `pnpm --filter frontend res:clean` if issues
- Ensure `res:watch` is running during development
- Check compiler output for errors

### Lockfile Out of Sync
```bash
# Regenerate lockfile
pnpm install --lockfile-only

# Verify
pnpm install --frozen-lockfile
```

## Testing Strategy

### Frontend
- **Unit tests**: Component rendering, user interactions
- **Property-based tests**: Correctness properties with fast-check
- **Integration tests**: Redux state management, API calls
- All 204 tests passing

### Backend
- **Unit tests**: Model validation, utility functions
- **Integration tests**: API endpoints with Supertest
- **Database tests**: Mongoose operations

### Running Tests
```bash
# All tests
pnpm test

# Specific package
pnpm --filter backend test
pnpm --filter frontend test

# With coverage
pnpm --filter frontend test:ci
```

## Code Quality Standards

### Frontend
- Use ReScript for new critical components (type safety)
- Functional components with hooks (no class components)
- Redux Toolkit patterns (slices, thunks, selectors)
- React Testing Library (not Enzyme)
- Property-based testing for correctness properties

### Backend
- Async/await patterns (migrating from callbacks)
- Proper error handling and validation
- JWT authentication on protected routes
- Comprehensive API tests

### General
- Use Biome for formatting and linting: `pnpm format` and `pnpm lint`
- Auto-fix issues: `pnpm check:fix`
- Write tests for new features
- Keep commits focused and atomic

## Documentation

### Key Documents
- `README.md` - Project overview and setup
- `frontend/MODERNIZATION.md` - Complete modernization guide
- `frontend/RESCRIPT_GUIDE.md` - ReScript development guide
- `frontend/REACT_TO_RESCRIPT_MIGRATION.md` - Migration patterns
- `backend/TESTING.md` - Backend testing guide
- `.kiro/steering/*.md` - Development standards

### Steering Documents
Located in `.kiro/steering/`:
- `monorepo-structure.md` - Workspace organization
- `development-workflow.md` - Development guidelines
- `frontend-standards.md` - Frontend best practices
- `backend-standards.md` - Backend best practices
- `modernization-strategy.md` - Modernization roadmap

## Modernization Roadmap

### Completed (95%)
- ✅ React 18.3.1 with new root API
- ✅ Vite 6.x build system
- ✅ Redux Toolkit state management
- ✅ React Testing Library
- ✅ ReScript integration (8 components)
- ✅ All tests passing

### Optional Enhancements
- Continue ReScript migration (more components)
- Remove Flow types (deprecated)
- Update API client (Superagent → Axios)
- Backend: Update Mongoose to 8.x
- Backend: Migrate callbacks to async/await
- Backend: Add TypeScript (optional)

## Performance Metrics

### Frontend Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dev Server Start | 10-15s | 135ms | 100x faster |
| HMR Update | 1-3s | <100ms | 10-30x faster |
| Build Time | Variable | 3.2s | Consistent |

### Build Tools
- **Webpack 4** → **Vite 6**: Dramatically faster development
- **Flux** → **Redux Toolkit**: Modern state management
- **Enzyme** → **React Testing Library**: Better testing practices
- **Elm** → **ReScript**: Unified type-safe frontend

## Security Considerations

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate and sanitize all user inputs
- Keep dependencies updated
- Use HTTPS in production
- Rotate JWT secrets regularly
- Review CORS configuration

## CI/CD

- GitHub Actions for continuous integration
- Tests run on push to `main` or `develop`
- Tests run on pull requests
- See `.github/workflows/` for configurations

## Getting Help

### Documentation
1. Check `README.md` for setup and overview
2. Check `frontend/MODERNIZATION.md` for frontend details
3. Check `.kiro/steering/` for standards
4. Check component-specific docs in respective directories

### Common Commands Reference
```bash
# Development
pnpm --filter backend start
pnpm --filter frontend start
pnpm --filter frontend res:watch

# Testing
pnpm test
pnpm --filter <package> test

# Code Quality
pnpm format
pnpm --filter backend lint

# Dependencies
pnpm install
pnpm --filter <package> add <dependency>

# Build
pnpm --filter frontend build
pnpm --filter backend build
```

## Key Principles

1. **Use pnpm** - Never npm or yarn
2. **ReScript for type safety** - Not TypeScript on frontend
3. **Redux Toolkit patterns** - Modern state management
4. **Test everything** - Maintain 100% passing tests
5. **Format before commit** - Use Biome
6. **Session validation** - Always check `session.loggedIn`
7. **Environment variables** - Never commit `.env` files
8. **Incremental modernization** - Follow established patterns

---

**Last Updated:** Based on 95% complete modernization (React 18, Vite, Redux Toolkit, ReScript integration)

**Status:** Production-ready frontend, stable backend ready for modernization

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:46cd31e7 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
