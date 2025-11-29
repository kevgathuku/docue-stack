# Frontend - Document Management System

React + Elm hybrid frontend for the document management system. See the [root README](../README.md) for general project information and setup instructions.

## Architecture

### Technology Stack

- **React 18.x** - UI framework with functional components and hooks
- **Elm 0.19.x** - Embedded components for specific features
- **Redux Toolkit** - State management with slices and async thunks
- **React Router 6.x** - Client-side routing
- **Vite** - Build tool and dev server
- **Jest + React Testing Library** - React component testing
- **elm-test** - Elm component testing
- **fast-check** - Property-based testing

### Hybrid React + Elm

This application uses both React and Elm:
- React handles the main application shell and most UI components
- Elm components are embedded for specific features (Login, Admin, etc.)
- `ReactElm` utility bridges React and Elm via ports
- Elm files compile as part of the Vite build process

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
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication UI
│   │   ├── Dashboard/    # Document list
│   │   ├── DocumentPage/ # Document detail/edit
│   │   └── *.elm         # Elm components
│   ├── features/         # Redux slices
│   ├── store/            # Redux store config
│   ├── utils/            # Helpers (ReactElm bridge)
│   └── styles/           # CSS
├── public/               # Static assets
├── config/               # Build configuration
└── tests/                # Elm tests
```

### Testing

```bash
# Run all tests (React + Elm)
pnpm --filter frontend test

# Run React tests only
pnpm --filter frontend test -- --testMatch="**/*.test.js"

# Run property-based tests
pnpm --filter frontend test -- --testMatch="**/*.properties.test.js"

# Run Elm tests
pnpm --filter frontend test:elm

# Run tests in watch mode
pnpm --filter frontend test -- --watch
```

**Test Organization:**
- `*.test.js` - Unit tests for components and slices
- `*.properties.test.js` - Property-based tests using fast-check
- `*Test.elm` - Elm component tests

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
NODE_ENV=development  # development, test, or production
```

## Elm Integration

### Working with Elm Components

Elm components are embedded in React using the `ReactElm` wrapper:

```javascript
import ReactElm from '../../utils/ReactElm';
import Login from '../Login.elm';

<ReactElm
  src={Login}
  flags={{ apiUrl: 'http://localhost:8000' }}
  ports={setupPorts}
/>
```

### Elm Development

- Elm files are in `src/components/*.elm`
- Elm tests are in `tests/*Test.elm`
- Elm compiler errors are shown in the browser during development

## Additional Documentation

- [Authentication Patterns](AUTHENTICATION.md) - Session validation and auth flows
- [Hooks Migration Guide](HOOKS_MIGRATION_GUIDE.md) - Class to functional components
- [React 18 Migration](REACT_18_MIGRATION.md) - React 18 upgrade notes
- [Vite Migration](VITE_MIGRATION.md) - Webpack to Vite migration
- [Phase 3 Testing](PHASE3_TESTING.md) - Testing strategies
- [Modernization Strategy](MODERNIZATION.md) - Ongoing improvements
- [Elm Quick Start](ELM_QUICK_START.md) - Elm basics
- [Elm Debugging](ELM_DEBUGGING.md) - Debugging Elm components

## Troubleshooting

### Port Already in Use

If port 3000 is in use, Vite will prompt to use another port or you can specify one:

```bash
pnpm --filter frontend start -- --port 3001
```

### API Connection Issues

Ensure the backend is running on port 8000. Check the proxy configuration in `vite.config.js`.

### Elm Compilation Errors

Elm compiler errors are usually very descriptive. Read the error message carefully - it often suggests the fix.

### Redux DevTools Not Working

Install the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools) for your browser. It's automatically enabled in development.

## Contributing

When working on the frontend:

1. Follow React best practices (functional components, hooks)
2. Use Redux Toolkit patterns (slices, thunks, selectors)
3. Write tests for new features (unit + property-based)
4. Ensure Elm code compiles without warnings
5. Test authentication flows thoroughly
6. Run `pnpm format` before committing

See the [root README](../README.md) for general contribution guidelines.
