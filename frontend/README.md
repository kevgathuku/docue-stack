# Frontend - Document Management System

React + Elm hybrid frontend for the document management system. See the [root README](../README.md) for general project information and setup instructions.

## Architecture

### Technology Stack

- **React 18.x** - UI framework with functional components and hooks
- **ReScript** - Type-safe functional language that compiles to JavaScript
- **Redux Toolkit** - State management with slices and async thunks
- **React Router 6.x** - Client-side routing
- **Vite** - Build tool and dev server
- **Jest + React Testing Library** - Component testing
- **fast-check** - Property-based testing

### Hybrid React + ReScript

This application uses both React (JavaScript) and ReScript:
- React handles most UI components and application logic
- ReScript components provide compile-time type safety for critical features
- 8 components migrated from Elm to ReScript (Login, Profile, Admin, RolesAdmin, CreateRole, Landing, NotFound, SignUp)
- ReScript compiles to JavaScript and integrates seamlessly with React
- Type-safe bindings for Redux, React Router, and other JavaScript libraries

### State Management

The app uses Redux Toolkit for global state:

```
frontend/src/
├── store/
│   ├── index.js           # Store configuration
│   └── hooks.js           # Typed useAppDispatch, useAppSelector
├── features/
│   ├── auth/
│   │   ├── authSlice.js   # Authentication state, thunks, selectors
│   │   ├── authSlice.test.js
│   │   └── authSlice.properties.test.js
│   ├── documents/
│   │   └── documentsSlice.js  # Document CRUD operations
│   └── roles/
│       └── rolesSlice.js      # Role management
```

**Key Patterns:**
- Use `useAppSelector` and `useAppDispatch` hooks in components
- Async operations use `createAsyncThunk`
- Redux DevTools enabled in development

## Development

### Running the Frontend

From the root directory:

```bash
# Start dev server (runs on port 3000)
pnpm --filter frontend start
```

The frontend proxies API requests to `http://localhost:8000` (ensure backend is running).

### Project Structure

```
frontend/
├── src/
│   ├── components/        # React and ReScript components
│   │   ├── Auth/         # Authentication UI (React)
│   │   ├── Dashboard/    # Document list (React)
│   │   ├── DocumentPage/ # Document detail/edit (React)
│   │   ├── Login/        # Login form (ReScript)
│   │   ├── Profile/      # User profile (ReScript)
│   │   ├── Admin/        # Admin dashboard (ReScript)
│   │   ├── RolesAdmin/   # Roles management (ReScript)
│   │   ├── CreateRole/   # Create role form (ReScript)
│   │   ├── Landing/      # Landing page (ReScript)
│   │   ├── NotFound/     # 404 page (ReScript)
│   │   └── SignUp/       # Sign up form (ReScript)
│   ├── bindings/         # ReScript bindings for JavaScript libraries
│   │   ├── Redux.res     # Redux Toolkit bindings
│   │   ├── ReactRouter.res # React Router bindings
│   │   ├── Materialize.res # Toast notifications
│   │   ├── LocalStorage.res # localStorage API
│   │   └── Fetch.res     # HTTP client
│   ├── features/         # Redux slices and ReScript types
│   │   ├── auth/
│   │   │   ├── authSlice.js
│   │   │   └── AuthTypes.res
│   │   ├── documents/
│   │   │   ├── documentsSlice.js
│   │   │   └── DocumentTypes.res
│   │   └── roles/
│   │       ├── rolesSlice.js
│   │       └── RoleTypes.res
│   ├── store/            # Redux store config
│   ├── utils/            # Utility functions
│   └── styles/           # CSS
├── public/               # Static assets
├── config/               # Build configuration
├── bsconfig.json         # ReScript compiler configuration
└── lib/                  # ReScript build output
```

### Testing

```bash
# Run all tests
pnpm --filter frontend test

# Run unit tests only
pnpm --filter frontend test -- --testMatch="**/*.test.js"

# Run property-based tests
pnpm --filter frontend test -- --testMatch="**/*.properties.test.js"

# Run tests in watch mode
pnpm --filter frontend test -- --watch

# Run with coverage
pnpm --filter frontend test:ci
```

**Test Organization:**
- `*.test.js` - Unit tests for React and ReScript components
- `*.properties.test.js` - Property-based tests using fast-check
- Tests are co-located with components in `__tests__/` directories

**Test Results:**
```
Test Suites: 23 passed, 23 total
Tests:       204 passed, 204 total
```

