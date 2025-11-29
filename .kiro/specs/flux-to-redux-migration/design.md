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

The migration will be performed incrementally to minimize risk and ensure zero breaking changes:

1. **Phase 1**: Install Redux dependencies alongside Flux (coexistence period begins)
2. **Phase 2**: Create Redux slices parallel to existing stores with exact state compatibility
3. **Phase 3**: Migrate components one by one to use Redux hooks while Flux remains functional
4. **Phase 4**: Update tests to work with Redux Provider and mock store
5. **Phase 5**: Remove Flux code and dependencies once all components migrated

**Key Design Decision:** Both Flux and Redux will coexist during migration. This allows:
- Incremental component migration without breaking the application
- Easy rollback if issues are discovered
- Testing both implementations side-by-side for equivalence
- No "big bang" deployment risk

**Rationale:** The existing application has no type safety (Flow/PropTypes are inconsistent), making a gradual migration safer than attempting to migrate everything at once.

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

The auth slice must preserve the exact state structure from the existing reducer to ensure zero breaking changes for components:

```javascript
{
  users: User[] | null,
  usersError: Error | null,
  session: {
    loggedIn: boolean,
    loading: boolean,  // Starts false, true during session check
  },
  sessionError: string,
  loginError: string,
  logoutResult: string,
  logoutError: string,
  signupError: Error | null,
  profileUpdateResult: any | null,
  profileUpdateError: string,
  token: string,
  user: User | {},
  loggedIn: {},  // Legacy field, may be unused
}
```

**State Compatibility Requirements (Requirement 9):**
- Session loading pattern: GET_SESSION_START sets loading=true, success/error sets loading=false
- Error clearing: Success operations clear corresponding error fields (e.g., LOGIN_SUCCESS clears loginError)
- Profile updates: Must update both `user` object and the matching user in `users` array
- Logout: Clears token and user, sets logoutResult message
- Login/Signup: Sets both token and user fields, clears loginError on success

### Documents Slice State

The documents slice mirrors the DocStore structure with added loading/error states for better UX:

```javascript
{
  doc: Document | null,           // Single document for detail view
  docs: Document[] | null,        // List of documents
  docCreateResult: any | null,    // Result from create operation
  docDeleteResult: { data: any, statusCode: number } | null,
  docEditResult: { data: any, statusCode: number } | null,
  loading: boolean,               // Loading state for async operations
  error: Error | null,            // Error state for failed operations
}
```

**Note:** The DocStore uses different event names for emitChange ('fetchDocs', 'getDoc', 'editDoc') which components listen to. Redux will use a single state tree with selectors instead.

### Roles Slice State

The roles slice mirrors the RoleStore structure with added loading/error states:

```javascript
{
  createdRole: Role | null,       // Most recently created role
  roles: Role[] | null,           // List of all roles
  loading: boolean,               // Loading state for async operations
  error: Error | null,            // Error state for failed operations
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

**Testing Requirements Coverage:**
- **Requirement 6.1**: Components wrapped with Redux Provider in tests
- **Requirement 6.2**: Redux mock store for testing async thunks
- **Requirement 6.3**: Slice reducer tests with various action types
- **Requirement 6.4**: Selector function tests for correct state access
- **Requirement 6.5**: Maintain or improve existing test coverage (~80%)

**Design Decision:** Use fast-check for property-based testing
- **Rationale:** JavaScript ecosystem standard for PBT, good TypeScript support
- **Alternative Considered:** jsverify (less maintained, older API)
- **Benefit:** Generates hundreds of test cases automatically, catches edge cases unit tests miss

### Test Coverage Goals

- Maintain existing test coverage (currently ~80%)
- Add property-based tests for critical state transitions
- Ensure all async thunks have success and failure tests
- Test all component migrations with Redux Provider

## Auth Slice Compatibility Requirements

**Critical Design Constraint (Requirement 9):** The auth slice must maintain exact compatibility with the existing reducer state structure and behavior to ensure zero breaking changes.

### State Structure Preservation

The auth slice will preserve all fields from the existing reducer:
- `users`, `usersError` - for admin user management
- `session` object with `loggedIn` and `loading` flags
- `sessionError`, `loginError`, `logoutError`, `signupError`, `profileUpdateError` - granular error tracking
- `logoutResult`, `profileUpdateResult` - operation results
- `token`, `user` - current user authentication state
- `loggedIn` - legacy field (may be unused but preserved for safety)

### State Transition Compatibility

The auth slice must replicate these exact state transitions:

**Session Check Pattern:**
```javascript
// GET_SESSION_START
session: { loggedIn: false, loading: true }

