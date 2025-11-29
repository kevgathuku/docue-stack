# Design Document: Elm to ReScript Migration

## Overview

This design outlines the migration of 7 Elm components to ReScript, establishing patterns and infrastructure for the eventual migration of the entire frontend codebase. The migration preserves all existing functionality while introducing compile-time type safety through ReScript's sound type system.

### Migration Scope

**Elm Components to Migrate:**
1. Login - Form with Redux integration (simplest, good starting point)
2. Landing - Static content (simplest, no state/API)
3. NotFound - Static error page (simplest)
4. CreateRole - Form with Redux dispatch (moderate complexity)
5. Admin - Dashboard with API fetching (moderate complexity)
6. RolesAdmin - Table with API fetching and tooltips (moderate complexity)
7. Profile - Complex form with view/edit toggle, validation, and API calls (most complex)

**React Component to Migrate (Proof of Concept):**
8. SignUp - Form component with validation and Redux integration (establishes React → ReScript pattern)

**Why Include a React Component:**
Migrating one React component alongside the Elm components serves multiple purposes:
- Establishes the migration pattern for the larger React → ReScript migration
- Validates that ReScript bindings work for React components (not just Elm replacements)
- Provides a comparison between Elm → ReScript and React → ReScript migrations
- Builds team confidence for the eventual full React migration
- Tests ReScript-React patterns with hooks, effects, and modern React features

**Migration Order Strategy:**
1. Start with simplest Elm components to establish ReScript basics
2. Progress to more complex Elm components
3. Migrate SignUp (React) to validate React → ReScript patterns
4. Document learnings for future React migrations

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vite Build Pipeline                      │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   ReScript   │─────▶│  JavaScript  │                    │
│  │   Compiler   │      │    Output    │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         │                      ▼                            │
│         │              ┌──────────────┐                    │
│         │              │     Vite     │                    │
│         │              │   Bundler    │                    │
│         │              └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Runtime                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ReScript Components                      │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │  │
│  │  │ Login  │  │Profile │  │ Admin  │  │  Roles │    │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ReScript Bindings Layer                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  Redux   │  │  Router  │  │Materialize│          │  │
│  │  │ Toolkit  │  │  Hooks   │  │   Toast  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Existing JavaScript Infrastructure            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  Redux   │  │  React   │  │   API    │          │  │
│  │  │  Store   │  │  Router  │  │  Client  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login/
│   │   │   ├── Login.res          # ReScript component
│   │   │   └── __tests__/
│   │   │       └── Login.test.js  # Jest tests (compiled ReScript)
│   │   ├── Profile/
│   │   │   ├── Profile.res
│   │   │   └── __tests__/
│   │   ├── Admin/
│   │   │   ├── Admin.res
│   │   │   └── __tests__/
│   │   ├── RolesAdmin/
│   │   │   ├── RolesAdmin.res
│   │   │   └── __tests__/
│   │   ├── CreateRole/
│   │   │   ├── CreateRole.res
│   │   │   └── __tests__/
│   │   ├── Landing/
│   │   │   ├── Landing.res
│   │   │   └── __tests__/
│   │   ├── NotFound/
│   │   │   ├── NotFound.res
│   │   │   └── __tests__/
│   │   └── [existing React components...]
│   ├── bindings/
│   │   ├── Redux.res              # Redux Toolkit bindings
│   │   ├── ReactRouter.res        # React Router bindings
│   │   ├── Materialize.res        # Materialize bindings
│   │   ├── LocalStorage.res       # localStorage bindings
│   │   └── Fetch.res              # Fetch API bindings
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.js       # Existing Redux slice
│   │   │   └── AuthTypes.res      # ReScript types for auth
│   │   ├── documents/
│   │   │   └── DocumentTypes.res
│   │   └── roles/
│   │       └── RoleTypes.res
│   └── utils/
│       └── ApiClient.res          # Type-safe API client
├── bsconfig.json                  # ReScript configuration
└── package.json
```

## Components and Interfaces

### 1. ReScript Bindings Layer

#### Redux Toolkit Bindings

```rescript
// bindings/Redux.res

// Type for Redux store
type store

// Type for dispatch function
type dispatch = Js.Json.t => unit

// Hook to get dispatch function
@module("react-redux") @val
external useDispatch: unit => dispatch = "useDispatch"

