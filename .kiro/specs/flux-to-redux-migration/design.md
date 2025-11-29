# Design Document: Flux to Redux Migration

## Overview

This design outlines the migration strategy from Flux architecture to Redux Toolkit for the frontend application. The migration will replace the existing Flux pattern (Dispatcher, multiple Stores, Actions) with a modern Redux implementation using Redux Toolkit (RTK). The design ensures zero breaking changes to functionality while modernizing the state management approach.

The migration follows an incremental approach: install dependencies, create Redux slices from existing stores, convert actions to thunks, update components to use Redux hooks, update tests, and finally remove Flux code.

## Architecture

### Current Flux Architecture

```
Components → Actions → Dispatcher → Stores → Components
                ↓
            API Calls
```

**Current Structure:**
- **AppDispatcher**: Central dispatcher coordinating all actions
- **Stores**: DocStore, RoleStore (domain-specific), plus a reducer for auth
- **Actions**: BaseActions, DocActions, RoleActions, actionCreators
- **Components**: Subscribe to stores via addChangeListener/removeChangeListener

### Target Redux Architecture

```
Components → Dispatch(Actions/Thunks) → Store → Components
                      ↓
                  API Calls
```

**Target Structure:**
- **Single Store**: Configured with Redux Toolkit's configureStore
- **Slices**: documents, roles, auth (each with reducers, actions, selectors)
- **Thunks**: Async actions using createAsyncThunk
- **Components**: Use useSelector and useDispatch hooks

### Migration Strategy

The migration will be performed incrementally to minimize risk:

1. **Phase 1**: Install Redux dependencies alongside Flux
2. **Phase 2**: Create Redux slices parallel to existing stores
3. **Phase 3**: Migrate components one by one to use Redux
4. **Phase 4**: Update tests to work with Redux
5. **Phase 5**: Remove Flux code and dependencies

## Components and Interfaces

### Redux Store Configuration

**File**: `frontend/src/store/index.js`

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import documentsReducer from '../features/documents/documentsSlice';
import rolesReducer from '../features/roles/rolesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    roles: rolesReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Slice Structure

Each slice will follow this pattern:

**File**: `frontend/src/features/{domain}/{domain}Slice.js`

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchItems = createAsyncThunk(
  'domain/fetchItems',
  async (params, { rejectWithValue }) => {
    // API call logic
  }
);

// Slice
const domainSlice = createSlice({
  name: 'domain',
  initialState: { /* ... */ },
  reducers: {
    // Synchronous actions
  },
  extraReducers: (builder) => {
    // Handle async thunk actions
    builder
      .addCase(fetchItems.pending, (state) => { /* ... */ })
      .addCase(fetchItems.fulfilled, (state, action) => { /* ... */ })
      .addCase(fetchItems.rejected, (state, action) => { /* ... */ });
  },
});

export const { /* actions */ } = domainSlice.actions;
export default domainSlice.reducer;

