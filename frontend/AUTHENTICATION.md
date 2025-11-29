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
   - Protects authenticated routes
   - Checks localStorage for token
   - Shows loading state during session validation

3. **NavBar Component** (`src/components/NavBar/NavBar.jsx`)
   - Initiates session check on mount
   - Handles session invalidation
   - Clears state when tokens expire

4. **Login/SignUp Components**
   - Handle authentication form submission
   - Navigate to dashboard on success
   - Only redirect when session is valid

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
5. NavBar calls getSession() to validate token
6. If valid → Render protected content
7. If invalid → Clear state and redirect to /auth
```

### Session Invalidation
```
1. User has expired/invalid token
2. NavBar detects session.loggedIn = false
3. NavBar dispatches LOGOUT_SUCCESS action
4. Clears localStorage (token, userInfo)
5. Clears Redux state (token, user)
6. PrivateRoute detects invalid session
7. PrivateRoute redirects to /auth
```

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

### Bug 2: Stale Redux State (FIXED)

**Problem**: When session became invalid, NavBar cleared localStorage but not Redux state. Login/SignUp components saw stale user data and redirected to dashboard, creating an infinite loop.

**Impact**: Infinite redirect loop between `/auth` and `/dashboard`.

**Fix**: NavBar now dispatches LOGOUT_SUCCESS to clear Redux state:
```javascript
// frontend/src/components/NavBar/NavBar.jsx
if (hadToken && session.loggedIn === false) {
  localStorage.removeItem('user');
  localStorage.removeItem('userInfo');
  
  // Clear Redux state
  this.props.dispatch({
    type: 'LOGOUT_SUCCESS',
    payload: { logoutResult: { message: 'Session expired' } }
  });
}
```

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

### PrivateRoute (Route Protection)
- **Fast path**: Check localStorage first for immediate feedback
- **Loading state**: Show indicator during session validation
- **Redirect**: Send to /auth if not authenticated or token invalid
- **Render**: Show protected content if authenticated
- **Responsibility**: All route protection and navigation logic

### NavBar (Session Management)
- **Session check**: Call getSession() on mount to validate token
- **State cleanup**: Clear localStorage and Redux when session invalid
- **Logout handling**: Process explicit user logout
- **UI rendering**: Show user menu and navigation
- **Responsibility**: Session validation and state management (NO redirects)

### Login/SignUp (Authentication Forms)
- **Form handling**: Submit credentials to backend
- **Success navigation**: Redirect to dashboard after successful auth
- **Session validation**: Only redirect if session.loggedIn is true
- **Toast messages**: Show success/error feedback
- **Responsibility**: Handle authentication flow and success navigation

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
2. Stale Redux state not cleared on logout
3. Login/SignUp redirecting without checking `session.loggedIn`
4. Multiple components competing for navigation control

**How to Debug**:
```javascript
// Add to Login/SignUp componentDidUpdate:
console.log('User:', user);
console.log('Session:', session);
console.log('Will redirect?', user && prevProps.user !== user && session.loggedIn);
```

**Solution**: All fixed in current implementation
- Backend returns proper booleans
- NavBar dispatches LOGOUT_SUCCESS to clear Redux
- Login/SignUp check `session.loggedIn` before redirecting
- PrivateRoute handles all route protection

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
- `src/components/PrivateRoute.jsx` - Route protection
- `src/components/NavBar/NavBar.jsx` - Session management
- `src/components/Login/Login.jsx` - Login form
- `src/components/SignUp/SignUp.jsx` - Signup form
- `src/stores/reducer.js` - Session state
- `src/actions/actionCreators.js` - Auth actions

### Backend
- `server/controllers/users.js` - Auth endpoints
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

## Summary

The authentication system is now robust and free of redirect loops. Key improvements:

✅ Backend returns proper boolean values
✅ Redux state cleared on session invalidation  
✅ Components have clear, separated responsibilities
✅ Fast localStorage checks prevent unnecessary loading
✅ Session validation happens in background
✅ No competing redirects between components

The system provides a smooth user experience with proper loading states, clear error messages, and reliable authentication checks.