// Hook to select from store
@module("react-redux") @val
external useSelector: (store => 'a) => 'a = "useSelector"

// Dispatch an action
let dispatchAction: (dispatch, Js.Json.t) => unit = (dispatch, action) => {
  dispatch(action)
}
```

#### React Router Bindings

```rescript
// bindings/ReactRouter.res

// Navigate function type
type navigate = (string, ~options: {..}=?) => unit

// Hook to get navigate function
@module("react-router-dom") @val
external useNavigate: unit => navigate = "useNavigate"

// Navigate to a route
let navigateTo: (navigate, string) => unit = (navigate, path) => {
  navigate(path)
}
```

#### Materialize Bindings

```rescript
// bindings/Materialize.res

// Toast options
type toastOptions = {
  html: string,
  displayLength: int,
  classes: string,
}

// External binding to Materialize toast
@scope("Materialize") @val
external toast: toastOptions => unit = "toast"

// Helper to show success toast
let showSuccess: string => unit = message => {
  toast({
    html: message,
    displayLength: 2000,
    classes: "success-toast",
  })
}

// Helper to show error toast
let showError: string => unit = message => {
  toast({
    html: message,
    displayLength: 2000,
    classes: "error-toast",
  })
}
```

#### LocalStorage Bindings

```rescript
// bindings/LocalStorage.res

// Get item from localStorage
@scope("localStorage") @val
external getItem: string => Js.Nullable.t<string> = "getItem"

// Set item in localStorage
@scope("localStorage") @val
external setItem: (string, string) => unit = "setItem"

// Remove item from localStorage
@scope("localStorage") @val
external removeItem: string => unit = "removeItem"

// Type-safe helpers
let getToken: unit => option<string> = () => {
  getItem("user")->Js.Nullable.toOption
}

let setToken: string => unit = token => {
  setItem("user", token)
}

let getUserInfo: unit => option<Js.Json.t> = () => {
  switch getItem("userInfo")->Js.Nullable.toOption {
  | Some(json) => Some(Js.Json.parseExn(json))
  | None => None
  }
}
```

### 2. Type Definitions

#### Auth Types

```rescript
// features/auth/AuthTypes.res

// User type matching backend structure
type user = {
  @as("_id") id: string,
  email: string,
  name: {
    first: string,
    last: string,
  },
  role: option<{
    title: string,
    accessLevel: int,
  }>,
}

// Login credentials
type loginCredentials = {
  username: string,
  password: string,
}

// Auth state
type authState = {
  user: option<user>,
  token: option<string>,
  loginError: option<string>,
  isLoading: bool,
}

// Decode user from JSON
let decodeUser: Js.Json.t => result<user, string> = json => {
  // Implementation using Js.Json.decodeObject, etc.
  Error("Not implemented")
}
```

#### Role Types

```rescript
// features/roles/RoleTypes.res

type role = {
  @as("_id") id: string,
  title: string,
  accessLevel: int,
}

type roleList = array<role>

// Decode role from JSON
let decodeRole: Js.Json.t => result<role, string> = json => {
  Error("Not implemented")
}

// Decode role list from JSON
let decodeRoleList: Js.Json.t => result<roleList, string> = json => {
  Error("Not implemented")
}
```

### 3. Component Designs

#### Login Component (Simplest - Start Here)

```rescript
// components/Login/Login.res

open Redux
open ReactRouter
open Materialize

// Component state
type state = {
  email: string,
  password: string,
  loginAttempted: bool,
}

// Actions
type action =
  | UpdateEmail(string)
  | UpdatePassword(string)
  | Submit
  | LoginAttempted
  | ResetAttempt

// Reducer
let reducer = (state, action) => {
  switch action {
  | UpdateEmail(email) => {...state, email: email}
  | UpdatePassword(password) => {...state, password: password}
  | Submit => state
  | LoginAttempted => {...state, loginAttempted: true}
  | ResetAttempt => {...state, loginAttempted: false}
  }
}

// Initial state
let initialState = {
  email: "",
  password: "",
  loginAttempted: false,
}

@react.component
let make = () => {
  let (state, dispatch) = React.useReducer(reducer, initialState)
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()
  
  // Select auth state from Redux
  let loginError = useSelector(store => {
    // Access store.auth.loginError
    None // Placeholder
  })
  
  let token = useSelector(store => {
    // Access store.auth.token
    None // Placeholder
  })
  
  // Handle form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    dispatch(LoginAttempted)
    
    // Dispatch Redux login action
    let credentials = {
      "username": state.email,
      "password": state.password,
    }
    // reduxDispatch(loginAction(credentials))
  }
  
  // Effect to handle login success/error
  React.useEffect2(() => {
    switch (loginError, token, state.loginAttempted) {
    | (Some(error), _, true) => {
        showError(error)
        dispatch(ResetAttempt)
      }
    | (None, Some(token), true) => {
        LocalStorage.setToken(token)
        showSuccess("Logged in Successfully!")
        navigate("/dashboard")
        dispatch(ResetAttempt)
      }
    | _ => ()
    }
    None
  }, (loginError, token))
  
  // Render
  <div className="row">
    <form className="col s12" onSubmit={handleSubmit}>
      <div className="input-field col s12">
        <input
          className="validate"
          name="email"
          type_="text"
          required=true
          value={state.email}
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateEmail(value))
          }}
        />
        <label htmlFor="email"> {React.string("Email Address")} </label>
      </div>
      <div className="input-field col s12">
        <input
          className="validate"
          name="password"
          type_="password"
          required=true
          value={state.password}
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdatePassword(value))
          }}
        />
        <label htmlFor="password"> {React.string("Password")} </label>
      </div>
      <div className="col s12">
        <div className="container center">
          <button
            className="btn waves-effect header-btn blue"
            name="action"
            type_="submit">
            {React.string("Login")}
          </button>
        </div>
      </div>
    </form>
  </div>
}

