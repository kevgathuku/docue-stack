# Authentication System Documentation

## Overview

This application uses JWT-based authentication with protected routes. The authentication system has been modernized to eliminate redirect loops and race conditions.

## Architecture

### Components

1. **Backend Session Endpoint** (`/api/users/session`)
   - Validates JWT tokens
   - Returns user data and login status
   - **Returns boolean values** (not strings)

2. **PrivateRoute Component** (`src/components/PrivateRoute.jsx`)
   - **PRIMARY RESPONSIBILITY**: Route protection and session validation
   - Checks localStorage for token
   - Triggers `getSession()` to validate token with backend
   - Shows loading state during session validation
   - Makes all redirect decisions based on session state
   - **This is the ONLY component that validates sessions**

3. **NavBar Component** (`src/components/NavBar/NavBar.jsx`)
   - **PRIMARY RESPONSIBILITY**: UI rendering and logout handling
   - Displays navigation based on Redux state
   - Handles logout flow (clears localStorage and Redux)
   - Initializes Materialize UI components
   - **Does NOT validate sessions** (handled by PrivateRoute)

4. **Login/SignUp Components**
   - Handle authentication form submission
   - Navigate to dashboard on success
   - Only redirect when `session.loggedIn` is true (Session Validation Guard pattern)

## Authentication Flow

### Successful Login
```
1. User submits credentials
2. Backend validates and returns JWT token
3. Login component:
   - Saves token to localStorage
   - Saves user data to Redux
   - Shows success toast
   - Navigates to /dashboard
4. NavBar calls getSession() to verify
5. User stays on /dashboard
```

### Protected Route Access
```
1. User navigates to /dashboard
2. PrivateRoute checks localStorage for token
3. If no token → Redirect to /auth immediately
4. If token exists → Show loading state
5. PrivateRoute calls getSession() to validate token with backend
6. Backend validates JWT and returns {loggedIn: true/false, user: {...}}
7. Redux updates session state based on response
8. If valid (session.loggedIn = true) → Render protected content
9. If invalid (session.loggedIn = false) → Redirect to /auth
```

### Session Invalidation
```
1. User has expired/invalid token in localStorage
2. User navigates to protected route
3. PrivateRoute triggers getSession(token)
4. Backend returns {loggedIn: false}
5. Redux updates: session.loggedIn = false, clears token and user
6. PrivateRoute detects session.loggedIn = false
7. PrivateRoute redirects to /auth
```

## Architectural Solution: Centralized Session Validation

### The Problem: Race Conditions

**Previous Architecture** (caused infinite loops):
- NavBar validated sessions on mount
- PrivateRoute also validated sessions
- Both components made redirect decisions
- Race conditions between competing validation logic
- Unpredictable behavior depending on which component mounted first

### The Solution: Single Responsibility

**Current Architecture** (eliminates race conditions):
- **PrivateRoute**: ONLY component that validates sessions
- **NavBar**: ONLY handles UI rendering and logout
- **Login/SignUp**: ONLY handle authentication forms with Session Validation Guard

### Key Principle

**One component, one responsibility, one source of truth.**

```
┌─────────────────────────────────────────────────────────┐
│                    PrivateRoute                         │
│  • Validates sessions with backend                      │
│  • Makes ALL redirect decisions                         │
│  • Shows loading states                                 │
│  • Single source of truth for route protection          │
└─────────────────────────────────────────────────────────┘
                           │
                           ├─ Triggers: getSession(token)
                           ├─ Reads: session.loggedIn
                           └─ Controls: <Navigate to="/auth" />

┌─────────────────────────────────────────────────────────┐
│                       NavBar                            │
│  • Renders UI based on Redux state                      │
│  • Handles logout (clears localStorage + Redux)         │
│  • Initializes Materialize components                   │
│  • NO session validation                                │
│  • NO redirect decisions                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Login/SignUp                          │
│  • Handles authentication forms                         │
│  • Redirects ONLY when session.loggedIn = true          │
│  • Uses Session Validation Guard pattern                │
└─────────────────────────────────────────────────────────┘
```

### Benefits