// GET_SESSION_SUCCESS (logged in)
session: { loggedIn: true, loading: false }, user: <user_data>

// GET_SESSION_SUCCESS (not logged in)
session: { loggedIn: false, loading: false }, token: '', user: {}

// GET_SESSION_ERROR
session: { loggedIn: false, loading: false }, sessionError: <error>
```

**Login Pattern:**
```javascript
// LOGIN_SUCCESS
loginError: '',  // Clear previous error
token: <token>,
user: <user>
```

**Profile Update Pattern:**
```javascript
// PROFILE_UPDATE_SUCCESS
profileUpdateError: '',  // Clear previous error
users: users.map(u => u._id === updated._id ? updated : u),  // Update in array
user: <updated_user>  // Update current user if it's the same
```

**Logout Pattern:**
```javascript
// LOGOUT_SUCCESS
logoutError: '',
token: '',
user: {},
logoutResult: <message>
```

**Design Rationale:** Components depend on these exact state shapes and transitions. Any deviation could cause runtime errors or incorrect behavior, especially since the codebase lacks TypeScript or comprehensive PropTypes validation.

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

The migration order is carefully chosen to minimize risk and validate the approach early:

1. **Auth slice** (most critical, affects all authenticated routes)
   - **Rationale:** Auth is foundational - if this works, the pattern is validated
   - **Risk:** High impact if broken, but well-tested existing reducer to reference
   - **Benefit:** Validates the Redux setup and async thunk patterns early

2. **Documents slice** (most complex, multiple operations)
   - **Rationale:** Tests the pattern with CRUD operations and multiple event types
   - **Risk:** Medium - most used feature, but auth is already working
   - **Benefit:** Proves the approach scales to complex state management

3. **Roles slice** (simpler, fewer operations)
   - **Rationale:** Straightforward migration to complete the pattern
   - **Risk:** Low - simple operations, pattern already proven
   - **Benefit:** Quick win to finish the migration

### Component Migration Pattern

For each component, follow this systematic approach:

1. **Import Redux hooks instead of Flux stores**
   ```javascript
   // Before
   import DocStore from '../stores/DocStore';
   
   // After
   import { useAppSelector, useAppDispatch } from '../store/hooks';
   import { selectDocuments, selectDocumentsLoading } from '../features/documents/documentsSlice';
   ```

2. **Replace `addChangeListener`/`removeChangeListener` with `useSelector`**
   ```javascript
   // Before (class component)
   componentDidMount() {
     DocStore.addChangeListener(this.onChange, 'fetchDocs');
   }
   componentWillUnmount() {
     DocStore.removeChangeListener(this.onChange, 'fetchDocs');
   }
   onChange = () => {
     this.setState({ docs: DocStore.getDocs() });
   }
   
   // After (functional component with hooks)
   const docs = useAppSelector(selectDocuments);
   const loading = useAppSelector(selectDocumentsLoading);
   ```

3. **Replace action calls with `useDispatch` + thunk dispatch**
   ```javascript
   // Before
   import DocActions from '../actions/DocActions';
   DocActions.getDocs();
   
   // After
   const dispatch = useAppDispatch();
   dispatch(fetchDocuments());
   ```

4. **Update tests to use Redux Provider**
   ```javascript
   // Wrap component with Provider and mock store
   import { Provider } from 'react-redux';
   import { configureStore } from '@reduxjs/toolkit';
   
   const mockStore = configureStore({ reducer: { documents: documentsReducer } });
   render(<Provider store={mockStore}><Component /></Provider>);
   ```

5. **Verify functionality manually and with tests**
   - Run component tests
   - Manually test in browser
   - Check Redux DevTools for state updates
   - Verify no console errors or warnings

**Note:** Some components may need conversion from class to functional components to use hooks effectively, though this is optional and can be done incrementally.

### Backward Compatibility

During migration, some components may still use Flux while others use Redux. This is acceptable as a temporary state. The store configurations are independent and won't conflict.

**Design Decision:** Maintain dual state management temporarily
- **Rationale:** Allows incremental migration without breaking existing functionality
- **Trade-off:** Temporary code duplication and slightly larger bundle size
- **Mitigation:** Clear migration checklist to track progress and ensure complete cleanup
- **Exit Strategy:** Once all components migrated and tests pass, remove Flux in a single cleanup commit

**Compatibility Considerations:**
- Flux stores and Redux store operate independently - no shared state
- Components can be migrated one at a time without affecting others
- Both AppDispatcher and Redux store can coexist in the same application
- Tests can be updated incrementally as components are migrated

### Performance Considerations

- Use memoized selectors with `createSelector` from Reselect (included in RTK)
- Avoid creating new selector functions in render
- Use shallow equality checks for object/array selections
- Consider using `useAppSelector` with equality function for complex selections

### Code Organization (Requirement 8)

**Design Decision:** Use feature-based organization with Redux Toolkit conventions

```
frontend/src/
  store/
    index.js           # Store configuration with configureStore
    hooks.js           # Typed hooks (useAppDispatch, useAppSelector)
  features/            # Feature-based organization (Requirement 8.1)
    auth/
      authSlice.js     # Slice, thunks, selectors, reducer export
      authSlice.test.js
      authSlice.properties.test.js
    documents/
      documentsSlice.js
      documentsSlice.test.js
      documentsSlice.properties.test.js
    roles/
      rolesSlice.js
      rolesSlice.test.js
      rolesSlice.properties.test.js