### Building for Production

```bash
# Build optimized production bundle
pnpm --filter frontend build

# Preview production build
pnpm --filter frontend preview
```

## Key Features

### Authentication

- JWT-based authentication with localStorage persistence
- Session validation guard pattern (see `AUTHENTICATION.md`)
- Protected routes via `PrivateRoute` component

**Critical Pattern:**
```javascript
// Always check session.loggedIn before redirecting
if (user && session.loggedIn) {
  navigate('/dashboard');
}
```

### Document Management

- Create, read, update, delete documents
- Role-based access control
- Real-time state updates via Redux

### Role Management

- Admin interface for role CRUD operations
- User-role assignment
- Role-based UI rendering

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
NODE_ENV=development                    # development, test, or production
VITE_API_BASE_URL=http://localhost:8000 # Backend API URL
```

**Environment Variable Details:**

- `NODE_ENV` - Sets the application environment mode
- `VITE_API_BASE_URL` - Backend API base URL (must be prefixed with `VITE_` to be exposed to the client)
  - Development: `http://localhost:8000`
  - Production: Set to your deployed backend URL

All environment variables prefixed with `VITE_` are exposed to the client-side code via `import.meta.env`.

## ReScript Integration

### Working with ReScript Components

ReScript components compile to JavaScript and can be imported directly:

```javascript
// Import compiled ReScript component
import Login from './Login/Login.res.js';

// Use like any React component
function App() {
  return <Login />;
}
```

### ReScript Development

**Build Commands:**
```bash
# Build ReScript files once
pnpm res:build

# Watch mode - auto-recompile on changes
pnpm res:watch

# Clean compiled files
pnpm res:clean
```

**Recommended Workflow:**
1. Terminal 1: `pnpm res:watch` (ReScript compiler in watch mode)
2. Terminal 2: `pnpm start` (Vite dev server)

This enables fast HMR with automatic ReScript compilation.

**ReScript Files:**
- Source files: `src/**/*.res`
- Compiled output: `src/**/*.res.js` (auto-generated, in-source)
- Type definitions: `src/features/**/*Types.res`
- Bindings: `src/bindings/*.res`

**Configuration:**
- `bsconfig.json` - ReScript compiler configuration
- In-source compilation with `.res.js` suffix
- ES6 modules for Vite compatibility
- JSX v4 with automatic runtime

## Additional Documentation

- [Modernization Strategy](MODERNIZATION.md) - Complete modernization guide (React 18, Vite, Redux Toolkit, ReScript, Jest/Babel config)
- [ReScript Guide](RESCRIPT_GUIDE.md) - Complete ReScript development guide
- [React to ReScript Migration](REACT_TO_RESCRIPT_MIGRATION.md) - Migration patterns and best practices
- [Authentication Patterns](AUTHENTICATION.md) - Session validation and auth flows
- [Hooks Migration Guide](HOOKS_MIGRATION_GUIDE.md) - Class to functional components
- [Testing Guide](TESTING.md) - Testing patterns and best practices

## Troubleshooting

### Port Already in Use

If port 3000 is in use, Vite will prompt to use another port or you can specify one:

```bash
pnpm --filter frontend start -- --port 3001
```

### API Connection Issues

Ensure the backend is running on port 8000. Check the proxy configuration in `vite.config.js`.

### ReScript Compilation Errors

ReScript compiler errors are descriptive and include suggestions. Common issues:

- **"A ReScript build is already running"**: Kill the process with `pkill -f rescript` or run `pnpm res:clean`
- **Type mismatch**: Add explicit type annotations or check pattern matching
- **Import errors**: Ensure `.res.js` file exists and you're importing with the correct extension
- **HMR not working**: Make sure both `res:watch` and `start` are running

### Redux DevTools Not Working

Install the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools) for your browser. It's automatically enabled in development.

## Contributing

When working on the frontend:

1. Follow React best practices (functional components, hooks)
2. Use Redux Toolkit patterns (slices, thunks, selectors)
3. Write tests for new features (unit + property-based)
4. For ReScript components:
   - Run `pnpm res:watch` during development
   - Follow ReScript naming conventions
   - Add type annotations for clarity
   - Export components with `let default = make`
5. Test authentication flows thoroughly
6. Run `pnpm format` before committing
7. Ensure all tests pass: `pnpm test`

See the [root README](../README.md) for general contribution guidelines.
