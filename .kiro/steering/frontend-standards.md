---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend Standards (React + ReScript)

## Technology Stack

- **React**: 18.3.1 (modernized from 16.6)
- **ReScript**: 12.0.0 - Type-safe functional language compiling to JavaScript
- **State Management**: Redux Toolkit 2.11.0 with slices and async thunks
- **Routing**: React Router 6.30.2
- **Build Tool**: Vite 6.x with fast HMR
- **Testing**: Jest 29.x + React Testing Library
- **Styling**: CSS with normalize.css
- **Property-Based Testing**: fast-check for correctness properties

## Hybrid Architecture

This app uses React and ReScript:
- React handles the main application shell and most UI components
- ReScript provides type-safe components for critical features (8 components migrated from Elm)
- ReScript compiler handles `.res` file compilation to `.res.js`
- Vite handles bundling and HMR for both JavaScript and ReScript
- All compiled to optimized JavaScript in production builds

**Migrated ReScript Components:**
- Login, SignUp, Profile (authentication and user management)
- Admin, RolesAdmin, CreateRole (admin features)
- Landing, NotFound (static pages)

## Code Style

- Use modern ES6+ syntax (const/let, arrow functions, destructuring)
- Prefer functional components with hooks over class components
- Use PropTypes for type checking
- Follow React best practices for component composition
- Keep components small and focused

## State Management

**Redux Toolkit is now the standard:**

- Use `configureStore` for store setup
- Create slices with `createSlice` for reducers and actions
- Use `createAsyncThunk` for async operations
- Use typed hooks: `useAppDispatch` and `useAppSelector`
- Keep slices organized in `features/` directory
- Export selectors from slice files for reusability

**Example:**
```javascript
// features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const login = createAsyncThunk('auth/login', async (credentials) => {
  const response = await api.login(credentials);
  return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: '', session: { loggedIn: false } },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = '';
      state.session.loggedIn = false;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.session.loggedIn = true;
    });
  }
});

export const selectUser = (state) => state.auth.user;
export default authSlice.reducer;
```

## API Communication

- Use superagent for HTTP requests (working well, no need to change)
- API calls should be in async thunks
- Backend proxy configured in `vite.config.js`: `http://localhost:8000`
- Handle loading states and errors consistently in slices

## Build and Development

- **Vite configuration** in `vite.config.js`
- Development server with instant HMR
- Production builds optimized with tree-shaking
- Elm plugin for .elm file compilation

## Package Manager

**ALWAYS use `pnpm` for all frontend tasks, never `npm`.**

This is a pnpm workspace monorepo. Use these commands:

```bash
# Install dependencies
pnpm --filter frontend install

# Development
pnpm --filter frontend start              # Start Vite dev server (port 3000)

# Building
pnpm --filter frontend build              # Build ReScript + Vite production bundle
pnpm --filter frontend preview            # Preview production build locally

# Testing
pnpm --filter frontend test               # Run Jest tests
pnpm --filter frontend test:ci            # Run tests with coverage for CI

# ReScript
pnpm --filter frontend res:build          # Compile ReScript files once
pnpm --filter frontend res:watch          # Watch and auto-compile ReScript files
pnpm --filter frontend res:clean          # Clean ReScript build artifacts
```

### Recommended Development Workflow

Run these in separate terminals for optimal development experience:

**Terminal 1**: ReScript compiler in watch mode
```bash
pnpm --filter frontend res:watch
```

**Terminal 2**: Vite dev server
```bash
pnpm --filter frontend start
```

This enables:
- Automatic ReScript compilation on file changes (< 100ms)
- Hot Module Replacement (HMR) in browser (< 50ms)
- Fast development iteration

## ReScript Development

### ReScript Compilation

ReScript files (`.res`) are compiled to JavaScript (`.res.js`) automatically:

```bash
# Compile ReScript files once
pnpm --filter frontend res:build

# Watch mode (auto-compile on changes) - RECOMMENDED for development
pnpm --filter frontend res:watch

# Clean compiled files
pnpm --filter frontend res:clean
```

**Build Process:**
1. ReScript compiler compiles `.res` → `.res.js` (in-source)
2. Vite bundles `.res.js` files with other JavaScript
3. Production build: `pnpm build` runs ReScript build first, then Vite build

### ReScript File Organization

```
frontend/
├── src/
│   ├── bindings/              # JavaScript interop bindings
│   │   ├── Redux.res         # Redux Toolkit (useDispatch, useSelector)
│   │   ├── ReactRouter.res   # React Router (useNavigate)
│   │   ├── Materialize.res   # Toast notifications
│   │   ├── LocalStorage.res  # localStorage API
│   │   └── Fetch.res         # HTTP client
│   ├── features/             # Type definitions for Redux state
│   │   ├── auth/
│   │   │   ├── authSlice.js  # Redux slice (JavaScript)
│   │   │   └── AuthTypes.res # Type definitions (ReScript)
│   │   ├── roles/
│   │   │   ├── rolesSlice.js
│   │   │   └── RoleTypes.res
│   │   └── documents/
│   │       ├── documentsSlice.js
│   │       └── DocumentTypes.res
│   └── components/           # React components (JS + ReScript)
│       ├── Login/
│       │   ├── Login.res     # ReScript component
│       │   ├── Login.res.js  # Compiled output (auto-generated)
│       │   └── __tests__/
│       │       └── Login.test.js
│       └── [other components...]
├── bsconfig.json             # ReScript compiler configuration
└── lib/bs/                   # ReScript build output (gitignored)
```

### ReScript Configuration