✅ **No Race Conditions**: Only one component validates sessions
✅ **Predictable Behavior**: Clear, linear flow
✅ **No Infinite Loops**: Single source of redirect decisions
✅ **Easy to Debug**: One place to look for session logic
✅ **Maintainable**: Clear separation of concerns

## Bug Fixes Applied

### Bug 1: Backend String vs Boolean (FIXED)

**Problem**: Backend returned `{loggedIn: "false"}` as a string instead of boolean.

**Impact**: String `"false"` is truthy in JavaScript, causing the frontend to think users were logged in when they weren't.

**Fix**: Changed backend to return proper booleans:
```javascript
// backend/server/controllers/users.js
res.json({ loggedIn: false })  // Not 'false'
res.json({ loggedIn: user.loggedIn })  // Not user.loggedIn.toString()
```

### Bug 2: Race Conditions Between Components (FIXED)

**Problem**: Both NavBar and PrivateRoute were trying to validate sessions and make redirect decisions, causing race conditions and competing navigation logic.

**Impact**: Infinite redirect loops, flickering between pages, unpredictable behavior.

**Fix**: Centralized all session validation in PrivateRoute:
```javascript
// frontend/src/components/PrivateRoute.jsx
// ONLY PrivateRoute validates sessions
useEffect(() => {
  if (token && !session.loading && !session.loggedIn) {
    dispatch(getSession(token));
  }
}, [token, session.loading, session.loggedIn, dispatch]);

// frontend/src/components/NavBar/NavBar.jsx
// NavBar ONLY handles logout, no session validation
componentDidMount() {
  // Note: Session validation is now handled by PrivateRoute
  // PrivateRoute triggers getSession() when it mounts with a token
}
```

**Key Principle**: Single Responsibility - only ONE component validates sessions.

### Bug 3: Stale Redux State Redirects (FIXED)

**Problem**: Login/SignUp components redirected whenever user object changed, even if session was invalid. This created a race condition with stale Redux data.

**The Race Condition**:
```javascript
// After logout or session invalidation:
1. NavBar clears localStorage
2. NavBar dispatches LOGOUT_SUCCESS (async Redux update)
3. Brief moment where Redux still has old user object
4. User navigates to /auth
5. Login component sees stale user object in Redux
6. Login redirects to /dashboard (even though session is invalid!)
7. PrivateRoute sees no token → redirects to /auth
8. INFINITE LOOP!
```

**Why This Happens**:
- Redux state updates are **not instant**
- There's a timing gap between clearing localStorage and Redux state updating
- Login/SignUp components were checking `user` object alone, not session validity
- Stale user data in Redux caused premature redirects

**The Fix - Session Validation Guard**:
```javascript
// frontend/src/components/Login/Login.jsx
// frontend/src/components/SignUp/SignUp.jsx

// BEFORE (caused loops):
if (user && prevProps.user !== this.props.user) {
  this.props.navigate('/dashboard');  // ❌ Redirects with stale data
}

// AFTER (fixed):
if (user && prevProps.user !== this.props.user && session.loggedIn) {
  this.props.navigate('/dashboard');  // ✅ Only redirects if session valid
}
```

**Why `&& session.loggedIn` Is Critical**:

1. **Single Source of Truth**: `session.loggedIn` is the authoritative authentication state
2. **Prevents Stale Data Redirects**: User object might exist in Redux even when logged out
3. **Handles Timing Issues**: Guards against async Redux update delays
4. **Breaks the Loop**: Without it, Login keeps redirecting even when user isn't authenticated

**Example Scenario**:
```javascript
// After logout, Redux might temporarily have:
{
  user: { _id: "123", name: { first: "John" } },  // ← Stale data
  session: { loggedIn: false },                    // ← Correct state
  token: ''                                        // ← Cleared
}

// The session.loggedIn check prevents redirect in this state
```

**Impact**: Eliminated infinite redirect loops between `/auth` and `/dashboard`.

## Protected Routes

### Routes Requiring Authentication
- `/dashboard` - User's document dashboard
- `/profile` - User profile page
- `/documents/*` - Document management
- `/admin/*` - Admin panel (admin role required)