// Export for JavaScript interop
let default = make
```

#### Landing Component (Simplest - Static)

```rescript
// components/Landing/Landing.res

@react.component
let make = () => {
  <div id="hero">
    <div className="container" id="hero-text-container">
      <div className="row">
        <div className="col s12 center-align">
          <h1 id="hero-title">
            <span className="bold"> {React.string("Docue    ")} </span>
            <span className="thin"> {React.string("is the simplest way for")} </span>
            <br />
            <span className="thin">
              {React.string("you to manage your documents online")}
            </span>
          </h1>
        </div>
      </div>
      <div className="row">
        <div className="col s12">
          <div className="center-align">
            <a className="btn btn-large create-list-link hero-btn" href="/auth">
              {React.string("Get Started")}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
}

let default = make
```

#### SignUp Component (React → ReScript Pattern)

```rescript
// components/SignUp/SignUp.res

open Redux
open ReactRouter
open Materialize

// Form state
type state = {
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  passwordConfirm: string,
  signupAttempted: bool,
}

// Actions
type action =
  | UpdateFirstname(string)
  | UpdateLastname(string)
  | UpdateEmail(string)
  | UpdatePassword(string)
  | UpdatePasswordConfirm(string)
  | Submit
  | SignupAttempted
  | ResetAttempt

// Password validation result
type passwordValidation =
  | Valid
  | Mismatch
  | TooShort

// Validate password
let validatePassword = (password, passwordConfirm) => {
  if password != passwordConfirm {
    Mismatch
  } else if Js.String.length(password) > 0 && Js.String.length(password) < 6 {
    TooShort
  } else {
    Valid
  }
}

// Reducer
let reducer = (state, action) => {
  switch action {
  | UpdateFirstname(value) => {...state, firstname: value}
  | UpdateLastname(value) => {...state, lastname: value}
  | UpdateEmail(value) => {...state, email: value}
  | UpdatePassword(value) => {...state, password: value}
  | UpdatePasswordConfirm(value) => {...state, passwordConfirm: value}
  | Submit => state
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
  let (state, dispatch) = React.useReducer(reducer, initialState)
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()
  
  // Select auth state from Redux
  let signupError = useSelector(store => {
    // Access store.auth.signupError
    None // Placeholder
  })
  
  let token = useSelector(store => {
    // Access store.auth.token
    None // Placeholder
  })
  
  let user = useSelector(store => {
    // Access store.auth.user
    None // Placeholder
  })
  
  let session = useSelector(store => {
    // Access store.auth.session
    None // Placeholder
  })
  
  // Handle form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    
    switch validatePassword(state.password, state.passwordConfirm) {
    | Mismatch => showError("passwords don't match")
    | TooShort => showError("passwords should be > 6 characters")
    | Valid => {
        dispatch(SignupAttempted)
        
        // Create signup payload
        let payload = {
          "firstname": state.firstname,
          "lastname": state.lastname,
          "username": state.email,
          "email": state.email,
          "password": state.password,
        }
        
        // Dispatch Redux signup action
        // reduxDispatch(signupAction(payload))
      }
    }
  }
  
  // Effect to handle signup success/error
  React.useEffect4(() => {
    switch (signupError, token, user, state.signupAttempted) {
    | (Some(error), _, _, true) => {
        let errorMessage = switch error {
        | Object(obj) => obj["error"]->Belt.Option.getWithDefault(error)
        | String(str) => str
        }
        showError(errorMessage)
        dispatch(ResetAttempt)
      }
    | (None, Some(token), Some(user), true) => {
        LocalStorage.setToken(token)
        // Store user info
        let userJson = Js.Json.stringify(user)
        LocalStorage.setItem("userInfo", userJson)
        showSuccess("Your Account has been created successfully!")
        navigate("/dashboard")
        dispatch(ResetAttempt)
      }
    | _ => ()
    }
    None
  }, (signupError, token, user, state.signupAttempted))
  
  // Render
  <div className="row">
    <form className="col s12" onSubmit={handleSubmit}>
      <div className="input-field col m6 s12">
        <input
          className="validate"
          id="firstname"
          name="firstname"
          type_="text"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateFirstname(value))
          }}
        />
        <label htmlFor="firstname"> {React.string("First Name")} </label>
      </div>
      <div className="input-field col m6 s12">
        <input
          className="validate"
          id="lastname"
          name="lastname"
          type_="text"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateLastname(value))
          }}
        />
        <label htmlFor="lastname"> {React.string("Last Name")} </label>
      </div>
      <div className="input-field col s12">
        <input
          className="validate"
          id="email"
          name="email"
          type_="email"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateEmail(value))
          }}
        />
        <label htmlFor="email"> {React.string("Email")} </label>
      </div>
      <div className="input-field col s12">
        <input
          className="validate"
          id="password"
          name="password"
          type_="password"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdatePassword(value))
          }}
        />
        <label htmlFor="password"> {React.string("Password")} </label>
      </div>
      <div className="input-field col s12">
        <input
          className="validate"
          id="password-confirm"
          name="password-confirm"
          type_="password"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdatePasswordConfirm(value))
          }}
        />
        <label htmlFor="password-confirm"> {React.string("Confirm Password")} </label>
      </div>
      <div className="col s12">
        <div className="center">
          <button
            className="btn waves-effect waves-light blue"
            name="action"
            type_="submit">
            {React.string("Sign up")}
          </button>
        </div>
      </div>
    </form>
  </div>
}