// Selectors
export const selectItems = (state) => state.domain.items;
```

### Hook Utilities

**File**: `frontend/src/store/hooks.js`

```javascript
import { useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
```

## Data Models

### Auth Slice State

```javascript
{
  users: User[] | null,
  usersError: Error | null,
  session: {
    loggedIn: boolean,
    loading: boolean,
  },
  sessionError: string,
  loginError: string,
  logoutResult: string,
  logoutError: string,
  signupError: Error | null,
  profileUpdateResult: any | null,
  profileUpdateError: string,
  token: string,
  user: User,
}
```

### Documents Slice State

```javascript
{
  doc: Document | null,
  docs: Document[] | null,
  docCreateResult: any | null,
  docDeleteResult: { data: any, statusCode: number } | null,
  docEditResult: { data: any, statusCode: number } | null,
  loading: boolean,
  error: Error | null,
}
```

### Roles Slice State

```javascript
{
  createdRole: Role | null,
  roles: Role[] | null,
  loading: boolean,
  error: Error | null,
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, several properties can be consolidated:

- Properties 2.1, 2.2, and 2.3 (slice equivalence) can be combined into a single comprehensive property about state management equivalence
- Properties 5.1, 5.2, 5.3, and 5.4 (functional preservation) are all testing the same concept: behavioral equivalence after migration
- Property 3.4 and 3.5 are related but test different aspects (state transitions vs error handling)

The consolidated properties provide unique validation value without redundancy.

### Testable Properties

Property 1: State management equivalence
*For any* action dispatched to a Redux slice (documents, roles, or auth), the resulting state should be equivalent to the state that would have been produced by the corresponding Flux store
**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Async thunk state transitions
*For any* async thunk execution, the state should transition through pending status, then to either fulfilled or rejected status with appropriate data or error
**Validates: Requirements 3.4**

Property 3: Error handling preservation
*For any* API call that fails, the error should be captured in the Redux state in the same format as the Flux implementation
**Validates: Requirements 3.5**

Property 4: Authentication functionality preservation
*For any* authentication operation (login, logout, session check, signup, profile update), the Redux implementation should produce the same side effects and state changes as the Flux implementation
**Validates: Requirements 5.1, 5.4**

Property 5: Document operations preservation
*For any* document operation (create, read, update, delete, list), the Redux implementation should produce the same side effects and state changes as the Flux implementation
**Validates: Requirements 5.2**

Property 6: Role operations preservation
*For any* role operation (create, list), the Redux implementation should produce the same side effects and state changes as the Flux implementation
**Validates: Requirements 5.3**

Property 7: Component re-render equivalence
*For any* state change in Redux, components using useSelector should re-render in the same scenarios as components using Flux store listeners
**Validates: Requirements 5.5**

## Error Handling

### Async Thunk Error Handling

All async thunks will use a consistent error handling pattern:

```javascript
export const fetchData = createAsyncThunk(
  'domain/fetchData',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.call(params);
      return response.body;
    } catch (err) {
      // Preserve error format from Flux implementation
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);
```

### Slice Error State

Each slice will maintain error state compatible with existing component expectations:

```javascript
extraReducers: (builder) => {
  builder
    .addCase(fetchData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
}
```

### Component Error Handling

Components will access error state through selectors:

```javascript
const error = useAppSelector(selectDocumentsError);

if (error) {
  return <ErrorDisplay message={error} />;
}
```

## Testing Strategy

### Dual Testing Approach

The migration will employ both unit tests and property-based tests to ensure correctness:

**Unit Tests:**
- Test specific examples of state transitions
- Test edge cases like empty state, null values
- Test integration between components and Redux
- Test selector functions return correct data
- Test thunk success and failure scenarios

**Property-Based Tests:**
- Verify state equivalence between Flux and Redux implementations
- Test that async operations always transition through correct states
- Verify error handling works across all failure scenarios
- Test component re-rendering behavior is consistent

### Testing Framework

- **Unit Testing**: Jest (already configured)
- **Property-Based Testing**: fast-check (JavaScript PBT library)
- **Component Testing**: React Testing Library with Redux mock store
- **Minimum PBT Iterations**: 100 runs per property test

### Test Organization

```
frontend/src/
  features/
    auth/
      authSlice.js
      authSlice.test.js          # Unit tests
      authSlice.properties.test.js  # Property-based tests
    documents/
      documentsSlice.js
      documentsSlice.test.js
      documentsSlice.properties.test.js
    roles/
      rolesSlice.js
      rolesSlice.test.js
      rolesSlice.properties.test.js
```

### Property-Based Test Tags

Each property-based test will be tagged with a comment referencing the design document:

```javascript
// **Feature: flux-to-redux-migration, Property 1: State management equivalence**
test('Redux slices produce equivalent state to Flux stores', () => {
  fc.assert(
    fc.property(fc.action(), (action) => {
      // Test implementation
    }),
    { numRuns: 100 }
  );
});
```

### Migration Testing Strategy

During migration, we'll maintain both Flux and Redux implementations temporarily to enable comparison testing:

1. **Phase 1**: Create Redux slices alongside Flux stores
2. **Phase 2**: Write property tests comparing Flux and Redux behavior
3. **Phase 3**: Migrate components one at a time, testing each
4. **Phase 4**: Remove Flux code once all tests pass

### Test Coverage Goals

- Maintain existing test coverage (currently ~80%)
- Add property-based tests for critical state transitions
- Ensure all async thunks have success and failure tests
- Test all component migrations with Redux Provider

## Implementation Notes

### Dependency Installation

```bash
pnpm --filter frontend add @reduxjs/toolkit react-redux
pnpm --filter frontend add -D fast-check redux-mock-store
```

### Provider Setup

Update `frontend/src/index.js`:

```javascript
import { Provider } from 'react-redux';
import { store } from './store';

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

### Migration Order

1. **Auth slice** (most critical, affects all authenticated routes)
2. **Documents slice** (most complex, multiple operations)
3. **Roles slice** (simpler, fewer operations)

### Component Migration Pattern

For each component:

1. Import Redux hooks instead of Flux stores
2. Replace `addChangeListener`/`removeChangeListener` with `useSelector`
3. Replace action calls with `useDispatch` + thunk dispatch
4. Update tests to use Redux Provider
5. Verify functionality manually and with tests

### Backward Compatibility

During migration, some components may still use Flux while others use Redux. This is acceptable as a temporary state. The store configurations are independent and won't conflict.

### Performance Considerations

- Use memoized selectors with `createSelector` from Reselect (included in RTK)
- Avoid creating new selector functions in render
- Use shallow equality checks for object/array selections
- Consider using `useAppSelector` with equality function for complex selections

### Code Organization

```
frontend/src/
  store/
    index.js           # Store configuration
    hooks.js           # Typed hooks
  features/
    auth/
      authSlice.js     # Slice, thunks, selectors
    documents/
      documentsSlice.js
    roles/
      rolesSlice.js
```

### Selector Patterns

Export selectors from slice files for reusability:

```javascript
// In slice file
export const selectDocuments = (state) => state.documents.docs;
export const selectDocument = (state) => state.documents.doc;
export const selectDocumentsLoading = (state) => state.documents.loading;
export const selectDocumentsError = (state) => state.documents.error;

// In component
const documents = useAppSelector(selectDocuments);
const loading = useAppSelector(selectDocumentsLoading);
```

### LocalStorage Integration

Maintain existing localStorage patterns for token and user info:

```javascript
// In thunks
const token = localStorage.getItem('user');
const userInfo = JSON.parse(localStorage.getItem('userInfo'));

// After successful login
localStorage.setItem('user', action.payload.token);
localStorage.setItem('userInfo', JSON.stringify(action.payload.user));
```

## Migration Checklist

### Phase 1: Setup
- [ ] Install Redux Toolkit and React-Redux
- [ ] Install fast-check for property-based testing
- [ ] Create store configuration
- [ ] Create typed hooks

### Phase 2: Create Slices
- [ ] Create auth slice from existing reducer
- [ ] Create documents slice from DocStore
- [ ] Create roles slice from RoleStore
- [ ] Write unit tests for each slice
- [ ] Write property-based tests for state equivalence

### Phase 3: Migrate Components
- [ ] Update Provider in index.js
- [ ] Migrate auth-related components (Login, SignUp, Profile, Auth)
- [ ] Migrate document components (Dashboard, DocumentPage, CreateDocument)
- [ ] Migrate role components (RolesAdmin, CreateRole)
- [ ] Migrate admin components (Admin, UsersAdmin)
- [ ] Update all component tests

### Phase 4: Cleanup
- [ ] Remove Flux store listeners from all components
- [ ] Delete AppDispatcher
- [ ] Delete BaseStore
- [ ] Delete DocStore
- [ ] Delete RoleStore
- [ ] Remove flux package dependency
- [ ] Remove eventemitter3 package dependency
- [ ] Update documentation

### Phase 5: Verification
- [ ] Run all unit tests
- [ ] Run all property-based tests
- [ ] Manual testing of all features
- [ ] Verify Redux DevTools working
- [ ] Check test coverage maintained