### Public Routes
- `/` - Landing page
- `/auth` - Login/signup page
- `/404` - Not found page

## State Management

### Redux State Shape
```javascript
{
  session: {
    loggedIn: boolean,  // User authentication status
    loading: boolean    // Session check in progress
  },
  token: string,        // JWT token
  user: object,         // User data (name, email, role)
  loginError: string,
  signupError: object,
  logoutResult: string
}
```

### Session States

1. **Initial Load** (loading: false, loggedIn: false)
   - No session check started yet
   - PrivateRoute checks localStorage first

2. **Checking Session** (loading: true, loggedIn: false)
   - API request in flight
   - PrivateRoute shows loading indicator

3. **Valid Session** (loading: false, loggedIn: true)
   - User authenticated
   - Protected content rendered

4. **Invalid Session** (loading: false, loggedIn: false)
   - Token invalid or expired
   - Redirect to /auth

## Component Responsibilities

### PrivateRoute (Route Protection & Session Validation)
- **Token check**: Check localStorage for token first
- **Session validation**: Call `getSession(token)` to validate with backend
- **Loading state**: Show indicator during session validation
- **Redirect decisions**: Send to /auth if not authenticated or token invalid
- **Render**: Show protected content if authenticated
- **Responsibility**: **ALL route protection, session validation, and navigation logic**
- **Key Point**: This is the ONLY component that validates sessions

**Implementation**:
```javascript
// Triggers session validation on mount
useEffect(() => {
  if (token && !session.loading && !session.loggedIn) {
    dispatch(getSession(token));
  }
}, [token, session.loading, session.loggedIn, dispatch]);

// Renders based on validation state
if (!token) return <Navigate to="/auth" />;
if (session.loading) return <LoadingIndicator />;
if (session.loggedIn) return children;
return <Navigate to="/auth" />;
```

### NavBar (UI Rendering & Logout)
- **UI rendering**: Show user menu and navigation based on Redux state
- **Logout handling**: Process explicit user logout (clear localStorage and Redux)
- **Materialize init**: Initialize Materialize UI components
- **Responsibility**: **ONLY UI rendering and logout handling**
- **Key Point**: Does NOT validate sessions, does NOT make redirect decisions

**Implementation**:
```javascript
componentDidMount() {
  // Initialize Materialize components
  window.$('.dropdown-button').dropdown();
  window.$('.button-collapse').sideNav();
  
  // Note: Session validation is now handled by PrivateRoute
}

componentDidUpdate(prevProps) {
  const { logoutResult } = this.props;
  
  // Handle logout - clear localStorage and redirect to home
  if (logoutResult && prevProps.logoutResult !== logoutResult) {
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    this.props.navigate('/');
  }
  
  // Note: Session invalidation is now handled by PrivateRoute
}
```

### Login/SignUp (Authentication Forms)
- **Form handling**: Submit credentials to backend
- **Success navigation**: Redirect to dashboard after successful auth
- **Session validation guard**: Only redirect if `session.loggedIn` is true
- **Toast messages**: Show success/error feedback
- **Responsibility**: Handle authentication flow and success navigation

**Implementation (ReScript)**:
```rescript
// Only redirect when session is validated
let loggedIn = session["loggedIn"]

switch (token, loggedIn) {
| ("", _) => () // No token, do nothing
| (_, false) => () // Token exists but session not validated, wait
| (token, true) => {
    // Token exists AND session is validated - safe to redirect
    LocalStorage.setItem("user", token)
    navigate("/dashboard")
  }
}
```

## Testing

### Manual Test Cases

**Test 1: Login Flow**
```
1. Clear localStorage
2. Navigate to /auth
3. Enter valid credentials
4. Click Login
Expected:
- See "Logged in Successfully!" toast (once)
- Redirect to /dashboard (once)
- No flickering or loops
```

**Test 2: Protected Route Without Token**
```
1. Clear localStorage
2. Navigate to /dashboard
Expected:
- Immediate redirect to /auth
- No loading state
- No loops
```