let default = make
```

**Key Differences from Elm Migration:**
- Uses React hooks (useReducer, useEffect) instead of Elm's update function
- Integrates with Redux using ReScript bindings for hooks
- Uses ReScript-React event handling patterns
- Demonstrates modern React patterns in ReScript

#### Profile Component (Most Complex)

```rescript
// components/Profile/Profile.res

open Redux
open Materialize
open LocalStorage

// View mode
type viewMode = ProfileView | EditView

// Password validation state
type passwordState = Empty | Valid | Invalid(string)

// Component state
type state = {
  viewMode: viewMode,
  user: AuthTypes.user,
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  passwordConfirm: string,
  isSubmitting: bool,
}

// Actions
type action =
  | ToggleEdit
  | UpdateEmail(string)
  | UpdateFirstName(string)
  | UpdateLastName(string)
  | UpdatePassword(string)
  | UpdatePasswordConfirm(string)
  | Submit
  | SubmitSuccess(AuthTypes.user)
  | SubmitError(string)

// Validate password
let validatePassword = (password, passwordConfirm) => {
  if password == "" && passwordConfirm == "" {
    Empty
  } else if password != passwordConfirm {
    Invalid("Passwords don't match")
  } else if Js.String.length(password) <= 6 {
    Invalid("Passwords should be > 6 characters")
  } else {
    Valid
  }
}

// Reducer
let reducer = (state, action) => {
  switch action {
  | ToggleEdit => {
      ...state,
      viewMode: state.viewMode == ProfileView ? EditView : ProfileView,
    }
  | UpdateEmail(email) => {...state, email: email}
  | UpdateFirstName(firstName) => {...state, firstName: firstName}
  | UpdateLastName(lastName) => {...state, lastName: lastName}
  | UpdatePassword(password) => {...state, password: password}
  | UpdatePasswordConfirm(confirm) => {...state, passwordConfirm: confirm}
  | Submit => {...state, isSubmitting: true}
  | SubmitSuccess(user) => {
      ...state,
      user: user,
      isSubmitting: false,
      viewMode: ProfileView,
      password: "",
      passwordConfirm: "",
    }
  | SubmitError(_) => {...state, isSubmitting: false}
  }
}