```

**Rationale:** 
- Feature-based structure scales better than type-based (actions/, reducers/, etc.)
- Colocates related code (slice logic, tests, selectors)
- Follows Redux Toolkit official recommendations
- Clear separation of concerns (Requirement 8.4)

**Slice File Structure (Requirements 8.2, 8.3, 8.5):**
```javascript
// 1. Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 2. Async thunks (Requirement 8.3 - automatic action naming)
export const fetchItems = createAsyncThunk('domain/fetchItems', ...);

// 3. Slice definition
const slice = createSlice({
  name: 'domain',  // Automatic action naming: domain/actionName
  initialState,
  reducers: { /* sync actions */ },
  extraReducers: { /* async thunk handlers */ }
});

// 4. Exports (Requirement 8.5)
export const { syncAction1, syncAction2 } = slice.actions;  // Actions
export const selectItems = (state) => state.domain.items;   // Selectors (Requirement 8.2)
export default slice.reducer;                                // Reducer
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

### Phase 4: Cleanup (Requirement 7)

Complete removal of all Flux infrastructure:

- [ ] Remove Flux store listeners from all components
- [ ] Delete AppDispatcher (`dispatcher/AppDispatcher.js`)
- [ ] Delete BaseStore (`stores/BaseStore.js`)
- [ ] Delete DocStore (`stores/DocStore.js`)
- [ ] Delete RoleStore (`stores/RoleStore.js`)
- [ ] Delete action files (`actions/BaseActions.js`, `actions/DocActions.js`, `actions/RoleActions.js`)
- [ ] Remove flux package from `package.json`
- [ ] Remove eventemitter3 package from `package.json`
- [ ] Remove AppConstants that are no longer used
- [ ] Update documentation to reference Redux instead of Flux

**Verification Steps:**
- Search codebase for any remaining Flux imports
- Verify no EventEmitter usage remains
- Check that AppDispatcher has no remaining references
- Confirm bundle size reduction after removing dependencies

### Phase 5: Verification
- [ ] Run all unit tests
- [ ] Run all property-based tests
- [ ] Manual testing of all features
- [ ] Verify Redux DevTools working
- [ ] Check test coverage maintained
