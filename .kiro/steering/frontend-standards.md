---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend Standards (React + Elm)

## Technology Stack

- **React**: 18.3.1 (modernized from 16.6)
- **Elm**: Hybrid architecture with Elm components
- **State Management**: Redux Toolkit with slices and async thunks
- **Routing**: React Router 6.30.2
- **Build Tool**: Vite 6.x with fast HMR
- **Testing**: Jest 29.x + React Testing Library for React, elm-test for Elm
- **Styling**: CSS with normalize.css
- **Property-Based Testing**: fast-check for correctness properties

## Hybrid Architecture

This app uses both React and Elm:
- React handles the main application shell and most UI
- Elm components are embedded for specific features (Login, Admin, etc.)
- Vite plugin handles Elm compilation
- Elm files are compiled as part of the Vite build

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

# Run development server (Vite)
pnpm --filter frontend start

# Run tests
pnpm --filter frontend test

# Run Elm tests
pnpm --filter frontend test:elm

# Build for production
pnpm --filter frontend build

# Preview production build
pnpm --filter frontend preview
```

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

✅ **Completed:**
- React 18.3.1 with new root API
- Vite 6.x build system
- Redux Toolkit state management
- React Testing Library (Enzyme removed)
- React Router 6.30.2
- All tests passing (23 suites, 204 tests)

See `frontend/MODERNIZATION.md` for complete modernization details.

## Best Practices

1. **Use Redux Toolkit patterns** - createSlice, createAsyncThunk, selectors
2. **Test user behavior** - Use React Testing Library queries
3. **Maintain Elm integration** - Don't break the hybrid architecture
4. **Follow session validation** - Always check session.loggedIn
5. **Write property-based tests** - For critical correctness properties
6. **Use typed hooks** - useAppDispatch and useAppSelector
7. **Keep slices focused** - One slice per feature domain
8. **Export selectors** - Make state access reusable