@react.component
let make = () => {
  // Get user from localStorage
  let initialUser = switch getUserInfo() {
  | Some(json) => {
      // Decode user from JSON
      // Placeholder - actual implementation would decode properly
      {
        id: "",
        email: "",
        name: {first: "", last: ""},
        role: None,
      }
    }
  | None => {
      // Redirect to login if no user
      {
        id: "",
        email: "",
        name: {first: "", last: ""},
        role: None,
      }
    }
  }
  
  let initialState = {
    viewMode: ProfileView,
    user: initialUser,
    email: initialUser.email,
    firstName: initialUser.name.first,
    lastName: initialUser.name.last,
    password: "",
    passwordConfirm: "",
    isSubmitting: false,
  }
  
  let (state, dispatch) = React.useReducer(reducer, initialState)
  
  // Handle form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    
    switch validatePassword(state.password, state.passwordConfirm) {
    | Empty => {
        // Submit without password
        dispatch(Submit)
        // Make API call
      }
    | Valid => {
        // Submit with password
        dispatch(Submit)
        // Make API call with password
      }
    | Invalid(message) => {
        showError(message)
      }
    }
  }
  
  // Render profile view
  let renderProfileView = () => {
    <div style={ReactDOM.Style.make(~display="block", ())}>
      <div className="row">
        <h2 className="header center-align"> {React.string("My Profile")} </h2>
      </div>
      <div className="row">
        <div className="col s8 offset-s2">
          <div className="card">
            <div className="card-image waves-effect waves-block waves-light">
              <img className="activator" alt="Profile logo" src="mountain.jpg" />
              <span className="card-title activator">
                {React.string(state.firstName ++ " " ++ state.lastName)}
              </span>
            </div>
            <div className="card-action">
              <a
                className="btn-floating"
                onClick={_ => dispatch(ToggleEdit)}>
                <i className="material-icons cyan lighten-1">
                  {React.string("edit")}
                </i>
              </a>
            </div>
            <div className="card-reveal">
              <span className="card-title grey-text text-darken-4 center">
                {React.string("Full Profile")}
                <i className="material-icons right"> {React.string("close")} </i>
              </span>
              <p className="flow-text">
                <i className="material-icons left icon-align">
                  {React.string("face")}
                </i>
                {React.string("Name: " ++ state.firstName ++ " " ++ state.lastName)}
              </p>
              <p className="flow-text">
                <i className="material-icons left icon-align">
                  {React.string("email")}
                </i>
                {React.string("Email: " ++ state.email)}
              </p>
              {switch state.user.role {
              | Some(role) =>
                <p className="flow-text">
                  <i className="material-icons left icon-align">
                    {React.string("settings")}
                  </i>
                  {React.string("Role: " ++ role.title)}
                </p>
              | None => React.null
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  }
  
  // Render edit form
  let renderEditForm = () => {
    <div
      className="card-panel"
      style={ReactDOM.Style.make(~display="block", ())}>
      <div className="row">
        <h2 className="header center-align"> {React.string("Edit Profile")} </h2>
      </div>
      <form className="col s10 offset-s1" onSubmit={handleSubmit}>
        <div className="row">
          <div className="col s4 offset-s4">
            <label htmlFor="email"> {React.string("Email")} </label>
            <input
              id="email"
              name="email"
              type_="text"
              value={state.email}
              onChange={evt => {
                let value = ReactEvent.Form.target(evt)["value"]
                dispatch(UpdateEmail(value))
              }}
            />
          </div>
        </div>
        // ... more form fields ...
        <div className="row">
          <div className="col s2 offset-s4">
            <button
              className="btn waves-effect red accent-2 center"
              onClick={evt => {
                ReactEvent.Mouse.preventDefault(evt)
                dispatch(ToggleEdit)
              }}>
              {React.string("cancel")}
            </button>
          </div>
          <div className="col s2">
            <button
              className="btn waves-effect blue center"
              type_="submit"
              disabled={state.isSubmitting}>
              {React.string("update")}
            </button>
          </div>
        </div>
      </form>
    </div>
  }
  
  // Main render
  <div className="container">
    {switch state.viewMode {
    | ProfileView => renderProfileView()
    | EditView => renderEditForm()
    }}
  </div>
}

let default = make
```

## Data Models

### User Model

```rescript
type user = {
  @as("_id") id: string,
  email: string,
  name: {
    first: string,
    last: string,
  },
  role: option<{
    title: string,
    accessLevel: int,
  }>,
}
```

### Role Model

```rescript
type role = {
  @as("_id") id: string,
  title: string,
  accessLevel: int,
}
```

### Stats Model

```rescript
type stats = {
  documents: int,
  users: int,
  roles: int,
}
```

### API Response Models

```rescript
type apiError = {
  message: string,
  status: int,
}

type apiResult<'a> = 
  | Success('a)
  | Error(apiError)
```

## Correctnes
s Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies and consolidations:

**Redundant Properties to Remove:**
- Individual "display error toast" properties (1.4, 2.7, 3.3, 4.4, 5.4) can be consolidated into one error handling property
- Individual "fetch with token" properties (3.1, 4.1) can be consolidated into one authenticated API call property
- Individual "render UI structure" examples (1.5, 3.5, 4.5, 5.5, 6.1-6.3, 7.1-7.3) are better as snapshot tests than properties

**Consolidated Properties:**
- Form validation properties (1.1, 2.3, 2.4, 5.1) share common validation patterns
- State transition properties (2.2, 2.8) are part of a state machine
- API integration properties (2.5, 9.2-9.5) share common HTTP patterns

### Login Component Properties

**Property 1: Form state updates reflect input changes**
*For any* login form and any valid email/password input, updating the input field should result in the form state containing that exact value
**Validates: Requirements 1.1**

**Property 2: Form submission dispatches Redux action with credentials**
*For any* valid email and password entered in the login form, submitting the form should dispatch a Redux login action containing those exact credentials
**Validates: Requirements 1.2**

**Property 3: Successful login stores token and navigates**
*For any* successful login response containing a token, the system should store the token in localStorage and navigate to the dashboard
**Validates: Requirements 1.3**

### Profile Component Properties

**Property 4: Profile view displays all user data**
*For any* valid user object, the profile view should display the user's first name, last name, email, and role (if present) in the rendered output
**Validates: Requirements 2.1**

**Property 5: Edit toggle transitions state correctly**
*For any* profile component state, clicking the edit button should toggle between ProfileView and EditView modes, and clicking cancel should return to ProfileView
**Validates: Requirements 2.2, 2.8**

**Property 6: Password validation enforces rules**
*For any* password and confirmation password pair, the validation should return Invalid if they don't match, Invalid if length ≤ 6, Empty if both are empty, and Valid otherwise
**Validates: Requirements 2.4**

**Property 7: Profile update includes authentication**
*For any* profile update submission, the API request should include the x-access-token header with the current user's token
**Validates: Requirements 2.5**

**Property 8: Successful update refreshes localStorage**
*For any* successful profile update response, the system should update localStorage with the new user data and display a success toast
**Validates: Requirements 2.6**

### Admin Dashboard Properties

**Property 9: Dashboard fetches stats on mount**
*For any* admin dashboard component mount, the system should make an authenticated API call to fetch statistics
**Validates: Requirements 3.1, 3.4**

**Property 10: Stats display shows all counts**
*For any* valid stats response containing documents, users, and roles counts, the rendered output should display all three values
**Validates: Requirements 3.2**

### Roles Admin Properties

**Property 11: Roles table renders all role data**
*For any* list of roles, the rendered table should contain a row for each role displaying its title and access level
**Validates: Requirements 4.2**

### Create Role Properties

**Property 12: Role title input updates state**
*For any* role creation form and any input value, changing the title input should update the form state to contain that exact value
**Validates: Requirements 5.1**

**Property 13: Role creation dispatches Redux action**
*For any* role title entered in the form, submitting should dispatch a Redux action to create a role with that title
**Validates: Requirements 5.2**

**Property 14: Successful creation navigates to list**
*For any* successful role creation response, the system should navigate to the roles list page
**Validates: Requirements 5.3**

### SignUp Component Properties (React → ReScript Pattern)

**Property 23: SignUp form state updates reflect input changes**
*For any* signup form field and any input value, changing the input should update the corresponding field in the form state
**Validates: Requirements 14.1**

**Property 24: Password validation enforces matching and length**
*For any* password and confirmation password pair, validation should reject if they don't match or if password length is between 1 and 5 characters
**Validates: Requirements 14.2**

**Property 25: Valid signup dispatches Redux action**
*For any* valid signup form data (matching passwords > 6 chars), submitting should dispatch a Redux signup action with the user data
**Validates: Requirements 14.3**

**Property 26: Successful signup stores token and navigates**
*For any* successful signup response containing a token and user, the system should store both in localStorage and navigate to the dashboard
**Validates: Requirements 14.4**

**Property 27: Signup errors display toast notifications**
*For any* signup error response, the system should display an error toast with the error message
**Validates: Requirements 14.5**

### Cross-Component Properties

**Property 15: Error responses show toast notifications**
*For any* API error response, the system should display an error toast notification with the error message
**Validates: Requirements 1.4, 2.7, 3.3, 4.4, 5.4**

**Property 16: Authenticated API calls include token header**
*For any* API request that requires authentication, the HTTP request should include the x-access-token header with the current user's token
**Validates: Requirements 9.2**

**Property 17: API responses are parsed and validated**
*For any* API response, the system should parse the JSON and validate it against the expected type before using the data
**Validates: Requirements 9.4**

**Property 18: API calls use correct base URL**
*For any* HTTP request to the backend API, the URL should start with the configured base URL for the current environment
**Validates: Requirements 9.5**

### UI Consistency Properties

**Property 19: Migrated components preserve CSS classes**
*For any* migrated component, the rendered HTML should contain the same CSS classes as the original Elm version
**Validates: Requirements 12.1**

**Property 20: Form validation behavior matches Elm**
*For any* form input that had validation in the Elm version, the ReScript version should apply the same validation rules and show the same error messages
**Validates: Requirements 12.2**

**Property 21: User feedback matches Elm behavior**
*For any* user interaction that triggered a toast notification in the Elm version, the ReScript version should show the same toast with the same message and styling
**Validates: Requirements 12.3**

**Property 22: Materialize components initialize correctly**
*For any* component that uses Materialize UI elements (tooltips, modals, etc.), the initialization function should be called after the component renders
**Validates: Requirements 12.5**

## Error Handling

### Error Types

```rescript
// Error types for the application
type apiError = 
  | NetworkError
  | Unauthorized
  | NotFound
  | ServerError(int, string)
  | ParseError(string)

type validationError =
  | EmptyField(string)
  | InvalidEmail
  | PasswordTooShort
  | PasswordMismatch
  | InvalidFormat(string)
```

### Error Handling Strategy

1. **API Errors**: All API calls return `Result<'data, apiError>`. Components pattern match on the result and show appropriate error toasts.

2. **Validation Errors**: Form validation returns `Result<'valid, validationError>`. Invalid states prevent submission and show inline error messages.

3. **Type Safety**: ReScript's type system prevents many runtime errors (null/undefined, type mismatches, missing fields).

4. **Error Boundaries**: Use React error boundaries to catch and display unexpected errors gracefully.

5. **Logging**: Log errors to console in development, send to error tracking service in production.

### Error Handling Examples

```rescript
// API error handling
let handleApiError = (error: apiError) => {
  switch error {
  | NetworkError => Materialize.showError("Network error. Please check your connection.")
  | Unauthorized => {
      Materialize.showError("Session expired. Please log in again.")
      // Navigate to login
    }
  | NotFound => Materialize.showError("Resource not found.")
  | ServerError(status, message) => 
      Materialize.showError(`Server error (${Belt.Int.toString(status)}): ${message}`)
  | ParseError(message) => 
      Materialize.showError(`Data error: ${message}`)
  }
}

// Validation error handling
let handleValidationError = (error: validationError) => {
  switch error {
  | EmptyField(field) => `${field} is required`
  | InvalidEmail => "Please enter a valid email address"
  | PasswordTooShort => "Password must be longer than 6 characters"
  | PasswordMismatch => "Passwords don't match"
  | InvalidFormat(message) => message
  }
}
```

## Testing Strategy

### Testing Approach

The migration will use a dual testing approach:

1. **Unit Tests**: Test specific examples, edge cases, and component behavior
2. **Property-Based Tests**: Verify universal properties across many generated inputs

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing with user-centric queries
- **fast-check**: Property-based testing library for JavaScript
- **ReScript Test**: Native ReScript testing (if needed for pure ReScript logic)

### Test Organization

```
components/
├── Login/
│   ├── Login.res
│   └── __tests__/
│       ├── Login.test.js           # Unit tests
│       └── Login.properties.test.js # Property tests
```

### Unit Testing Strategy

**What to Unit Test:**
- Component rendering with specific props
- User interactions (clicks, form submissions)
- Edge cases (empty data, error states)
- Integration with Redux and React Router
- Materialize initialization

**Example Unit Test:**

```javascript
// Login.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login.bs'; // Compiled ReScript

describe('Login Component', () => {
  it('renders email and password inputs', () => {
    const store = mockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
  
  it('dispatches login action on form submission', () => {
    const store = mockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    const actions = store.getActions();
    expect(actions[0].type).toBe('auth/login/pending');
  });
});
```

### Property-Based Testing Strategy

**What to Property Test:**
- Form validation logic across many inputs
- State transitions and reducers
- Data transformations and parsing
- API request/response handling
- Redux action creators and reducers

**Example Property Test:**

```javascript
// Login.properties.test.js
import fc from 'fast-check';
import { validateEmail, validatePassword } from '../Login.bs';

/**
 * Feature: elm-to-react-migration, Property 1: Form state updates reflect input changes
 */
describe('Login Form Properties', () => {
  it('email validation accepts valid emails', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          const result = validateEmail(email);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: elm-to-react-migration, Property 6: Password validation enforces rules
   */
  it('password validation rejects passwords <= 6 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 6 }),
        (password) => {
          const result = validatePassword(password, password);
          if (password.length === 0) {
            expect(result.tag).toBe('Empty');
          } else {
            expect(result.tag).toBe('Invalid');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('password validation accepts matching passwords > 6 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 7, maxLength: 50 }),
        (password) => {
          const result = validatePassword(password, password);
          expect(result.tag).toBe('Valid');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% line coverage for all migrated components
- **Critical Paths**: 100% coverage for authentication, validation, and API integration
- **Property Tests**: At least one property test per correctness property in the design
- **Regression Tests**: All existing Elm component tests must have equivalent ReScript tests

### Testing Migration Components

**Before Migration:**
1. Document all existing Elm component behaviors
2. Create test cases for current functionality
3. Run Elm tests to establish baseline

**During Migration:**
1. Write ReScript component
2. Write unit tests for basic functionality
3. Write property tests for correctness properties
4. Compare behavior with Elm version

**After Migration:**
1. Run full test suite
2. Verify all tests pass
3. Check coverage meets requirements
4. Manual testing for UI/UX consistency

## Build and Development Workflow

### ReScript Configuration

**bsconfig.json:**

```json
{
  "name": "docue-frontend",
  "version": "1.0.0",
  "sources": [
    {
      "dir": "src/components",
      "subdirs": true
    },
    {
      "dir": "src/bindings",
      "subdirs": false
    },
    {
      "dir": "src/features",
      "subdirs": true
    },
    {
      "dir": "src/utils",
      "subdirs": false
    }
  ],
  "package-specs": {
    "module": "es6",
    "in-source": true
  },
  "suffix": ".bs.js",
  "bs-dependencies": [
    "@rescript/react"
  ],
  "reason": {
    "react-jsx": 3
  },
  "warnings": {
    "error": "+101+5+6"
  },
  "bsc-flags": [
    "-open Belt"
  ]
}
```

### Vite Configuration Updates

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import elmPlugin from 'vite-plugin-elm'; // Keep during migration

export default defineConfig({
  plugins: [
    react(),
    elmPlugin(), // Remove after Elm migration complete
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Ensure ReScript compiled files are included
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
```

### Development Workflow

1. **Start ReScript Compiler in Watch Mode:**
   ```bash
   pnpm rescript build -w
   ```

2. **Start Vite Dev Server:**
   ```bash
   pnpm --filter frontend start
   ```

3. **Run Tests in Watch Mode:**
   ```bash
   pnpm --filter frontend test --watch
   ```

### Migration Workflow

**For Each Component:**

1. **Preparation**
   - Read Elm source code
   - Document all behaviors and edge cases
   - Identify dependencies (Redux, Router, Materialize)
   - Create test plan

2. **Create Bindings** (if needed)
   - Write ReScript bindings for JavaScript dependencies
   - Test bindings with simple examples
   - Document binding usage

3. **Implement Component**
   - Create .res file
   - Implement component logic
   - Add type annotations
   - Handle all cases from Elm version

4. **Write Tests**
   - Unit tests for rendering and interactions
   - Property tests for correctness properties
   - Integration tests for Redux/Router

5. **Verify**
   - Run tests
   - Manual testing in browser
   - Compare with Elm version
   - Check console for errors

6. **Update Imports**
   - Change JavaScript imports from .elm to .bs.js
   - Update any wrapper components
   - Test integration with rest of app

7. **Cleanup** (after all components migrated)
   - Remove Elm files
   - Remove Elm dependencies
   - Remove Elm Vite plugin
   - Remove ReactElm wrapper
   - Update documentation

## Migration Risks and Mitigation

### Risk 1: Learning Curve

**Risk**: Team unfamiliar with ReScript syntax and patterns
**Impact**: High - Could slow migration significantly
**Mitigation**:
- Start with simplest components (Landing, NotFound)
- Pair programming for first few components
- Document patterns and best practices
- Create ReScript style guide
- Regular code reviews

### Risk 2: Binding Complexity

**Risk**: Creating type-safe bindings for Redux Toolkit and other libraries is complex
**Impact**: Medium - Could block progress
**Mitigation**:
- Research existing ReScript bindings for Redux
- Start with minimal bindings, expand as needed
- Use `external` declarations liberally at first
- Refine types iteratively
- Document all bindings thoroughly

### Risk 3: Build Pipeline Issues

**Risk**: ReScript compilation might not integrate smoothly with Vite
**Impact**: Medium - Could cause development friction
**Mitigation**:
- Test ReScript + Vite integration early
- Use in-source compilation (`.bs.js` files next to `.res`)
- Configure proper file watching
- Document build issues and solutions

### Risk 4: Type System Differences

**Risk**: Elm's type system differs from ReScript's, some patterns may not translate directly
**Impact**: Low - ReScript is also ML-family, similar concepts
**Mitigation**:
- Study ReScript type system before starting
- Identify Elm patterns that need adaptation
- Use ReScript's variant types for Elm's union types
- Leverage ReScript's option type for Maybe

### Risk 5: Testing Complexity

**Risk**: Testing ReScript components with JavaScript testing tools might be challenging
**Impact**: Low - ReScript compiles to readable JavaScript
**Mitigation**:
- Test compiled JavaScript output
- Use React Testing Library (framework agnostic)
- Write property tests in JavaScript with fast-check
- Document testing patterns

### Risk 6: Regression Bugs

**Risk**: Migrated components might not behave exactly like Elm versions
**Impact**: High - Could break user workflows
**Mitigation**:
- Comprehensive test coverage
- Side-by-side manual testing
- Gradual rollout (one component at a time)
- Keep Elm versions until ReScript versions are verified
- User acceptance testing

## Success Criteria

### Technical Success Criteria

1. ✅ All 7 Elm components migrated to ReScript
2. ✅ All tests passing (unit and property tests)
3. ✅ Test coverage ≥ 80% for migrated components
4. ✅ No Elm dependencies remaining in package.json
5. ✅ Build completes without Elm compilation
6. ✅ Dev server starts and HMR works for ReScript files
7. ✅ All ReScript bindings working correctly
8. ✅ No console errors in browser

### Functional Success Criteria

1. ✅ Login flow works identically to Elm version
2. ✅ Profile editing works identically to Elm version
3. ✅ Admin dashboard displays stats correctly
4. ✅ Roles management works identically to Elm version
5. ✅ All form validations work correctly
6. ✅ All API calls succeed with proper authentication
7. ✅ All toast notifications display correctly
8. ✅ All navigation works correctly

### User Experience Success Criteria

1. ✅ UI looks identical to Elm versions
2. ✅ All interactions feel the same
3. ✅ No performance degradation
4. ✅ No new bugs introduced
5. ✅ Error messages are clear and helpful

### Team Success Criteria

1. ✅ Team comfortable writing ReScript code
2. ✅ ReScript patterns documented
3. ✅ Build and development workflow smooth
4. ✅ Code review process established
5. ✅ Ready to migrate React components to ReScript

## Next Steps After This Migration

Once the Elm → ReScript migration is complete, the team will be ready for Phase 2:

**Phase 2: React → ReScript Migration**

1. **Prioritize Components**: Start with leaf components (no dependencies)
2. **Create More Bindings**: Expand ReScript bindings for all JavaScript libraries
3. **Establish Patterns**: Document ReScript-React patterns for common scenarios
4. **Gradual Migration**: Migrate components incrementally, maintaining app functionality
5. **Type Safety**: Leverage ReScript's type system to catch bugs early
6. **Performance**: Optimize with ReScript's efficient compilation
7. **100% ReScript**: Eventually achieve fully type-safe frontend

This migration establishes the foundation, patterns, and team expertise needed for the larger React → ReScript migration.