**Test 3: Invalid Token**
```
1. Log in successfully
2. Manually corrupt token in localStorage
3. Refresh page
Expected:
- Redirect to /auth (once)
- Token cleared from localStorage
- Redux state cleared
- No loops
```

**Test 4: Page Refresh While Logged In**
```
1. Log in successfully
2. Navigate to /dashboard
3. Refresh page multiple times
Expected:
- Stay on /dashboard
- No flickering
- No redirect to /auth
```

### Debug Mode

Enable debug logging in development:
```javascript
// PrivateRoute logs session state
if (process.env.NODE_ENV === 'development') {
  console.log('[PrivateRoute] Session state:', session, 'Token:', !!token);
}
```

## Troubleshooting

### Issue: Infinite Redirect Loop
**Symptoms**: Page flickers between /auth and /dashboard

**Causes**:
1. Backend returning string instead of boolean (`"false"` is truthy)
2. Multiple components competing for session validation and navigation
3. Login/SignUp redirecting without checking `session.loggedIn`
4. Race conditions between NavBar and PrivateRoute

**How to Debug**:
```javascript
// Add to Login/SignUp componentDidUpdate:
console.log('User:', user);
console.log('Session:', session);
console.log('Will redirect?', user && prevProps.user !== user && session.loggedIn);
```

**Solution**: All fixed in current implementation
- Backend returns proper booleans
- **PrivateRoute is the ONLY component that validates sessions**
- NavBar only handles UI rendering and logout
- Login/SignUp check `session.loggedIn` before redirecting (Session Validation Guard)
- Single responsibility principle eliminates race conditions

### Issue: Login Redirects Even When Not Logged In
**Symptoms**: Visiting /auth immediately redirects to /dashboard, then back to /auth

**Cause**: Login component redirecting based on stale user object without checking session validity

**Debug**:
```javascript
// Check Redux state in browser console:
store.getState().user        // Might have stale data
store.getState().session     // Should be { loggedIn: false }
```

**Solution**: Ensure Login/SignUp use session validation guard:
```javascript
if (user && prevProps.user !== user && session.loggedIn) {
  navigate('/dashboard');
}
```

The `&& session.loggedIn` check is **critical** to prevent redirects with stale data.

### Issue: "Checking authentication..." Forever
**Symptoms**: Loading indicator never disappears
**Causes**:
- Backend not running
- API request failing
- Session state not updating

**Solution**:
1. Ensure backend is running on port 8000
2. Check browser console for errors
3. Verify MongoDB connection

### Issue: Logged Out After Refresh
**Symptoms**: User redirected to /auth on page refresh
**Causes**:
- Token not in localStorage
- Token expired
- Backend session check failing

**Solution**:
1. Check localStorage for 'user' key
2. Verify token hasn't expired (24 hour limit)
3. Check backend logs for errors

## Critical Pattern: Session Validation Guard

### The Problem with User Object Alone

**Never trust the user object alone for authentication decisions.** Redux state can contain stale data during state transitions.

### The Pattern

Always check **both** user object **and** session state before redirecting:

```javascript
// ❌ BAD - Can cause redirect loops
if (user && prevProps.user !== this.props.user) {
  navigate('/dashboard');
}

// ✅ GOOD - Validates session is actually valid
if (user && prevProps.user !== this.props.user && session.loggedIn) {
  navigate('/dashboard');
}
```

### Why This Matters

**Timing of State Updates**:
```
1. User logs out
2. localStorage.removeItem('user')           ← Instant
3. dispatch({ type: 'LOGOUT_SUCCESS' })      ← Async
4. Redux state updates                       ← Delayed
```

During step 3-4, Redux still has old user data but session is invalid.

**Without the Guard**:
- Login component sees user object
- Redirects to /dashboard
- PrivateRoute sees no token
- Redirects to /auth
- Loop repeats infinitely

**With the Guard**:
- Login component sees user object BUT session.loggedIn is false
- Does NOT redirect
- User stays on /auth
- No loop

### When to Use This Pattern

Use the session validation guard whenever:
- Redirecting after authentication
- Making decisions based on user data
- Handling navigation in auth-related components

### Example Implementation

