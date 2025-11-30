# Migrating from componentDidUpdate to useEffect

## Is componentDidUpdate Deprecated?

**No**, `componentDidUpdate` is still fully supported in React 18. However:

- ✅ **Supported**: `componentDidUpdate`, `componentDidMount`, `componentWillUnmount`
- ❌ **Deprecated**: `componentWillMount`, `componentWillReceiveProps`, `componentWillUpdate`

## Why Migrate to Hooks?

### Benefits of useEffect over componentDidUpdate

1. **Clearer Dependencies**: Explicitly declare what triggers the effect
2. **Easier to Reason About**: Each effect handles one concern
3. **Better Performance**: React can optimize hook-based components better
4. **Less Boilerplate**: No need for class syntax, constructors, binding
5. **Prevents Bugs**: Dependency array prevents infinite loops

## The Problem with componentDidUpdate

### Example: Redirect Loop

**Class Component (Problematic)**:
```javascript
componentDidUpdate(prevProps) {
  const { session } = this.props;
  
  // This runs on EVERY update, even unrelated ones
  if (prevProps.session !== session) {
    // Object comparison always true (new object each time)
    if (session.loggedIn) {
      this.props.navigate('/dashboard'); // Triggers re-render → infinite loop
    }
  }
}
```

**Functional Component with useEffect (Better)**:
```javascript
useEffect(() => {
  // Only runs when session.loggedIn actually changes
  if (session.loggedIn) {
    navigate('/dashboard');
  }
}, [session.loggedIn]); // ✅ Explicit dependency
```

## Migration Examples

### Example 1: NavBar Component

**Before (Class Component)**:
```javascript
class NavBar extends React.Component {
  componentDidMount() {
    const token = localStorage.getItem('user');
    this.props.dispatch(getSession(token));
    window.$('.dropdown-button').dropdown();
  }

  componentDidUpdate(prevProps) {
    window.$('.dropdown-button').dropdown();
    
    const { logoutResult, session, pathname } = this.props;
    
    if (logoutResult && prevProps.logoutResult !== logoutResult) {
      localStorage.removeItem('user');
      this.props.navigate('/');
    }
    
    const sessionChanged =
      prevProps.session.loggedIn !== session.loggedIn ||
      prevProps.session.loading !== session.loading;
    
    if (sessionChanged && !session.loading && session.loggedIn === false) {
      const hadToken = !!localStorage.getItem('user');
      if (hadToken) {
        localStorage.removeItem('user');
        if (pathname !== '/' && pathname !== '/auth') {
          this.props.navigate('/auth');
        }
      }
    }
  }

  render() {
    // ...
  }
}
```

**After (Functional Component)**:
```javascript
function NavBar({ session, logoutResult, pathname, dispatch }) {
  const navigate = useNavigate();
  
  // Initialize session check on mount
  useEffect(() => {
    const token = localStorage.getItem('user');
    dispatch(getSession(token));
  }, []); // ✅ Runs once on mount
  
  // Initialize Materialize dropdowns
  useEffect(() => {
    window.$('.dropdown-button').dropdown();
  }); // Runs after every render (like componentDidUpdate)
  
  // Handle logout
  useEffect(() => {
    if (logoutResult) {
      localStorage.removeItem('user');
      localStorage.removeItem('userInfo');
      navigate('/');
    }
  }, [logoutResult, navigate]); // ✅ Only when logoutResult changes
  
  // Handle session invalidation
  useEffect(() => {
    if (!session.loading && session.loggedIn === false) {
      const hadToken = !!localStorage.getItem('user');
      if (hadToken) {
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        if (pathname !== '/' && pathname !== '/auth' && pathname !== '/404') {
          navigate('/auth');
        }
      }
    }
  }, [session.loggedIn, session.loading, pathname, navigate]); // ✅ Explicit dependencies
  
  return (
    // JSX...
  );
}
```

### Example 2: Login Component

**Before (Class Component)**:
```javascript
class Login extends React.Component {
  componentDidUpdate(prevProps) {
    const { loginError, user, token } = this.props;
    
    if (loginError) {
      this.showLoginError();
    }
    
    if (token && prevProps.token !== this.props.token) {
      localStorage.setItem('user', token);
    }
    
    if (user && prevProps.user !== this.props.user) {
      localStorage.setItem('userInfo', JSON.stringify(user));
      window.Materialize.toast('Logged in Successfully!', 2000, 'success-toast');
      this.props.navigate('/dashboard');
    }
  }
  
  showLoginError = () => {
    const { loginError } = this.props;
    return window.Materialize.toast(loginError, 2000, 'error-toast');
  };
  
  // ...
}
```

