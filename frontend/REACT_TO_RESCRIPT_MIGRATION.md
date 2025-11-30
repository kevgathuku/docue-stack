# React to ReScript Migration Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Migration Strategy](#migration-strategy)
4. [Component Conversion Patterns](#component-conversion-patterns)
5. [React Hooks in ReScript](#react-hooks-in-rescript)
6. [Redux Integration](#redux-integration)
7. [Event Handling](#event-handling)
8. [Form Validation](#form-validation)
9. [API Integration](#api-integration)
10. [Common Patterns](#common-patterns)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

## Introduction

This guide documents the patterns and best practices for migrating React components (JavaScript/JSX) to ReScript. It's based on real-world experience migrating the SignUp component and other components in the Docue application.

**Why ReScript?**
- **Type Safety**: Catch errors at compile time, not runtime
- **Performance**: Compiles to highly optimized JavaScript
- **React Integration**: First-class React support with ReScript-React
- **No Runtime Exceptions**: Sound type system prevents null/undefined errors
- **Pattern Matching**: Powerful language features for complex logic

**When to Use This Guide:**
- Migrating existing React components to ReScript
- Building new components in ReScript
- Understanding ReScript-React patterns
- Integrating ReScript with Redux Toolkit


## Prerequisites

Before starting migration, ensure you have:

1. **ReScript Installed**: `@rescript/react` and `rescript` packages
2. **Build Configuration**: `bsconfig.json` configured for your project
3. **Vite Setup**: Vite configured to handle ReScript compiled files
4. **Understanding of ReScript Syntax**: Basic familiarity with ML-family syntax
5. **Bindings Created**: ReScript bindings for JavaScript libraries you use

**Required Dependencies:**
```json
{
  "dependencies": {
    "@rescript/react": "^0.12.1",
    "rescript": "^11.0.1"
  }
}
```

**Build Configuration (bsconfig.json):**
```json
{
  "name": "your-app",
  "sources": [
    {
      "dir": "src/components",
      "subdirs": true
    },
    {
      "dir": "src/bindings",
      "subdirs": false
    }
  ],
  "package-specs": {
    "module": "es6",
    "in-source": true
  },
  "suffix": ".bs.js",
  "bs-dependencies": ["@rescript/react"],
  "reason": {
    "react-jsx": 3
  }
}
```


## Migration Strategy

### Step-by-Step Process

1. **Analyze the Component**
   - Identify state management (local state, Redux, context)
   - List all props and their types
   - Document event handlers and side effects
   - Note external dependencies (libraries, utilities)

2. **Create Bindings** (if needed)
   - Write ReScript bindings for JavaScript libraries
   - Test bindings with simple examples
   - Document binding usage

3. **Convert Component Structure**
   - Create `.res` file
   - Define types for state and actions
   - Implement reducer (if using useReducer)
   - Convert JSX to ReScript JSX

4. **Implement Logic**
   - Convert event handlers
   - Implement side effects (useEffect)
   - Add validation logic
   - Integrate with Redux/Router

5. **Test and Verify**
   - Write unit tests
   - Manual testing in browser
   - Compare with original React version
   - Check for console errors

6. **Update Imports**
   - Change imports from `.jsx` to `.bs.js`
   - Update any wrapper components
   - Test integration with rest of app

### Migration Order

**Recommended Order:**
1. Start with **leaf components** (no child components)
2. Move to **simple forms** (basic state management)
3. Progress to **complex forms** (validation, Redux)
4. Tackle **components with side effects** (API calls, effects)
5. Finally migrate **container components** (multiple children)


## Component Conversion Patterns

### Class Components to Functional Components

ReScript-React only supports functional components. If migrating from class components, convert to functional components with hooks first.

**React Class Component:**
```javascript
class SignUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: ''
    };
  }
  
  handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic
  }
  
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        {/* form fields */}
      </form>
    );
  }
}
```

**ReScript Functional Component:**
```rescript
type state = {
  email: string,
  password: string,
}

type action =
  | UpdateEmail(string)
  | UpdatePassword(string)

let reducer = (state, action) => {
  switch action {
  | UpdateEmail(email) => {...state, email}
  | UpdatePassword(password) => {...state, password}
  }
}

@react.component
let make = () => {
  let (state, dispatch) = React.useReducer(reducer, {
    email: "",
    password: "",
  })
  
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    // Submit logic
  }
  
  <form onSubmit={handleSubmit}>
    {/* form fields */}
  </form>
}
```


### Props and Component Signature

**React with Props:**
```javascript
function Welcome({ name, age, onGreet }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <button onClick={() => onGreet(name)}>Greet</button>
    </div>
  );
}
```

**ReScript with Props:**
```rescript
@react.component
let make = (~name: string, ~age: int, ~onGreet: string => unit) => {
  <div>
    <h1> {React.string("Hello, " ++ name ++ "!")} </h1>
    <button onClick={_ => onGreet(name)}>
      {React.string("Greet")}
    </button>
  </div>
}
```

**Key Differences:**
- Props are function parameters with `~` prefix
- Type annotations are explicit
- `React.string()` wraps string literals
- String concatenation uses `++`

### Optional Props

**React:**
```javascript
function Card({ title, subtitle = "No subtitle" }) {
  return <div>{title} - {subtitle}</div>;
}
```

**ReScript:**
```rescript
@react.component
let make = (~title: string, ~subtitle: option<string>=?) => {
  let subtitleText = switch subtitle {
  | Some(text) => text
  | None => "No subtitle"
  }
  
  <div>
    {React.string(title ++ " - " ++ subtitleText)}
  </div>
}
```


## React Hooks in ReScript

### useState

**React:**
```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState('');
```

**ReScript:**
```rescript
let (count, setCount) = React.useState(() => 0)
let (name, setName) = React.useState(() => "")
```

**Key Differences:**
- Initial value is a function `() => value`
- Type is inferred from initial value

### useReducer

**React:**
```javascript
const [state, dispatch] = useReducer(reducer, initialState);
```

**ReScript:**
```rescript
// Define state type
type state = {
  email: string,
  password: string,
  isSubmitting: bool,
}

// Define action type
type action =
  | UpdateEmail(string)
  | UpdatePassword(string)
  | Submit
  | SubmitComplete

// Define reducer
let reducer = (state, action) => {
  switch action {
  | UpdateEmail(email) => {...state, email}
  | UpdatePassword(password) => {...state, password}
  | Submit => {...state, isSubmitting: true}
  | SubmitComplete => {...state, isSubmitting: false}
  }
}

// Use in component
let (state, dispatch) = React.useReducer(reducer, {
  email: "",
  password: "",
  isSubmitting: false,
})
```

**Benefits:**
- Type-safe actions (no typos in action types)
- Exhaustive pattern matching ensures all cases handled
- Compiler catches missing state updates


### useEffect

**React:**
```javascript
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, [dependency1, dependency2]);
```

**ReScript:**
```rescript
// No dependencies (runs every render)
React.useEffect0(() => {
  // Effect logic
  Some(() => {
    // Cleanup
  })
})

// One dependency
React.useEffect1(() => {
  // Effect logic
  None // No cleanup
}, [dependency1])

// Two dependencies
React.useEffect2(() => {
  // Effect logic
  None
}, (dependency1, dependency2))

// Multiple dependencies (up to useEffect7)
React.useEffect5(() => {
  // Effect logic
  None
}, (dep1, dep2, dep3, dep4, dep5))
```

**Key Differences:**
- Different functions for different dependency counts (useEffect0 through useEffect7)
- Dependencies are a tuple, not an array
- Return `None` for no cleanup, `Some(() => ...)` for cleanup

**Real Example from SignUp Component:**
```rescript
React.useEffect5(() => {
  if state.signupAttempted {
    // Handle signup error
    let errorIsNull = %raw(`signupError === null || signupError === undefined`)
    
    if !errorIsNull {
      showError(errorMessage)
      dispatch(ResetAttempt)
    }
    
    // Handle signup success
    let loggedIn = session["loggedIn"]
    
    switch (token, loggedIn) {
    | ("", _) => ()
    | (_, false) => ()
    | (token, true) => {
        LocalStorage.setItem("user", token)
        showSuccess("Your Account has been created successfully!")
        navigate("/dashboard")
        dispatch(ResetAttempt)
      }
    }
  }
  
  None
}, (signupError, token, user, session, state.signupAttempted))
```


### useMemo and useCallback

**React:**
```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

**ReScript:**
```rescript
// useMemo with dependencies
let memoizedValue = React.useMemo2(() => {
  computeExpensiveValue(a, b)
}, (a, b))

// useMemo with no dependencies
let memoizedValue = React.useMemo0(() => {
  computeExpensiveValue()
})

// useCallback
let memoizedCallback = React.useCallback2((arg) => {
  doSomething(a, b, arg)
}, (a, b))
```

**Real Example from Profile Component:**
```rescript
// Get user from localStorage (computed once)
let initialUser = React.useMemo0(() => {
  switch LocalStorage.getItemOption("userInfo") {
  | Some(userInfoStr) =>
    try {
      let json = JSON.parseOrThrow(userInfoStr)
      switch decodeProfileUser(json) {
      | Ok(user) => Some(user)
      | Error(_) => None
      }
    } catch {
    | _ => None
    }
  | None => None
  }
})
```


## Redux Integration

### Creating Bindings

First, create ReScript bindings for Redux hooks:

**bindings/Redux.res:**
```rescript
// Type for Redux dispatch function
type dispatch<'action> = 'action => unit

// Hook to get dispatch function from Redux
@module("react-redux")
external useDispatch: unit => dispatch<'action> = "useDispatch"

// Hook to select from Redux store
@module("react-redux")
external useSelector: ('store => 'selected) => 'selected = "useSelector"
```

### Using Redux in Components

**React:**
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { login } from './authSlice';

function Login() {
  const dispatch = useDispatch();
  const loginError = useSelector(state => state.auth.loginError);
  const token = useSelector(state => state.auth.token);
  
  const handleSubmit = () => {
    dispatch(login({ username: email, password }));
  };
  
  // ...
}
```

**ReScript:**
```rescript
open Redux

// External binding for login action
@module("../../features/auth/authSlice")
external login: {..} => {..} = "login"

@react.component
let make = () => {
  // Redux hooks
  let reduxDispatch = useDispatch()
  
  // Select from store
  let loginError = useSelector((store: {..}) => {
    store["auth"]["loginError"]
  })
  
  let token = useSelector((store: {..}) => {
    store["auth"]["token"]
  })
  
  // Handle form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    
    // Create payload
    let credentials = {
      "username": email,
      "password": password,
    }
    
    // Dispatch action
    reduxDispatch(login(credentials))
  }
  
  // ...
}
```


### Accessing Nested Redux State

**Using Dictionary Access:**
```rescript
// Access nested state with bracket notation
let loginError = useSelector((store: {..}) => {
  store["auth"]["loginError"]
})

let user = useSelector((store: {..}) => {
  store["auth"]["user"]
})

let session = useSelector((store: {..}) => {
  store["auth"]["session"]
})
```

**Type-Safe Alternative (Advanced):**
```rescript
// Define store type
type authState = {
  loginError: string,
  token: string,
  user: option<user>,
  session: {
    "loggedIn": bool
  }
}

type store = {
  auth: authState
}

// Use typed selector
let loginError = useSelector((store: store) => {
  store.auth.loginError
})
```

### Dispatching Actions

**Simple Actions:**
```rescript
// External binding for action creator
@module("../../features/auth/authSlice")
external login: {..} => {..} = "login"

// Dispatch
reduxDispatch(login({"username": email, "password": password}))
```

**Async Thunks:**
```rescript
// External binding for async thunk
@module("../../features/auth/authSlice")
external signup: {..} => {..} = "signup"

// Dispatch async action
let payload = {
  "firstname": firstname,
  "lastname": lastname,
  "email": email,
  "password": password,
}
reduxDispatch(signup(payload))
```


## Event Handling

### Form Events

**React:**
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  // Submit logic
};

const handleChange = (e) => {
  const value = e.target.value;
  setState(value);
};
```

**ReScript:**
```rescript
let handleSubmit = evt => {
  ReactEvent.Form.preventDefault(evt)
  // Submit logic
}

let handleChange = evt => {
  let value = ReactEvent.Form.target(evt)["value"]
  setState(value)
}
```

### Click Events

**React:**
```javascript
<button onClick={() => doSomething()}>Click</button>
<button onClick={(e) => {
  e.preventDefault();
  doSomething();
}}>Click</button>
```

**ReScript:**
```rescript
<button onClick={_ => doSomething()}>
  {React.string("Click")}
</button>

<button onClick={evt => {
  ReactEvent.Mouse.preventDefault(evt)
  doSomething()
}}>
  {React.string("Click")}
</button>
```

**Key Differences:**
- Use `_` when you don't need the event object
- Event types: `ReactEvent.Form.t`, `ReactEvent.Mouse.t`, `ReactEvent.Keyboard.t`
- Access target properties with bracket notation: `evt["value"]`


### Input Change Handlers

**Complete Example from SignUp Component:**
```rescript
<input
  id="email"
  className="validate"
  name="email"
  type_="email"
  required=true
  onChange={evt => {
    let value = ReactEvent.Form.target(evt)["value"]
    dispatch(UpdateEmail(value))
  }}
/>
```

**Controlled Input with Value:**
```rescript
<input
  id="email"
  type_="text"
  value={state.email}
  onChange={evt => {
    let value = ReactEvent.Form.target(evt)["value"]
    dispatch(UpdateEmail(value))
  }}
/>
```

**Key Points:**
- Use `type_` instead of `type` (reserved keyword)
- Boolean props: `required=true` not `required={true}`
- Access input value: `ReactEvent.Form.target(evt)["value"]`

### Keyboard Events

**React:**
```javascript
const handleKeyPress = (e) => {
  if (e.key === 'Enter') {
    handleSubmit();
  }
};
```

**ReScript:**
```rescript
let handleKeyPress = evt => {
  let key = ReactEvent.Keyboard.key(evt)
  if key == "Enter" {
    handleSubmit()
  }
}
```


## Form Validation

### Validation with Pattern Matching

**React:**
```javascript
const validatePassword = (password, confirm) => {
  if (password !== confirm) {
    return { valid: false, error: "Passwords don't match" };
  }
  if (password.length < 6) {
    return { valid: false, error: "Password too short" };
  }
  return { valid: true };
};
```

**ReScript:**
```rescript
// Define validation result type
type passwordValidation =
  | Valid
  | Mismatch
  | TooShort

// Validation function
let validatePassword = (password, passwordConfirm) => {
  if password != passwordConfirm {
    Mismatch
  } else if String.length(password) >= 1 && String.length(password) < 6 {
    TooShort
  } else {
    Valid
  }
}

// Use in component
let handleSubmit = evt => {
  ReactEvent.Form.preventDefault(evt)
  
  switch validatePassword(state.password, state.passwordConfirm) {
  | Mismatch => showError("passwords don't match")
  | TooShort => showError("passwords should be > 6 characters")
  | Valid => {
      // Submit form
      dispatch(Submit)
      reduxDispatch(signup(payload))
    }
  }
}
```

**Benefits:**
- Type-safe validation states
- Exhaustive pattern matching ensures all cases handled
- No magic strings or boolean flags
- Clear, readable validation logic


### Complex Validation Example

**From Profile Component:**
```rescript
// Password validation state
type passwordState = Empty | Valid | Invalid(string)

// Validate password with detailed error messages
let validatePassword = (password: string, passwordConfirm: string): passwordState => {
  if password == "" && passwordConfirm == "" {
    Empty
  } else if password != passwordConfirm {
    Invalid("Passwords don't match")
  } else if String.length(password) <= 6 {
    Invalid("Passwords should be > 6 characters")
  } else {
    Valid
  }
}

// Use in form submission
let handleSubmit = (evt: ReactEvent.Form.t) => {
  ReactEvent.Form.preventDefault(evt)
  
  switch validatePassword(state.password, state.passwordConfirm) {
  | Empty => {
      // Submit without password change
      dispatch(Submit)
      // API call without password
    }
  | Valid => {
      // Submit with password change
      dispatch(Submit)
      // API call with password
    }
  | Invalid(message) => {
      // Show error, don't submit
      Materialize.showError(message)
    }
  }
}
```

**Key Patterns:**
- Use variant types for validation states
- Include error messages in Invalid variant
- Handle all validation states explicitly
- Separate validation logic from UI logic


## API Integration

### Creating Fetch Bindings

**bindings/Fetch.res:**
```rescript
// Response type
type response

// Check if response is ok
@get external ok: response => bool = "ok"

// Get response status
@get external status: response => int = "status"

// Parse JSON from response
@send external json: response => promise<JSON.t> = "json"

// Fetch with GET
@val
external get: (string, {..}) => promise<response> = "fetch"

// Fetch with POST
let post = async (url: string, body: JSON.t, token: option<string>): promise<response> => {
  let headers = Dict.make()
  Dict.set(headers, "Content-Type", "application/json")
  
  switch token {
  | Some(t) => Dict.set(headers, "x-access-token", t)
  | None => ()
  }
  
  let options = {
    "method": "POST",
    "headers": headers,
    "body": JSON.stringify(body),
  }
  
  await get(url, options)
}
```

### Making API Calls

**React:**
```javascript
const updateProfile = async (userId, token, data) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: 'Update failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```


**ReScript:**
```rescript
// Update user profile via API
let updateUserProfile = async (
  userId: string,
  token: string,
  email: string,
  firstName: string,
  lastName: string,
  password: option<string>,
): result<profileUser, string> => {
  let url = `${baseUrl}/api/users/${userId}`
  
  // Create request body
  let body = Dict.make()
  Dict.set(body, "email", JSON.Encode.string(email))
  Dict.set(body, "firstname", JSON.Encode.string(firstName))
  Dict.set(body, "lastname", JSON.Encode.string(lastName))
  
  // Add password if provided
  switch password {
  | Some(pwd) => Dict.set(body, "password", JSON.Encode.string(pwd))
  | None => ()
  }
  
  let bodyJson = JSON.Encode.object(body)
  
  try {
    let response = await Fetch.put(url, bodyJson, Some(token))
    
    if Fetch.ok(response) {
      let data = await Fetch.json(response)
      decodeUserUpdateResponse(data)
    } else {
      let status = Fetch.status(response)
      Error(`Update failed with status ${Belt.Int.toString(status)}`)
    }
  } catch {
  | JsExn(e) =>
    switch JsExn.message(e) {
    | Some(msg) => Error(msg)
    | None => Error("Unknown error occurred")
    }
  }
}
```

**Key Patterns:**
- Use `result<'success, 'error>` for API responses
- Use `async/await` for promises
- Pattern match on `option` for optional parameters
- Use `try/catch` for error handling
- Return typed errors, not exceptions


### Using API Calls in Components

**From Profile Component:**
```rescript
let handleSubmit = (evt: ReactEvent.Form.t) => {
  ReactEvent.Form.preventDefault(evt)
  
  switch validatePassword(state.password, state.passwordConfirm) {
  | Valid => {
      dispatch(Submit)
      
      switch token {
      | Some(t) => {
          // Create async function
          let updatePromise = async () => {
            let result = await updateUserProfile(
              state.user.id,
              t,
              state.email,
              state.firstName,
              state.lastName,
              Some(state.password),
            )
            
            // Handle result
            switch result {
            | Ok(updatedUser) => {
                saveUserInfo(updatedUser)
                dispatch(SubmitSuccess(updatedUser))
                Materialize.showSuccess("Profile Info Updated!")
              }
            | Error(error) => {
                dispatch(SubmitError(error))
                Materialize.showError(error)
              }
            }
          }
          
          // Execute async function
          let _ = updatePromise()
        }
      | None => {
          Materialize.showError("No authentication token found")
        }
      }
    }
  | Invalid(message) => Materialize.showError(message)
  | Empty => {
      // Submit without password
    }
  }
}
```

**Key Points:**
- Create async function inside event handler
- Use `let _ = asyncFunction()` to execute without awaiting
- Pattern match on `result` to handle success/error
- Update component state based on API response


## Common Patterns

### Conditional Rendering

**React:**
```javascript
{isLoading && <Spinner />}
{error ? <Error message={error} /> : <Content />}
{user ? <Welcome name={user.name} /> : <Login />}
```

**ReScript:**
```rescript
// Simple conditional
{isLoading ? <Spinner /> : React.null}

// Ternary
{error ? <Error message={error} /> : <Content />}

// Pattern matching on option
{switch user {
| Some(u) => <Welcome name={u.name} />
| None => <Login />
}}

// Pattern matching on variant
{switch viewMode {
| ProfileView => renderProfileView()
| EditView => renderEditForm()
}}
```

### Rendering Lists

**React:**
```javascript
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

**ReScript:**
```rescript
{items
  ->Array.map(item => {
    <li key={item.id}>
      {React.string(item.name)}
    </li>
  })
  ->React.array}
```

**Key Points:**
- Use `Array.map` for arrays
- Wrap result with `React.array`
- Use pipe operator `->` for chaining


### String Interpolation

**React:**
```javascript
const greeting = `Hello, ${name}!`;
const message = `You have ${count} items`;
```

**ReScript:**
```rescript
// String concatenation
let greeting = "Hello, " ++ name ++ "!"

// With backticks (template strings)
let message = `You have ${Belt.Int.toString(count)} items`

// In JSX
<h1> {React.string("Hello, " ++ name ++ "!")} </h1>
```

**Key Points:**
- Use `++` for string concatenation
- Use backticks for template strings
- Convert numbers to strings: `Belt.Int.toString(n)`
- Wrap strings in `React.string()` for JSX

### Working with Options

**React:**
```javascript
const name = user?.name || 'Guest';
const email = user?.email ?? 'no-email@example.com';
```

**ReScript:**
```rescript
// Pattern matching
let name = switch user {
| Some(u) => u.name
| None => "Guest"
}

// Using Belt.Option
let email = user
  ->Belt.Option.map(u => u.email)
  ->Belt.Option.getWithDefault("no-email@example.com")

// In JSX
{switch user.role {
| Some(roleTitle) =>
  <p> {React.string("Role: " ++ roleTitle)} </p>
| None => React.null
}}
```


### JavaScript Interop

**Accessing JavaScript Values:**
```rescript
// Use %raw for inline JavaScript
let errorIsNull = %raw(`signupError === null || signupError === undefined`)

// Access object properties
let value = obj["propertyName"]

// Call JavaScript functions
let json = %raw(`JSON.stringify(user)`)
```

**External Bindings:**
```rescript
// Bind to JavaScript function
@val external alert: string => unit = "alert"

// Bind to module export
@module("./utils") external formatDate: string => string = "formatDate"

// Bind to object method
@send external push: (array<'a>, 'a) => unit = "push"
```

**Type Casting (Use Sparingly):**
```rescript
// Cast to any type (unsafe!)
let anyValue = someValue->Obj.magic

// Better: use proper types and bindings
```

### LocalStorage Integration

**Creating Bindings:**
```rescript
// bindings/LocalStorage.res
@scope("localStorage") @val
external getItem: string => Js.Nullable.t<string> = "getItem"

@scope("localStorage") @val
external setItem: (string, string) => unit = "setItem"

// Helper for option type
let getItemOption = (key: string): option<string> => {
  getItem(key)->Js.Nullable.toOption
}
```

**Using in Components:**
```rescript
// Get from localStorage
let token = LocalStorage.getItemOption("user")

// Set in localStorage
LocalStorage.setItem("user", token)

// Store JSON
let userJson = %raw(`JSON.stringify(user)`)
LocalStorage.setItem("userInfo", userJson)
```


## Testing

### Unit Testing with Jest

**Test File Structure:**
```javascript
// SignUp.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import SignUp from '../SignUp.bs'; // Import compiled ReScript

describe('SignUp Component', () => {
  it('renders all form fields', () => {
    const store = mockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });
});
```

**Key Points:**
- Test compiled JavaScript (`.bs.js` files)
- Use React Testing Library for component testing
- Wrap with necessary providers (Redux, Router)
- Test user interactions, not implementation details

### Testing Validation Logic

**Exporting Functions for Testing:**
```rescript
// In component file
let validatePassword = (password, passwordConfirm) => {
  // validation logic
}

// Export for testing
let validatePasswordForTest = validatePassword
```

**Testing in JavaScript:**
```javascript
import { validatePasswordForTest } from '../SignUp.bs';

describe('Password Validation', () => {
  it('rejects mismatched passwords', () => {
    const result = validatePasswordForTest('password123', 'different');
    expect(result.TAG).toBe('Mismatch');
  });
  
  it('rejects short passwords', () => {
    const result = validatePasswordForTest('short', 'short');
    expect(result.TAG).toBe('TooShort');
  });
  
  it('accepts valid passwords', () => {
    const result = validatePasswordForTest('password123', 'password123');
    expect(result.TAG).toBe('Valid');
  });
});
```


### Property-Based Testing

**Using fast-check:**
```javascript
import fc from 'fast-check';
import { validatePasswordForTest } from '../SignUp.bs';

/**
 * Feature: elm-to-react-migration, Property 24: Password validation enforces matching and length
 */
describe('Password Validation Properties', () => {
  it('rejects passwords with length 1-5', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5 }),
        (password) => {
          const result = validatePasswordForTest(password, password);
          expect(result.TAG).toBe('TooShort');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('accepts matching passwords > 6 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 7, maxLength: 50 }),
        (password) => {
          const result = validatePasswordForTest(password, password);
          expect(result.TAG).toBe('Valid');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Key Points:**
- Run property tests with at least 100 iterations
- Test universal properties, not specific examples
- Reference correctness properties in comments
- Use generators that match your input domain


## Troubleshooting

### Common Compilation Errors

**Error: "This expression has type X but an expression was expected of type Y"**
- Check type annotations
- Ensure function arguments match expected types
- Use explicit type casting if necessary (sparingly)

**Error: "The record field X can't be found"**
- Check record type definition
- Ensure all required fields are present
- Use spread operator for updates: `{...state, field: newValue}`

**Error: "This variant pattern is expected to have type X"**
- Check variant type definition
- Ensure all cases in switch are handled
- Use exhaustive pattern matching

### Runtime Issues

**"Cannot read property of undefined"**
- Check option types: use `option<'a>` instead of nullable
- Pattern match on options before accessing
- Use `Belt.Option` utilities

**"Redux state is undefined"**
- Ensure store is properly typed
- Check selector function returns correct type
- Verify Redux provider wraps component

**"Event handler not firing"**
- Check event type: `ReactEvent.Form.t`, `ReactEvent.Mouse.t`, etc.
- Ensure preventDefault is called if needed
- Verify event handler is properly bound

### Build Issues

**ReScript files not compiling:**
```bash
# Clean and rebuild
pnpm rescript clean
pnpm rescript build
```

**Vite not picking up changes:**
```bash
# Restart dev server
# Ensure ReScript compiler is running in watch mode
pnpm rescript build -w
```

**Type errors in compiled JavaScript:**
- Check `bsconfig.json` configuration
- Ensure `"in-source": true` for Vite
- Verify `suffix` is set to `.bs.js`


### Debugging Tips

**1. Check Compiled JavaScript:**
- Look at `.bs.js` files to understand compilation output
- Helps identify type issues and interop problems
- Compiled code is readable and well-formatted

**2. Use Console Logging:**
```rescript
// Log values during development
let _ = Js.log("State: ")
let _ = Js.log(state)

// Log with label
let _ = Js.log2("User:", user)
```

**3. Type Annotations:**
```rescript
// Add explicit type annotations to catch errors early
let handleSubmit = (evt: ReactEvent.Form.t): unit => {
  // ...
}

let user: option<profileUser> = getUserFromStorage()
```

**4. Pattern Match Exhaustively:**
```rescript
// Compiler will warn if cases are missing
switch result {
| Ok(data) => handleSuccess(data)
| Error(error) => handleError(error)
// Compiler ensures all cases handled
}
```

**5. Use ReScript Playground:**
- Test syntax and patterns at https://rescript-lang.org/try
- Experiment with type definitions
- Learn from examples


## Complete Migration Example: SignUp Component

### Original React Component (Simplified)

```javascript
// SignUp.jsx
import React, { useReducer, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../features/auth/authSlice';

const initialState = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  passwordConfirm: '',
  signupAttempted: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIRSTNAME':
      return { ...state, firstname: action.value };
    case 'UPDATE_LASTNAME':
      return { ...state, lastname: action.value };
    case 'UPDATE_EMAIL':
      return { ...state, email: action.value };
    case 'UPDATE_PASSWORD':
      return { ...state, password: action.value };
    case 'UPDATE_PASSWORD_CONFIRM':
      return { ...state, passwordConfirm: action.value };
    case 'SIGNUP_ATTEMPTED':
      return { ...state, signupAttempted: true };
    case 'RESET_ATTEMPT':
      return { ...state, signupAttempted: false };
    default:
      return state;
  }
}

function SignUp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const reduxDispatch = useDispatch();
  const navigate = useNavigate();
  
  const signupError = useSelector(state => state.auth.signupError);
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (state.password !== state.passwordConfirm) {
      showError("passwords don't match");
      return;
    }
    
    if (state.password.length < 6) {
      showError("passwords should be > 6 characters");
      return;
    }
    
    dispatch({ type: 'SIGNUP_ATTEMPTED' });
    reduxDispatch(signup({
      firstname: state.firstname,
      lastname: state.lastname,
      email: state.email,
      password: state.password,
    }));
  };
  
  useEffect(() => {
    if (state.signupAttempted) {
      if (signupError) {
        showError(signupError);
        dispatch({ type: 'RESET_ATTEMPT' });
      } else if (token && user) {
        localStorage.setItem('user', token);
        localStorage.setItem('userInfo', JSON.stringify(user));
        showSuccess('Your Account has been created successfully!');
        navigate('/dashboard');
        dispatch({ type: 'RESET_ATTEMPT' });
      }
    }
  }, [signupError, token, user, state.signupAttempted]);
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={state.firstname}
        onChange={(e) => dispatch({ type: 'UPDATE_FIRSTNAME', value: e.target.value })}
      />
      {/* More inputs... */}
      <button type="submit">Sign up</button>
    </form>
  );
}
```


### Migrated ReScript Component

```rescript
// SignUp.res
open Redux
open ReactRouter
open Materialize

// External binding for signup action
@module("../../features/auth/authSlice")
external signup: {..} => {..} = "signup"

// Form state type
type state = {
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  passwordConfirm: string,
  signupAttempted: bool,
}

// Action type (type-safe!)
type action =
  | UpdateFirstname(string)
  | UpdateLastname(string)
  | UpdateEmail(string)
  | UpdatePassword(string)
  | UpdatePasswordConfirm(string)
  | SignupAttempted
  | ResetAttempt

// Password validation type
type passwordValidation =
  | Valid
  | Mismatch
  | TooShort

// Validation function
let validatePassword = (password, passwordConfirm) => {
  if password != passwordConfirm {
    Mismatch
  } else if String.length(password) >= 1 && String.length(password) < 6 {
    TooShort
  } else {
    Valid
  }
}

// Reducer (exhaustive pattern matching!)
let reducer = (state, action) => {
  switch action {
  | UpdateFirstname(value) => {...state, firstname: value}
  | UpdateLastname(value) => {...state, lastname: value}
  | UpdateEmail(value) => {...state, email: value}
  | UpdatePassword(value) => {...state, password: value}
  | UpdatePasswordConfirm(value) => {...state, passwordConfirm: value}
  | SignupAttempted => {...state, signupAttempted: true}
  | ResetAttempt => {...state, signupAttempted: false}
  }
}

// Initial state
let initialState = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  passwordConfirm: "",
  signupAttempted: false,
}

@react.component
let make = () => {
  // Local state
  let (state, dispatch) = React.useReducer(reducer, initialState)
  
  // Redux hooks
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()
  
  // Redux selectors
  let signupError = useSelector((store: {..}) => store["auth"]["signupError"])
  let token = useSelector((store: {..}) => store["auth"]["token"])
  let user = useSelector((store: {..}) => store["auth"]["user"])
  let session = useSelector((store: {..}) => store["auth"]["session"])
  
  // Form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    
    // Type-safe validation with pattern matching
    switch validatePassword(state.password, state.passwordConfirm) {
    | Mismatch => showError("passwords don't match")
    | TooShort => showError("passwords should be > 6 characters")
    | Valid => {
        dispatch(SignupAttempted)
        
        let payload = {
          "firstname": state.firstname,
          "lastname": state.lastname,
          "username": state.email,
          "email": state.email,
          "password": state.password,
        }
        
        reduxDispatch(signup(payload))
      }
    }
  }
  
  // Effect for handling signup result
  React.useEffect5(() => {
    if state.signupAttempted {
      // Handle error
      let errorIsNull = %raw(`signupError === null || signupError === undefined`)
      
      if !errorIsNull {
        let errorMessage = // Extract error message
        showError(errorMessage)
        dispatch(ResetAttempt)
      }
      
      // Handle success
      let loggedIn = session["loggedIn"]
      
      switch (token, loggedIn) {
      | ("", _) => ()
      | (_, false) => ()
      | (token, true) => {
          LocalStorage.setItem("user", token)
          let userJson = %raw(`JSON.stringify(user)`)
          LocalStorage.setItem("userInfo", userJson)
          showSuccess("Your Account has been created successfully!")
          navigate("/dashboard")
          dispatch(ResetAttempt)
        }
      }
    }
    
    None
  }, (signupError, token, user, session, state.signupAttempted))
  
  // Render
  <form onSubmit={handleSubmit}>
    <input
      type_="text"
      value={state.firstname}
      onChange={evt => {
        let value = ReactEvent.Form.target(evt)["value"]
        dispatch(UpdateFirstname(value))
      }}
    />
    {/* More inputs... */}
    <button type_="submit">
      {React.string("Sign up")}
    </button>
  </form>
}

// Export for JavaScript interop
let default = make
```


### Key Improvements in ReScript Version

1. **Type Safety**
   - Actions are type-safe variants (no string typos)
   - Validation states are explicit types
   - Compiler catches missing cases in pattern matching

2. **Better Validation**
   - Validation logic separated into pure function
   - Type-safe validation results
   - Clear handling of all validation states

3. **Exhaustive Pattern Matching**
   - Reducer handles all action types (compiler enforced)
   - Validation handles all states (compiler enforced)
   - No runtime errors from missing cases

4. **Cleaner Code**
   - No magic strings for action types
   - No boolean flags for validation
   - Clear data flow with pattern matching

5. **Compile-Time Guarantees**
   - No null/undefined errors
   - No type mismatches
   - No missing object properties

## Best Practices Summary

### Do's ✅

- **Use variant types** for states and actions
- **Pattern match exhaustively** on all variants
- **Create bindings** for JavaScript libraries
- **Use option types** instead of null/undefined
- **Write pure functions** for validation and logic
- **Test compiled JavaScript** with Jest
- **Add type annotations** for clarity
- **Use result types** for operations that can fail
- **Keep components small** and focused
- **Document complex patterns** with comments

### Don'ts ❌

- **Don't use Obj.magic** unless absolutely necessary
- **Don't ignore compiler warnings** - they prevent bugs
- **Don't use %raw** for everything - create proper bindings
- **Don't skip pattern matching** - use exhaustive matches
- **Don't use mutable state** - use immutable updates
- **Don't test ReScript code directly** - test compiled JS
- **Don't fight the type system** - work with it
- **Don't use any/unknown types** - be specific
- **Don't skip validation** - validate at boundaries
- **Don't forget to export** components with `let default = make`


## Resources

### Official Documentation

- **ReScript Language**: https://rescript-lang.org/docs/manual/latest/introduction
- **ReScript-React**: https://rescript-lang.org/docs/react/latest/introduction
- **ReScript Playground**: https://rescript-lang.org/try

### Community Resources

- **ReScript Forum**: https://forum.rescript-lang.org/
- **ReScript Discord**: https://discord.gg/reasonml
- **GitHub Examples**: Search for "rescript react" on GitHub

### Related Documentation

- **Elm to ReScript Migration**: See `.kiro/specs/elm-to-react-migration/design.md`
- **Frontend Testing Guide**: See `frontend/TESTING.md`
- **Modernization Strategy**: See `frontend/MODERNIZATION.md`

### Learning Path

1. **Start with ReScript Basics**
   - Learn syntax and type system
   - Practice with ReScript playground
   - Understand pattern matching

2. **Learn ReScript-React**
   - Study component patterns
   - Practice with hooks
   - Understand JSX differences

3. **Create Simple Bindings**
   - Start with simple external declarations
   - Test bindings thoroughly
   - Document usage patterns

4. **Migrate Simple Components**
   - Start with static components
   - Progress to forms
   - Move to complex components

5. **Master Advanced Patterns**
   - Async/await with promises
   - Complex state management
   - API integration patterns

## Conclusion

Migrating from React to ReScript provides significant benefits in type safety, code quality, and developer experience. While there's a learning curve, the investment pays off through:

- **Fewer Runtime Errors**: Type system catches bugs at compile time
- **Better Refactoring**: Compiler guides you through changes
- **Clearer Code**: Pattern matching makes logic explicit
- **Performance**: Optimized JavaScript output
- **Confidence**: Exhaustive checking ensures correctness

Start with simple components, build your expertise gradually, and leverage the patterns documented in this guide. The ReScript compiler is your ally - trust it, learn from it, and let it help you write better code.

**Happy migrating!** 🚀