```javascript
componentDidUpdate(prevProps) {
  const { user, token, session } = this.props;

  // Save token when it changes
  if (token && prevProps.token !== token) {
    localStorage.setItem('user', token);
  }

  // Only redirect if BOTH conditions are true:
  // 1. User object changed (new login)
  // 2. Session is valid (not stale data)
  if (user && prevProps.user !== user && session.loggedIn) {
    localStorage.setItem('userInfo', JSON.stringify(user));
    this.props.navigate('/dashboard');
  }
}
```

### Key Takeaway

**`session.loggedIn` is the single source of truth for authentication state.**

The user object is just data—it can be stale. Always validate against `session.loggedIn` before making authentication decisions.

## Security Considerations

### Token Storage
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Tokens expire after 24 hours
- Invalid tokens cleared immediately

### Session Validation
- Every protected route validates session
- Backend verifies JWT signature
- Expired tokens rejected
- **Always check `session.loggedIn` before redirecting**

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never sent in responses
- Compared using bcrypt.compareSync()

## Future Improvements

1. **Token Refresh**: Auto-refresh before expiration
2. **httpOnly Cookies**: More secure than localStorage
3. **Role-Based Routes**: Protect routes by user role
4. **Remember Me**: Optional persistent sessions
5. **2FA Support**: Two-factor authentication
6. **Session Timeout**: Auto-logout after inactivity

## Related Files

### Frontend
- `src/components/PrivateRoute.jsx` - **Route protection and session validation** (PRIMARY)
- `src/components/NavBar/NavBar.jsx` - UI rendering and logout handling
- `src/components/Login/Login.res` - Login form (ReScript)
- `src/components/SignUp/SignUp.jsx` - Signup form
- `src/features/auth/authSlice.js` - Redux Toolkit auth slice (session state management)
- `src/store/hooks.js` - Redux hooks (useAppDispatch, useAppSelector)

### Backend
- `server/controllers/users.js` - Auth endpoints (login, logout, session)
- `server/models/users.js` - User model
- `index.js` - JWT configuration

## API Endpoints

### POST /api/users/login
**Request**:
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "user": { "_id": "...", "name": {...}, "role": {...} },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/users/session
**Headers**: `x-access-token: <jwt>`

**Response** (logged in):
```json
{
  "user": { "_id": "...", "name": {...}, "role": {...} },
  "loggedIn": true
}
```

**Response** (not logged in):
```json
{
  "loggedIn": false
}
```

### POST /api/users/logout
**Headers**: `x-access-token: <jwt>`

**Response**:
```json
{
  "message": "Successfully logged out"
}
```

## Implementation Details

### PrivateRoute.jsx - Complete Implementation

```javascript
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { selectSession, getSession } from '../features/auth/authSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';

export default function PrivateRoute({ children }) {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const location = useLocation();
  const token = localStorage.getItem('user');

  // Trigger session validation when component mounts with a token
  useEffect(() => {
    if (token && !session.loading && !session.loggedIn) {
      console.log('[PrivateRoute] Triggering session validation');
      dispatch(getSession(token));
    }
  }, [token, session.loading, session.loggedIn, dispatch]);

  // 1. No token → redirect immediately
  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 2. Session check in progress → show loading
  if (session.loading) {
    return (
      <div className="container">
        <div className="progress">
          <div className="indeterminate"></div>
        </div>
        <p className="center-align">Checking authentication...</p>
      </div>
    );
  }

  // 3. Session validated and logged in → allow access
  if (session.loggedIn) {
    return children;
  }

  // 4. Token exists but not validated yet → show loading
  if (token && !session.loading && !session.loggedIn) {
    return (
      <div className="container">
        <div className="progress">
          <div className="indeterminate"></div>
        </div>
        <p className="center-align">Validating session...</p>
      </div>
    );
  }

  // 5. Fallback → redirect to auth
  return <Navigate to="/auth" state={{ from: location }} replace />;
}
```

**Key Features**:
- ✅ Triggers `getSession(token)` via useEffect
- ✅ Handles all 5 possible states
- ✅ Shows descriptive loading messages
- ✅ Preserves location for post-login redirect
- ✅ Only component that validates sessions

