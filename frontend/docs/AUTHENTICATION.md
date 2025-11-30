# Authentication System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference](#quick-reference)
3. [Architecture](#architecture)
4. [Authentication Flow](#authentication-flow)
5. [Component Responsibilities](#component-responsibilities)
6. [The Golden Rules](#the-golden-rules)
7. [Bug Fixes Applied](#bug-fixes-applied)
8. [Implementation Details](#implementation-details)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Security Considerations](#security-considerations)
12. [API Endpoints](#api-endpoints)
13. [Migration Notes](#migration-notes)

---

## Overview

This application uses JWT-based authentication with protected routes. The authentication system has been modernized to eliminate redirect loops and race conditions through a **centralized session validation architecture**.

### Key Principles

- **Single Source of Validation**: Only PrivateRoute validates sessions
- **Single Source of Truth**: `session.loggedIn` is authoritative
- **Session Validation Guard**: Always check `session.loggedIn` before redirecting
- **Clear Separation of Concerns**: Each component has one responsibility

### The Problem We Solved

**Symptoms**:
- Infinite redirect loops between `/auth` and `/dashboard`
- Flickering pages
- Unpredictable behavior on page refresh
- Multiple "Logged in Successfully!" toasts

**Root Causes**:
- Race conditions between NavBar and PrivateRoute both validating sessions
- Multiple components making competing redirect decisions
- Components redirecting based on stale Redux data

**Solution**: Centralized all session validation in PrivateRoute, eliminated competing logic.

---

## Quick Reference

### Component Responsibilities at a Glance

| Component | Validates Sessions | Makes Redirects | Handles Logout | Renders UI |
|-----------|-------------------|-----------------|----------------|------------|
| **PrivateRoute** | ✅ YES (ONLY) | ✅ YES (ALL) | ❌ NO | ❌ NO |
| **NavBar** | ❌ NO | ❌ NO | ✅ YES | ✅ YES |
| **Login/SignUp** | ❌ NO | ✅ YES (with guard) | ❌ NO | ✅ YES |

### The Three Golden Rules


#### Rule 1: Single Source of Validation
**Only PrivateRoute validates sessions.**

```javascript
// ✅ GOOD - In PrivateRoute
useEffect(() => {
  if (token && !session.loading && !session.loggedIn) {
    dispatch(getSession(token));
  }
}, [token, session.loading, session.loggedIn, dispatch]);

// ❌ BAD - In NavBar or other components
componentDidMount() {
  dispatch(getSession(token)); // Don't do this!
}
```

#### Rule 2: Session Validation Guard
**Always check `session.loggedIn` before redirecting.**

```javascript
// ✅ GOOD
if (user && session.loggedIn) {
  navigate('/dashboard');
}

// ❌ BAD - Can cause infinite loops
if (user) {
  navigate('/dashboard'); // Missing session.loggedIn check!
}
```

#### Rule 3: Trust the Backend
**`session.loggedIn` is the single source of truth.**

```javascript
// ✅ GOOD - Use session.loggedIn
if (session.loggedIn) {
  return <ProtectedContent />;
}

// ❌ BAD - Don't trust localStorage or user object alone
if (localStorage.getItem('user')) {
  return <ProtectedContent />; // Token might be expired!
}
```

### Common Patterns

**Pattern 1: Protecting a Route**
```javascript
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
```

**Pattern 2: Redirecting After Login**
```rescript
switch (token, session["loggedIn"]) {
| ("", _) => () // No token yet
| (_, false) => () // Token but not validated
| (token, true) => navigate("/dashboard") // Safe to redirect
}
```

**Pattern 3: Showing User Info**
```javascript
const session = useAppSelector(selectSession);
{session.loggedIn && <div>Welcome, {user.name.first}!</div>}
```

---

## Architecture

### System Components


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

3. **NavBar Component** (`src/components/NavBar/NavBar.res`)
   - **PRIMARY RESPONSIBILITY**: UI rendering and logout handling
   - Displays navigation based on Redux state
   - Handles logout flow (clears localStorage and Redux)
   - Initializes Materialize UI components
   - **Does NOT validate sessions** (handled by PrivateRoute)
   - **Migrated to ReScript** for type safety and compile-time guarantees

4. **Login/SignUp Components**
   - Handle authentication form submission
   - Navigate to dashboard on success
   - Only redirect when `session.loggedIn` is true (Session Validation Guard pattern)

### Architectural Diagram

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

### Benefits of This Architecture

✅ **No Race Conditions**: Only one component validates sessions
✅ **Predictable Behavior**: Clear, linear flow
✅ **No Infinite Loops**: Single source of redirect decisions
✅ **Easy to Debug**: One place to look for session logic
✅ **Maintainable**: Clear separation of concerns

### Redux State Structure

```javascript
{
  auth: {
    token: string,           // JWT token
    user: object,            // User data
    session: {
      loggedIn: boolean,     // ← SINGLE SOURCE OF TRUTH
      loading: boolean       // Validation in progress
    },
    loginError: string,
    logoutResult: string,
    // ... other fields
  }
}
```

---

## Authentication Flow

### 1. Successful Login

```
1. User submits credentials
2. Backend validates and returns JWT token
3. Login component:
   - Saves token to localStorage
   - Saves user data to Redux
   - Shows success toast
   - Navigates to /dashboard
4. PrivateRoute validates session with backend
5. User stays on /dashboard
```

### 2. Protected Route Access

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

### 3. Session Invalidation

```
1. User has expired/invalid token in localStorage
2. User navigates to protected route
3. PrivateRoute triggers getSession(token)
4. Backend returns {loggedIn: false}
5. Redux updates: session.loggedIn = false, clears token and user
6. PrivateRoute detects session.loggedIn = false
7. PrivateRoute redirects to /auth
```

### 4. Logout Flow

```
1. User clicks logout
2. NavBar dispatches logout(token) action
3. Backend invalidates session
4. Redux clears token, user, and session state
5. NavBar clears localStorage
6. NavBar redirects to home page
```

---

## Component Responsibilities


### PrivateRoute (Route Protection & Session Validation)

**What it does:**
- ✅ Validates sessions with backend via `getSession(token)`
- ✅ Makes ALL redirect decisions
- ✅ Shows loading states during validation
- ✅ Protects routes from unauthorized access

**What it doesn't do:**
- ❌ Render UI elements (navigation, menus, etc.)
- ❌ Handle logout

**Key Point**: This is the ONLY component that validates sessions.

**Implementation Pattern**:
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

**What it does:**
- ✅ Renders navigation UI based on Redux state
- ✅ Handles logout flow (clears localStorage and Redux)
- ✅ Initializes Materialize UI components

**What it doesn't do:**
- ❌ Validate sessions
- ❌ Make redirect decisions (except after explicit logout)

**Key Point**: Does NOT validate sessions, does NOT make redirect decisions.

**Implementation Pattern (ReScript)**:
```rescript
// Initialize Materialize components on mount and when login state changes
React.useEffect1(() => {
  initDropdown()
  initSideNav()
  None
}, [loggedIn])

// Handle logout result - redirect when logout completes
React.useEffect1(() => {
  if logoutResult != "" {
    removeItem("user")
    removeItem("userInfo")
    navigate("/")
  }
  None
}, [logoutResult])

// Handle logout click
let handleLogout = React.useCallback0((evt: ReactEvent.Mouse.t) => {
  ReactEvent.Mouse.preventDefault(evt)
  
  switch getItemOption("user") {
  | Some(token) => reduxDispatch(logout(token))
  | None => ()
  }
})
```

**Note**: NavBar has been migrated to ReScript (`NavBar.res`) for type safety and compile-time guarantees.

### Login/SignUp (Authentication Forms)

**What it does:**
- ✅ Handles form submission
- ✅ Redirects after successful login (with Session Validation Guard)
- ✅ Shows success/error feedback

**What it doesn't do:**
- ❌ Validate existing sessions
- ❌ Redirect without checking `session.loggedIn`

**Key Point**: Uses Session Validation Guard pattern to prevent redirects with stale data.

**Implementation Pattern (ReScript)**:
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

---

## The Golden Rules

### Rule 1: Single Source of Validation

**Only PrivateRoute validates sessions. Period.**

This eliminates race conditions and competing navigation logic.

```javascript
// ✅ CORRECT - Only in PrivateRoute
useEffect(() => {
  if (token && !session.loading && !session.loggedIn) {
    dispatch(getSession(token));
  }
}, [token, session.loading, session.loggedIn, dispatch]);

// ❌ WRONG - Don't do this in NavBar, Profile, or any other component
componentDidMount() {
  dispatch(getSession(token)); // This causes race conditions!
}
```

### Rule 2: Session Validation Guard

**Always check `session.loggedIn` before redirecting based on user data.**

Redux state updates are async and can contain stale data during transitions.

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

**Why This Matters**:

When a session becomes invalid:
1. localStorage is cleared (instant)
2. Logout action is dispatched (async)
3. Redux state updates (delayed)

During step 2-3, Redux still has old user data but `session.loggedIn` is false. Without the guard, components redirect based on stale data, causing infinite loops.

### Rule 3: Trust the Backend

**`session.loggedIn` is the single source of truth for authentication state.**

Never trust localStorage or user object alone.

```javascript
// ✅ GOOD - Use session.loggedIn
if (session.loggedIn) {
  return <ProtectedContent />;
}

// ❌ BAD - Don't trust localStorage alone
if (localStorage.getItem('user')) {
  return <ProtectedContent />; // Token might be expired!
}

// ❌ BAD - Don't trust user object alone
if (user._id) {
  return <ProtectedContent />; // User data might be stale!
}
```

---

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

---

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


### NavBar.res - ReScript Implementation

```rescript
// NavBar.res - Navigation bar with authentication state

open Redux
open ReactRouter
open LocalStorage
open Materialize

// External binding for logout action from authSlice
@module("../../features/auth/authSlice")
external logout: string => {..} = "logout"

@react.component
let make = (~pathname: string) => {
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()
  
  // Select auth state from Redux store
  let user = useSelector((store: {..}) => store["auth"]["user"])
  let session = useSelector((store: {..}) => store["auth"]["session"])
  let logoutResult = useSelector((store: {..}) => store["auth"]["logoutResult"])
  
  // Extract user data with memoization using Nullable.toOption
  let (loggedIn, userFirstName, isAdmin) = React.useMemo2(() => {
    let userId = user["_id"]
    let hasId = switch Nullable.toOption(userId) {
    | Some(id) => id != ""
    | None => false
    }
    
    let sessionLoggedIn = session["loggedIn"]
    let loggedIn = hasId && sessionLoggedIn
    
    // Extract first name and role with proper null handling
    // ... (pattern matching on Nullable values)
    
    (loggedIn, firstName, isAdmin)
  }, (user, session))
  
  // Initialize Materialize components
  React.useEffect1(() => {
    initDropdown()
    initSideNav()
    None
  }, [loggedIn])
  
  // Handle logout result - redirect when logout completes
  React.useEffect1(() => {
    if logoutResult != "" {
      removeItem("user")
      removeItem("userInfo")
      navigate("/")
    }
    None
  }, [logoutResult])
  
  // Handle logout click
  let handleLogout = React.useCallback0((evt: ReactEvent.Mouse.t) => {
    ReactEvent.Mouse.preventDefault(evt)
    
    switch getItemOption("user") {
    | Some(token) => reduxDispatch(logout(token))
    | None => ()
    }
  })
  
  // Render navbar (conditional on pathname)
  // ...
}
```

**Key Features**:
- ✅ Type-safe Redux integration with proper null handling
- ✅ Only handles logout flow
- ✅ No session validation logic
- ✅ No redirect decisions (except after explicit logout)
- ✅ Compile-time guarantees prevent runtime errors
- ✅ Uses Materialize bindings for UI initialization

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

---

## Testing

### Manual Test Cases

**Test 1: Login Flow**
```
1. Clear localStorage
2. Navigate to /auth
3. Enter valid credentials
4. Click Login

Expected:
✅ See "Logged in Successfully!" toast (once)
✅ Redirect to /dashboard (once)
✅ No flickering or loops
```

**Test 2: Protected Route Without Token**
```
1. Clear localStorage
2. Navigate to /dashboard

Expected:
✅ Immediate redirect to /auth
✅ No loading state
✅ No loops
```

**Test 3: Invalid Token**
```
1. Log in successfully
2. Manually corrupt token in localStorage
3. Refresh page

Expected:
✅ Redirect to /auth (once)
✅ Token cleared from localStorage
✅ Redux state cleared
✅ No loops
```

**Test 4: Page Refresh While Logged In**
```
1. Log in successfully
2. Navigate to /dashboard
3. Refresh page multiple times

Expected:
✅ Stay on /dashboard
✅ No flickering
✅ No redirect to /auth
✅ Loading indicator appears briefly
```

### Debug Mode

Enable debug logging in development:
```javascript
// PrivateRoute logs session state
if (process.env.NODE_ENV === 'development') {
  console.log('[PrivateRoute] Session state:', session, 'Token:', !!token);
}
```

---

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

### Debugging Checklist

**Infinite Redirect Loop?**
- [ ] Check if multiple components are calling `getSession()`
- [ ] Verify Login/SignUp check `session.loggedIn` before redirecting
- [ ] Ensure backend returns boolean, not string
- [ ] Check for competing navigation logic

**Stuck on Loading Screen?**
- [ ] Verify backend is running
- [ ] Check browser console for errors
- [ ] Verify MongoDB connection
- [ ] Check if `getSession` API call is completing

**Logged Out After Refresh?**
- [ ] Check if token exists in localStorage
- [ ] Verify token hasn't expired
- [ ] Check backend logs for validation errors
- [ ] Verify `getSession` endpoint is working

### Quick Fixes

**Fix 1: Component Redirecting Without Validation**
```javascript
// Before
if (user) {
  navigate('/dashboard');
}

// After
if (user && session.loggedIn) {
  navigate('/dashboard');
}
```

**Fix 2: Multiple Components Validating Sessions**
```javascript
// Remove from NavBar, Profile, etc.
componentDidMount() {
  // dispatch(getSession(token)); // ❌ Remove this
}

// Keep only in PrivateRoute
useEffect(() => {
  if (token && !session.loading && !session.loggedIn) {
    dispatch(getSession(token)); // ✅ Only here
  }
}, [token, session.loading, session.loggedIn, dispatch]);
```

**Fix 3: Backend Returning String Instead of Boolean**
```javascript
// Before
res.json({ loggedIn: 'false' }); // ❌ String

// After
res.json({ loggedIn: false }); // ✅ Boolean
```

---

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

### Protected Routes

**Routes Requiring Authentication:**
- `/dashboard` - User's document dashboard
- `/profile` - User profile page
- `/documents/*` - Document management
- `/admin/*` - Admin panel (admin role required)

**Public Routes:**
- `/` - Landing page
- `/auth` - Login/signup page
- `/404` - Not found page

---

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

---

## Migration Notes


### If You Need to Add New Authentication Logic

**DO:**
- ✅ Add session validation logic to PrivateRoute
- ✅ Use `session.loggedIn` for redirect decisions
- ✅ Show loading states during validation
- ✅ Check `session.loggedIn` before redirecting in forms

**DON'T:**
- ❌ Add session validation to NavBar
- ❌ Make redirect decisions in NavBar
- ❌ Trust user object alone without checking `session.loggedIn`
- ❌ Create competing validation logic in multiple components

### Component Responsibilities (Before vs After)

**Before (Broken)**:
```
NavBar:
  ✗ Validates sessions on mount
  ✗ Makes redirect decisions
  ✗ Competes with PrivateRoute
  ✓ Handles logout
  ✓ Renders UI

PrivateRoute:
  ✗ Validates sessions on mount
  ✗ Makes redirect decisions
  ✗ Competes with NavBar
  ✓ Protects routes
```

**After (Fixed)**:
```
PrivateRoute:
  ✓ Validates sessions (ONLY component that does this)
  ✓ Makes ALL redirect decisions
  ✓ Shows loading states
  ✓ Protects routes

NavBar:
  ✓ Renders UI based on Redux state
  ✓ Handles logout flow
  ✓ Initializes Materialize components
  ✗ NO session validation
  ✗ NO redirect decisions
```

### Flow Diagrams

**Before (Race Condition)**:
```
Page Load
    │
    ├─→ NavBar mounts
    │   └─→ Calls getSession()
    │       └─→ Updates Redux
    │
    └─→ PrivateRoute mounts
        └─→ Calls getSession()
            └─→ Updates Redux
            
⚠️ Race condition: Which component's logic runs first?
⚠️ Competing redirects
⚠️ Unpredictable behavior
```

**After (Single Responsibility)**:
```
Page Load
    │
    ├─→ NavBar mounts
    │   └─→ Initializes UI only
    │
    └─→ PrivateRoute mounts
        └─→ Calls getSession()
            └─→ Updates Redux
            └─→ Makes redirect decision
            
✅ Single source of validation
✅ Predictable behavior
✅ No race conditions
```

### Files Modified

1. `frontend/src/components/PrivateRoute.jsx` - Added session validation
2. `frontend/src/components/NavBar/NavBar.res` - **Migrated to ReScript**, removed session validation
3. `frontend/src/components/NavBar/NavBar.res.js` - Compiled output (auto-generated)
4. `frontend/src/components/Login/Login.res` - Added Session Validation Guard
5. `frontend/src/components/SignUp/SignUp.res` - Migrated to ReScript with Session Validation Guard
6. `frontend/src/features/auth/authSlice.js` - Ensured proper initial state
7. `frontend/src/bindings/Materialize.res` - Added Materialize UI bindings (dropdown, sideNav, tooltips)
8. `frontend/docs/AUTHENTICATION.md` - Updated documentation

---

## Related Files

### Frontend
- `src/components/PrivateRoute.jsx` - **Route protection and session validation** (PRIMARY)
- `src/components/NavBar/NavBar.res` - UI rendering and logout handling (ReScript)
- `src/components/NavBar/NavBar.res.js` - Compiled NavBar output (auto-generated)
- `src/components/Login/Login.res` - Login form (ReScript)
- `src/components/SignUp/SignUp.res` - Signup form (ReScript)
- `src/features/auth/authSlice.js` - Redux Toolkit auth slice (session state management)
- `src/store/hooks.js` - Redux hooks (useAppDispatch, useAppSelector)
- `src/bindings/Redux.res` - Redux bindings for ReScript
- `src/bindings/Materialize.res` - Materialize UI bindings for ReScript
- `src/bindings/LocalStorage.res` - LocalStorage bindings for ReScript

### Backend
- `server/controllers/users.js` - Auth endpoints (login, logout, session)
- `server/models/users.js` - User model
- `index.js` - JWT configuration

---

## Future Improvements

1. **Token Refresh**: Auto-refresh before expiration
2. **httpOnly Cookies**: More secure than localStorage
3. **Role-Based Routes**: Protect routes by user role
4. **Remember Me**: Optional persistent sessions
5. **2FA Support**: Two-factor authentication
6. **Session Timeout**: Auto-logout after inactivity

---

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

---

## Key Takeaways

1. **Single Responsibility**: One component, one job
2. **Single Source of Truth**: Only PrivateRoute validates sessions
3. **Session Validation Guard**: Always check `session.loggedIn` before redirecting
4. **Clear Separation**: NavBar = UI, PrivateRoute = validation, Login = forms
5. **No Competing Logic**: Eliminates race conditions

**The golden rule**: Only PrivateRoute validates sessions. Everyone else just reads the result.

**When in doubt**: Check PrivateRoute. That's where session validation happens.