**After (Functional Component)**:
```javascript
function Login({ loginError, user, token, dispatch }) {
  const navigate = useNavigate();
  
  // Handle login error
  useEffect(() => {
    if (loginError) {
      window.Materialize.toast(loginError, 2000, 'error-toast');
    }
  }, [loginError]); // ✅ Only when error changes
  
  // Save token
  useEffect(() => {
    if (token) {
      localStorage.setItem('user', token);
    }
  }, [token]); // ✅ Only when token changes
  
  // Handle successful login
  useEffect(() => {
    if (user && Object.keys(user).length > 0) {
      localStorage.setItem('userInfo', JSON.stringify(user));
      window.Materialize.toast('Logged in Successfully!', 2000, 'success-toast');
      navigate('/dashboard');
    }
  }, [user, navigate]); // ✅ Only when user changes
  
  const setupPorts = useCallback((ports) => {
    ports.handleSubmit.subscribe((model) => {
      dispatch(initiateLogin({
        username: model.email,
        password: model.password,
      }));
    });
  }, [dispatch]);
  
  return <Elm src={ElmLogin} ports={setupPorts} />;
}
```

## Key Differences

### Dependency Arrays

| Pattern | When It Runs |
|---------|-------------|
| `useEffect(() => {})` | After every render |
| `useEffect(() => {}, [])` | Once on mount |
| `useEffect(() => {}, [dep])` | When `dep` changes |
| `useEffect(() => {}, [a, b])` | When `a` or `b` changes |

### Cleanup

**Class Component**:
```javascript
componentDidMount() {
  DocStore.addChangeListener(this.handleDocsResult);
}

componentWillUnmount() {
  DocStore.removeChangeListener(this.handleDocsResult);
}
```

**Functional Component**:
```javascript
useEffect(() => {
  DocStore.addChangeListener(handleDocsResult);
  
  // Cleanup function
  return () => {
    DocStore.removeChangeListener(handleDocsResult);
  };
}, []);
```

## Common Pitfalls

### 1. Missing Dependencies

```javascript
// ❌ Bad: Missing dependency
useEffect(() => {
  if (user) {
    navigate('/dashboard');
  }
}, []); // navigate is missing!

// ✅ Good: All dependencies listed
useEffect(() => {
  if (user) {
    navigate('/dashboard');
  }
}, [user, navigate]);
```

### 2. Object Comparisons

```javascript
// ❌ Bad: Comparing objects
useEffect(() => {
  // Runs every time because session is a new object
}, [session]);

// ✅ Good: Compare specific properties
useEffect(() => {
  // Only runs when loggedIn changes
}, [session.loggedIn, session.loading]);
```

### 3. Infinite Loops

```javascript
// ❌ Bad: Updates state that's in dependency array
useEffect(() => {
  setCount(count + 1); // Triggers re-render → runs again → infinite loop
}, [count]);

// ✅ Good: Use functional update
useEffect(() => {
  setCount(c => c + 1); // Doesn't need count in dependencies
}, []);
```

## Migration Checklist

### For Each Class Component:

- [ ] Convert class to function
- [ ] Replace `this.state` with `useState`
- [ ] Replace `this.props` with function parameters
- [ ] Convert `componentDidMount` to `useEffect(() => {}, [])`
- [ ] Convert `componentDidUpdate` to `useEffect` with dependencies
- [ ] Convert `componentWillUnmount` to cleanup function in `useEffect`
- [ ] Replace `this.method` with regular functions or `useCallback`
- [ ] Remove constructor and binding
- [ ] Test thoroughly!

## Should You Migrate Everything?

**No need to rush!** Here's a pragmatic approach:

### Migrate When:
- ✅ Creating new components (always use hooks)
- ✅ Fixing bugs in existing components
- ✅ Adding features to existing components
- ✅ Component has complex lifecycle logic
- ✅ Component has redirect/navigation issues

### Keep Class Components When:
- ⏸️ Component works perfectly and is rarely touched
- ⏸️ Component is simple and has no issues
- ⏸️ Migration would take significant time
- ⏸️ Team is not familiar with hooks yet

## Example: Full Migration

See `frontend/src/components/PrivateRoute.jsx` for a good example of a functional component with hooks that handles authentication correctly.

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [useEffect Complete Guide](https://overreacted.io/a-complete-guide-to-useeffect/)
- [Hooks FAQ](https://react.dev/reference/react/hooks)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
