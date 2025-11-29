# Authentication Quick Reference

## Component Responsibilities

### PrivateRoute
**Role**: Session validation and route protection

```javascript
// What it does:
✓ Validates sessions with backend
✓ Makes ALL redirect decisions
✓ Shows loading states
✓ Protects routes

// What it doesn't do:
✗ Render UI elements
✗ Handle logout
```

### NavBar
**Role**: UI rendering and logout

```javascript
// What it does:
✓ Renders navigation UI
✓ Handles logout flow
✓ Initializes Materialize

// What it doesn't do:
✗ Validate sessions
✗ Make redirect decisions
```

### Login/SignUp
**Role**: Authentication forms

```javascript
// What it does:
✓ Handle form submission
✓ Redirect after successful login
✓ Use Session Validation Guard

// What it doesn't do:
✗ Validate existing sessions
✗ Redirect without checking session.loggedIn
```

## The Golden Rules

### Rule 1: Single Source of Validation
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

### Rule 2: Session Validation Guard
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

### Rule 3: Trust the Backend
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

if (user._id) {
  return <ProtectedContent />; // User data might be stale!
}
```

## Common Patterns

### Pattern 1: Protecting a Route

```javascript
// In your router
<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  }
/>
```

### Pattern 2: Redirecting After Login

```rescript
// In Login component
switch (token, session["loggedIn"]) {
| ("", _) => () // No token yet
| (_, false) => () // Token but not validated
| (token, true) => navigate("/dashboard") // Safe to redirect
}
```

### Pattern 3: Showing User Info

```javascript
// In any component
const user = useAppSelector(selectUser);
const session = useAppSelector(selectSession);

// Only show user info if logged in
{session.loggedIn && (
  <div>Welcome, {user.name.first}!</div>
)}
```

### Pattern 4: Handling Logout

```javascript
// In NavBar
const handleLogout = () => {
  const token = localStorage.getItem('user');
  dispatch(logout(token));
};

// In componentDidUpdate
if (logoutResult && prevProps.logoutResult !== logoutResult) {
  localStorage.removeItem('user');
  localStorage.removeItem('userInfo');
  navigate('/');
}
```

## Redux State Structure

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

## Authentication Flow

```
1. User submits login
   ↓
2. Backend validates credentials
   ↓
3. Redux stores token + user
   ↓
4. Login component checks session.loggedIn
   ↓
5. If true, navigate to /dashboard
   ↓
6. PrivateRoute validates session with backend
   ↓
7. If valid, render protected content
   ↓
8. If invalid, redirect to /auth
```

## Debugging Checklist

### Infinite Redirect Loop?
- [ ] Check if multiple components are calling `getSession()`
- [ ] Verify Login/SignUp check `session.loggedIn` before redirecting
- [ ] Ensure backend returns boolean, not string
- [ ] Check for competing navigation logic

### Stuck on Loading Screen?
- [ ] Verify backend is running
- [ ] Check browser console for errors
- [ ] Verify MongoDB connection
- [ ] Check if `getSession` API call is completing

### Logged Out After Refresh?
- [ ] Check if token exists in localStorage
- [ ] Verify token hasn't expired
- [ ] Check backend logs for validation errors
- [ ] Verify `getSession` endpoint is working

## Quick Fixes

### Fix 1: Component Redirecting Without Validation
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

### Fix 2: Multiple Components Validating Sessions
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

### Fix 3: Backend Returning String Instead of Boolean
```javascript
// Before
res.json({ loggedIn: 'false' }); // ❌ String

// After
res.json({ loggedIn: false }); // ✅ Boolean
```

## API Endpoints

### POST /api/users/login
```javascript
// Request
{ username: "user@example.com", password: "password123" }

// Response
{ user: {...}, token: "jwt-token-here" }
```

### GET /api/users/session
```javascript
// Headers
{ 'x-access-token': 'jwt-token-here' }

// Response (valid)
{ loggedIn: true, user: {...} }

// Response (invalid)
{ loggedIn: false }
```

### POST /api/users/logout
```javascript
// Headers
{ 'x-access-token': 'jwt-token-here' }

// Response
{ message: "Successfully logged out" }
```

## Remember

1. **One validator**: Only PrivateRoute validates sessions
2. **One truth**: `session.loggedIn` is authoritative
3. **Guard redirects**: Always check `session.loggedIn` before navigating
4. **Trust backend**: Don't trust localStorage or stale Redux data alone
5. **Separate concerns**: Each component has one job

---

**When in doubt**: Check PrivateRoute. That's where session validation happens.