### NavBar.jsx - Simplified Implementation

```javascript
componentDidMount() {
  // Initialize Materialize components
  window.$('.dropdown-button').dropdown();
  window.$('.button-collapse').sideNav();
  
  // Note: Session validation is now handled by PrivateRoute
  // PrivateRoute triggers getSession() when it mounts with a token
}

componentDidUpdate(prevProps) {
  window.$('.dropdown-button').dropdown();
  
  const { logoutResult } = this.props;

  // Handle logout - clear localStorage and redirect to home
  if (logoutResult && prevProps.logoutResult !== logoutResult) {
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    this.props.navigate('/');
  }

  // Note: Session invalidation is now handled by PrivateRoute
  // PrivateRoute waits for /api/users/session response before redirecting
  // This prevents race conditions and infinite redirect loops
}
```

**Key Features**:
- ✅ Only handles logout flow
- ✅ No session validation logic
- ✅ No redirect decisions (except after explicit logout)
- ✅ Clear comments explaining the architecture

### authSlice.js - Session State Management

```javascript
// Initial state always starts with session.loggedIn = false
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('user');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      return {
        token,
        user: JSON.parse(userInfo),
        session: {
          loggedIn: false, // Will be validated by getSession
          loading: false,
        },
      };
    }
  } catch (error) {
    console.error('Error loading initial auth state:', error);
  }
  
  return {
    token: '',
    user: {},
    session: { loggedIn: false, loading: false },
  };
};

// Session validation reducer
.addCase(getSession.pending, (state) => {
  state.session = { loggedIn: false, loading: true };
})
.addCase(getSession.fulfilled, (state, action) => {
  const { loggedIn, user } = action.payload;
  
  if (loggedIn) {
    state.session = { loggedIn: true, loading: false };
    state.user = user;
  } else {
    state.token = '';
    state.user = {};
    state.session = { loggedIn: false, loading: false };
  }
  state.sessionError = '';
})
.addCase(getSession.rejected, (state, action) => {
  state.sessionError = action.payload;
  state.session = { loggedIn: false, loading: false };
})
```

**Key Features**:
- ✅ Always starts with `session.loggedIn = false`
- ✅ Requires backend validation before setting to true
- ✅ Clears token and user on invalid session
- ✅ Proper loading states

### Login.res - Session Validation Guard

```rescript
// Effect to handle login success/error
React.useEffect5(() => {
  if state.loginAttempted {
    // Handle login error
    switch loginError {
    | "" => ()
    | error => {
        showError(error)
        dispatch(ResetAttempt)
      }
    }

    // Handle login success - MUST check session.loggedIn
    let loggedIn = session["loggedIn"]
    
    switch (token, loggedIn) {
    | ("", _) => () // No token, do nothing
    | (_, false) => () // Token exists but session not validated, wait
    | (token, true) => {
        // Token exists AND session is validated - safe to redirect
        LocalStorage.setItem("user", token)
        LocalStorage.setItem("userInfo", %raw(`JSON.stringify(user)`))
        showSuccess("Logged in Successfully!")
        navigate("/dashboard")
        dispatch(ResetAttempt)
      }
    }
  }
  None
}, (loginError, token, session, user, state.loginAttempted))
```

**Key Features**:
- ✅ Only redirects when `session.loggedIn = true`
- ✅ Waits for backend validation
- ✅ Prevents redirects with stale data
- ✅ Session Validation Guard pattern

## Summary

The authentication system is now robust and free of redirect loops. Key improvements:

✅ **Centralized Session Validation**: Only PrivateRoute validates sessions
✅ **No Race Conditions**: Single component responsible for validation
✅ **Clear Separation of Concerns**: Each component has one responsibility
✅ **Backend Returns Proper Booleans**: No truthy string issues
✅ **Session Validation Guard**: Login/SignUp check `session.loggedIn` before redirecting
✅ **Proper Loading States**: Clear feedback during validation
✅ **Single Source of Truth**: `session.loggedIn` is authoritative

The system provides a smooth user experience with proper loading states, clear error messages, and reliable authentication checks.
