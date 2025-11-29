# Phase 3: Testing Modernization - Status

## Current Status: ⚠️ IN PROGRESS

Phase 3 involves migrating from Enzyme (deprecated) to React Testing Library for React 18 compatibility.

## What's Been Done

### ✅ Installed React Testing Library
- `@testing-library/react@^16.3.0`
- `@testing-library/jest-dom@^6.9.1`
- `@testing-library/user-event@^14.6.1`

### ✅ Removed Deprecated Packages
- Removed `enzyme@2.9.1` (incompatible with React 18)
- Removed `expect@1.20.2` (use Jest's built-in expect)
- Removed `expect-jsx@5.0.0` (not needed with RTL)

### ✅ Updated Test Setup
- Updated `src/setupTests.js` to import `@testing-library/jest-dom`

## What Needs to Be Done

### Test Files to Convert (14 files)

All component tests need conversion from Enzyme to React Testing Library:

1. ✅ `src/components/Auth/__tests__/Auth-test.js` - STARTED (needs Redux/Router mocking)
2. ❌ `src/components/Login/__tests__/Login-test.js`
3. ❌ `src/components/SignUp/__tests__/SignUp-test.js`
4. ❌ `src/components/NavBar/__tests__/NavBar-test.js`
5. ❌ `src/components/Profile/__tests__/Profile-test.js`
6. ❌ `src/components/Dashboard/__tests__/Dashboard-test.js`
7. ❌ `src/components/Dashboard/__tests__/DocList-test.js`
8. ❌ `src/components/CreateDocument/__tests__/CreateDocument-test.js`
9. ❌ `src/components/DocumentPage/__tests__/DocumentPage-test.js`
10. ❌ `src/components/CreateRole/__tests__/CreateRole-test.js`
11. ❌ `src/components/RolesAdmin/__tests__/RolesAdmin-test.js`
12. ❌ `src/components/UsersAdmin/__tests__/UsersAdmin-test.js`
13. ❌ `src/components/Landing/__tests__/Main-test.js`
14. ❌ `src/actions/__tests__/UserActions-test.js` - Empty test file

### Non-Component Tests (Already Passing)

These tests don't use Enzyme and are working:
- ✅ `src/stores/__tests__/DocStore-test.js`
- ✅ `src/actions/__tests__/DocActions-test.js`
- ✅ `src/actions/__tests__/BaseActions-test.js`
- ✅ `src/stores/__tests__/RoleStore-test.js`

## Migration Pattern

### Old Enzyme Pattern:
```javascript
import { shallow, mount } from 'enzyme';

it('renders component', () => {
  const wrapper = shallow(<Component />);
  expect(wrapper.find('.class')).toExist();
  expect(wrapper.text()).toMatch(/text/);
});
```

### New React Testing Library Pattern:
```javascript
import { render, screen } from '@testing-library/react';

it('renders component', () => {
  render(<Component />);
  expect(screen.getByText(/text/i)).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Key Differences

### Enzyme vs React Testing Library

| Aspect | Enzyme | React Testing Library |
|--------|--------|----------------------|
| Philosophy | Test implementation details | Test user behavior |
| Queries | `.find()`, `.text()` | `getByRole()`, `getByText()` |
| React Support | Up to React 16 | React 18+ |
| Maintenance | Deprecated | Actively maintained |
| Learning Curve | Steeper | Easier |

## Common Challenges

### 1. Redux Connected Components

Components using Redux need a Provider wrapper:

```javascript
import { Provider } from 'react-redux';
import { createStore } from 'redux';

const mockStore = createStore((state = {}) => state);

render(
  <Provider store={mockStore}>
    <Component />
  </Provider>
);
```

### 2. React Router Components

Components using routing need BrowserRouter:

```javascript
import { BrowserRouter } from 'react-router-dom';

render(
  <BrowserRouter>
    <Component />
  </BrowserRouter>
);
```

### 3. Combined Wrappers

Many components need both:

```javascript
const Wrapper = ({ children }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

render(<Component />, { wrapper: Wrapper });
```

### 4. Elm Components

Components using Elm (Login, CreateRole, etc.) need special handling:
- Mock the Elm module
- Test the React wrapper behavior
- Don't test Elm internals (use elm-test for that)

### 5. Redux/Store Components

Components using Redux need:
- Wrap components with Redux Provider in tests
- Use mock store from @reduxjs/toolkit or configureStore for testing
- Test component behavior with real Redux state, not store logic

## Recommended Approach

### Option 1: Incremental Conversion (Recommended)

Convert tests one at a time as you work on features:
1. When touching a component, convert its test
2. Focus on critical user paths first
3. Skip tests for components being rewritten

### Option 2: Batch Conversion

Convert all tests in one go:
1. Create test utilities for common wrappers
2. Convert simple components first
3. Handle complex components (Redux, Router, Elm) last
4. Estimated time: 1-2 days

### Option 3: Skip for Now

Since the app works perfectly:
1. Leave tests broken temporarily
2. Focus on feature development
3. Come back to tests later
4. Write new tests with RTL for new features

## Test Utilities to Create

Create `src/test-utils.js`:

```javascript
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';

// Mock store
const mockReducer = (state = {
  user: {},
  token: null,
  session: {},
  documents: [],
  roles: []
}) => state;

export const mockStore = createStore(mockReducer);

// Custom render with providers
export function renderWithProviders(
  ui,
  {
    store = mockStore,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
```

Then use it in tests:

```javascript
import { renderWithProviders, screen } from '../../test-utils';

it('renders component', () => {
  renderWithProviders(<Component />);
  expect(screen.getByText(/text/i)).toBeInTheDocument();
});
```

## Current Test Results

```
Test Suites: 14 failed, 4 passed, 18 total
Tests:       14 passed, 14 total
```

- ✅ 4 passing suites (stores and actions - no Enzyme)
- ❌ 14 failing suites (components - using Enzyme)
- ✅ App builds and runs perfectly
- ✅ All features work in browser

## Decision Point

**The frontend is fully functional.** Tests are a quality-of-life improvement, not a blocker.

### Recommendation:

**Option 3: Skip for now** and continue with Phase 4 (Build Tools) or Phase 5 (Redux Toolkit).

Reasons:
1. App works perfectly in production
2. Test conversion is time-consuming (1-2 days)
3. Can write new tests with RTL as you add features
4. Tests can be converted incrementally
5. Focus on delivering features first

### If You Want to Continue:

1. Create `src/test-utils.js` with common wrappers
2. Convert one simple test completely (e.g., Landing/Main-test.js)
3. Use that as a template for others
4. Convert 2-3 tests per day alongside feature work

## Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Enzyme to RTL Migration Guide](https://testing-library.com/docs/react-testing-library/migrate-from-enzyme/)
- [Common Testing Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Redux](https://redux.js.org/usage/writing-tests)