**bsconfig.json** - ReScript compiler settings:
- **in-source compilation**: `.res.js` files generated next to `.res` files
- **ES6 modules**: Compatible with Vite
- **JSX v4**: Automatic React JSX runtime
- **suffix**: `.res.js` for compiled files

## Testing Standards

### React Testing Library

**Use React Testing Library for all React component tests:**

```javascript
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

test('renders component', () => {
  render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <Component />
      </BrowserRouter>
    </Provider>
  );
  
  expect(screen.getByText(/expected text/i)).toBeInTheDocument();
});
```

### Property-Based Testing

Use fast-check for testing correctness properties:

```javascript
import fc from 'fast-check';

test('property: operation is idempotent', () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const result1 = operation(value);
      const result2 = operation(result1);
      expect(result1).toEqual(result2);
    }),
    { numRuns: 100 }
  );
});
```

### Test Organization

- Unit tests: `*.test.js`
- Property-based tests: `*.properties.test.js`
- Elm tests: `tests/*Test.elm`
- Co-locate tests with source files in `__tests__/` directories

## Authentication Patterns

### Critical: Session Validation Guard

**ALWAYS check `session.loggedIn` before redirecting based on user data.**

Redux state updates are async and can contain stale data during transitions. Never trust the user object alone.

#### The Pattern

```javascript
// ❌ BAD - Can cause infinite redirect loops
if (user && prevProps.user !== this.props.user) {
  navigate('/dashboard');
}

// ✅ GOOD - Validates session is actually valid
if (user && prevProps.user !== this.props.user && session.loggedIn) {
  navigate('/dashboard');
}
```

#### Why This Matters

When a session becomes invalid:
1. localStorage is cleared (instant)
2. Logout action is dispatched (async)
3. Redux state updates (delayed)

During step 2-3, Redux still has old user data but `session.loggedIn` is false. Without the guard, components redirect based on stale data, causing infinite loops.

#### Component Responsibilities

**PrivateRoute**: All route protection and redirects
**NavBar**: Session validation and state cleanup (NO redirects)
**Login/SignUp**: Form handling and success navigation (with session guard)

#### When to Use

Use the session validation guard whenever:
- Redirecting after authentication
- Making navigation decisions based on user data
- Handling auth-related component updates

**Key Rule**: `session.loggedIn` is the single source of truth for authentication state.

See `frontend/AUTHENTICATION.md` for complete documentation.

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication UI
│   │   ├── Dashboard/    # Document list
│   │   └── *.elm         # Elm components
│   ├── features/         # Redux Toolkit slices
│   │   ├── auth/
│   │   ├── documents/
│   │   └── roles/
│   ├── store/            # Redux store config
│   │   ├── index.js      # Store setup
│   │   └── hooks.js      # Typed hooks
│   ├── utils/            # Helpers (ReactElm bridge)
│   └── styles/           # CSS
├── tests/                # Elm tests
├── vite.config.js        # Vite configuration
└── jest.config.js        # Jest configuration
```

## Modernization Status

✅ **Completed (95% Complete):**
- React 18.3.1 with new root API
- Vite 6.x build system (100x faster than Webpack 4)
- Redux Toolkit state management (migrated from Flux)
- React Testing Library (Enzyme removed)
- React Router 6.30.2
- ReScript integration (8 components migrated from Elm)
- All tests passing (23 suites, 204 tests)

**Performance Improvements:**
- Dev server start: 10-15s → 135ms (100x faster)
- HMR updates: 1-3s → <100ms (10-30x faster)
- Compile-time type safety with ReScript

See `frontend/MODERNIZATION.md` for complete modernization details.

## Best Practices

1. **Use Redux Toolkit patterns** - createSlice, createAsyncThunk, selectors
2. **Test user behavior** - Use React Testing Library queries
3. **Follow session validation** - Always check session.loggedIn
4. **Write property-based tests** - For critical correctness properties
5. **Use typed hooks** - useAppDispatch and useAppSelector
6. **Keep slices focused** - One slice per feature domain
7. **Export selectors** - Make state access reusable
8. **Type Redux state** - Create ReScript type definitions for all slices
9. **Run res:watch during development** - Automatic ReScript compilation
10. **Use ReScript for new critical components** - Leverage compile-time type safety
11. **Format and lint with Biome** - Run `pnpm format` and `pnpm lint` before committing

### Code Quality with Biome

Biome is the modern, fast formatter and linter for the frontend:

```bash
# Format code
pnpm --filter frontend format

# Check formatting without changes
pnpm --filter frontend format:check

# Lint code
pnpm --filter frontend lint

# Auto-fix linting issues
pnpm --filter frontend lint:fix

# Check and fix everything
pnpm --filter frontend check:fix
```

**Configuration**: `biome.json` at root level
- Ignores compiled ReScript files (*.res.js, *.bs.js)
- 2-space indentation
- Single quotes for JS, double quotes for JSX
- 100 character line width

### ReScript Best Practices

1. **Component Structure**:
   - Use `@react.component` decorator
   - Export with `let default = make`
   - Keep components focused and small

2. **Type Safety**:
   - Use `option<'a>` instead of null/undefined
   - Pattern match exhaustively
   - Add explicit type annotations for clarity

3. **JavaScript Interop**:
   - Create bindings in `src/bindings/`
   - Use external declarations for JS functions
   - Keep bindings simple and focused

4. **Testing**:
   - Test ReScript components with Jest + RTL
   - Test helper functions directly
   - Integration tests validate bindings work

5. **Development Workflow**:
   - Always run `res:watch` in development
   - Check compiler output for errors
   - Leverage HMR for fast iteration

