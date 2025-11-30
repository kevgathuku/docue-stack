# ReScript Guide

Complete guide for ReScript infrastructure, development workflow, and component migration for the Elm to ReScript migration project.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [ReScript Bindings](#rescript-bindings)
- [Writing Components](#writing-components)
- [JavaScript Interop](#javascript-interop)
- [Testing](#testing)
- [Type Safety](#type-safety)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Migration Strategy](#migration-strategy)
- [Resources](#resources)

## Overview

ReScript is a robustly typed language that compiles to JavaScript with first-class React support. It's now fully integrated into the frontend build pipeline, enabling type-safe React components that work seamlessly with our existing JavaScript/React codebase.

**Why ReScript for this migration:**
- Similar ML-family syntax to Elm (easier migration path)
- Compile-time type safety prevents runtime errors
- Excellent React integration with ReScript-React
- Fast compilation and great developer experience
- Avoids double migration (Elm → React → ReScript)

## Installation

ReScript and its dependencies are already installed:

```json
{
  "devDependencies": {
    "rescript": "^12.0.0",
    "@rescript/core": "^1.6.1",
    "@rescript/react": "^0.14.0"
  }
}
```

To install in a new project:

```bash
pnpm add -D rescript @rescript/react @rescript/core
```

## Configuration

### bsconfig.json

The ReScript compiler is configured in `bsconfig.json`:

```json
{
  "name": "frontend",
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
  "suffix": ".res.js",
  "dependencies": [
    "@rescript/react"
  ],
  "jsx": {
    "version": 4,
    "mode": "automatic"
  },
  "warnings": {
    "error": "+101"
  }
}
```

**Key Settings:**
- **sources**: Directories containing ReScript code
  - `src/components` - React components (with subdirs)
  - `src/bindings` - JavaScript interop bindings (no subdirs)
  - `src/features` - Redux slices and types (with subdirs)
  - `src/utils` - Utility functions (no subdirs)
- **in-source compilation**: `.res.js` files generated next to `.res` files
- **ES6 modules**: Compatible with Vite and modern JavaScript
- **suffix**: `.res.js` for compiled files
- **JSX v4**: Uses React's automatic JSX runtime
- **Strict warnings**: Error on unused variables (+101)

### Vite Configuration

Vite is configured to handle ReScript compiled files in `vite.config.js`:

```javascript
export default defineConfig({
  resolve: {
    extensions: ['.js', '.jsx', '.elm', '.res.js'],
  },
  // ... other config
});
```

The `.res.js` extension allows imports like:

```javascript
import Component from './Component.res.js';
```

### Jest Configuration

Jest is configured to transform ReScript files in `jest.config.js`:

```javascript
export default {
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
    '^.+\\.res\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@rescript)/)',
  ],
  // ... other config
};
```

## Development Workflow

### Build Scripts

```bash
# Build ReScript files once
pnpm res:build

# Watch mode - auto-recompile on changes (RECOMMENDED for development)
pnpm res:watch

# Clean compiled files
pnpm res:clean

# Full production build (ReScript + Vite)
pnpm build
```

### Recommended Development Setup

For the best development experience, run these commands in separate terminals:

**Terminal 1**: Start ReScript compiler in watch mode
```bash
cd frontend
pnpm res:watch
```

**Terminal 2**: Start Vite dev server
```bash
cd frontend
pnpm start
```

**Terminal 3** (optional): Run tests in watch mode
```bash
cd frontend
pnpm test -- --watch
```

This setup enables:
- ⚡ Automatic ReScript compilation on file changes (< 100ms)
- 🔥 Hot Module Replacement (HMR) in browser
- ✅ Instant test feedback
- 🎯 Fast development iteration

### Hot Module Replacement (HMR)

HMR works seamlessly with ReScript:

1. Edit a `.res` file
2. ReScript compiler detects change and recompiles (if in watch mode)
3. Vite detects `.res.js` file change
4. Browser updates without full page reload

**Performance:**
- ReScript compilation: < 100ms for small changes
- Vite HMR: < 50ms to update browser
- Total feedback loop: < 150ms

**Note**: Make sure both `res:watch` and `start` are running for optimal HMR experience.

### Development Tips

1. **Always run `res:watch` during development** - This ensures ReScript files are automatically compiled as you edit them.

2. **Check the ReScript compiler output** - The compiler provides helpful error messages and warnings in Terminal 1.

3. **Use the browser console** - ReScript components log errors to the browser console just like JavaScript.

4. **Leverage type inference** - ReScript can infer most types, so you don't need to annotate everything.

5. **Use pattern matching** - ReScript's pattern matching is exhaustive and helps catch bugs at compile time.

6. **Keep bindings simple** - Start with minimal bindings and expand as needed.

### File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── [Component]/
│   │       ├── Component.res      # ReScript component
│   │       ├── Component.res.js   # Compiled (auto-generated)
│   │       └── __tests__/
│   │           └── Component.test.js
│   ├── bindings/
│   │   ├── Redux.res              # Redux Toolkit bindings
│   │   ├── ReactRouter.res        # React Router bindings
│   │   ├── LocalStorage.res       # localStorage bindings
│   │   ├── Materialize.res        # Toast notifications
│   │   ├── Fetch.res              # HTTP client
│   │   └── __tests__/
│   ├── features/
│   │   └── [feature]/
│   │       └── [Feature]Types.res # Type definitions
│   └── utils/
├── bsconfig.json                  # ReScript config
└── package.json
```

## ReScript Bindings

Type-safe bindings for JavaScript libraries are located in `src/bindings/`:

### LocalStorage.res

Provides type-safe access to browser localStorage:

```rescript
// Get item as option
let token = LocalStorage.getItemOption("token")

// Set item
LocalStorage.setItem("user", "john@example.com")

// Remove item
LocalStorage.removeItem("token")

// Clear all
LocalStorage.clear()
```

### Redux.res

Provides type-safe Redux hooks:

```rescript
// Get dispatch function
let dispatch = Redux.useDispatch()

// Select from store
let user = Redux.useSelector(store => store.auth.user)
```

### ReactRouter.res

Provides type-safe navigation:

```rescript
// Get navigate function
let navigate = ReactRouter.useNavigate()

// Navigate to route
navigate("/dashboard")
```

### Materialize.res

Provides type-safe toast notifications:

```rescript
// Show success toast
Materialize.showSuccess("Login successful!")

// Show error toast
Materialize.showError("Invalid credentials")

// Show info toast
Materialize.showInfo("Processing...")
```

### Fetch.res

Provides type-safe HTTP requests:

```rescript
// GET request
let response = await Fetch.get("/api/users", Some(token))
let data = await Fetch.json(response)

// POST request
let body = %raw(`{ username: "john", password: "secret" }`)
let response = await Fetch.post("/api/login", body, None)

// PUT request
let response = await Fetch.put("/api/users/123", body, Some(token))

// DELETE request
let response = await Fetch.delete("/api/users/123", Some(token))

// Check response status
if Fetch.ok(response) {
  // Success
} else {
  // Error
}
```

### Creating New Bindings

```rescript
// MyLibrary.res

// External function binding
@module("my-library")
external myFunction: string => unit = "myFunction"

// External value binding
@module("my-library") @val
external myValue: int = "myValue"

// Usage
myFunction("hello")
let value = myValue
```

## Writing Components

### Basic Component

```rescript
// components/MyComponent.res

@react.component
let make = (~name: string) => {
  <div>
    <h1> {React.string("Hello, " ++ name)} </h1>
  </div>
}

// Export for JavaScript interop
let default = make
```

### Component with State

```rescript
@react.component
let make = () => {
  let (count, setCount) = React.useState(() => 0)
  
  <div>
    <p> {React.string("Count: " ++ Belt.Int.toString(count))} </p>
    <button onClick={_ => setCount(prev => prev + 1)}>
      {React.string("Increment")}
    </button>
  </div>
}

let default = make
```

### Component with Props

```rescript
@react.component
let make = (~title: string, ~count: int, ~onIncrement: unit => unit) => {
  <div>
    <h2> {React.string(title)} </h2>
    <p> {React.string("Count: " ++ Belt.Int.toString(count))} </p>
    <button onClick={_ => onIncrement()}>
      {React.string("Increment")}
    </button>
  </div>
}

let default = make
```

### Component with Redux

```rescript
open Redux
open ReactRouter

@react.component
let make = () => {
  let dispatch = useDispatch()
  let navigate = useNavigate()
  let user = useSelector(store => store.auth.user)
  
  <div>
    {switch user {
    | Some(u) => <p> {React.string("Welcome, " ++ u.name)} </p>
    | None => <p> {React.string("Please log in")} </p>
    }}
  </div>
}

let default = make
```

### Component with Effects

```rescript
@react.component
let make = () => {
  let (data, setData) = React.useState(() => None)
  
  React.useEffect0(() => {
    // Effect runs on mount
    Console.log("Component mounted")
    
    // Cleanup function
    Some(() => Console.log("Component unmounted"))
  })
  
  <div> {React.string("Hello")} </div>
}
```

## JavaScript Interop

### Importing ReScript in JavaScript

```javascript
// Import compiled ReScript component
import MyComponent from './MyComponent.res.js';

// Use like any React component
function App() {
  return <MyComponent name="World" />;
}
```

### Calling JavaScript from ReScript

```rescript
// External binding
@scope("console") @val
external log: string => unit = "log"

// Usage
log("Hello from ReScript!")

// Calling with multiple arguments
@scope("console") @val
external log2: (string, string) => unit = "log"

log2("Hello", "World")
```

### Using Raw JavaScript

```rescript
// Inline JavaScript
let myValue = %raw(`{ foo: "bar" }`)

// Multi-line raw JavaScript
let complexValue = %raw(`
  function() {
    return { x: 1, y: 2 };
  }()
`)
```

## Testing

### Unit Tests

ReScript components are tested with Jest and React Testing Library:

```javascript
// Component.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Component from '../Component.res.js';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component name="Test" />);
    expect(screen.getByText(/Hello, Test/i)).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<Component />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText(/Count: 1/i)).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- Component.test.js

# Run with coverage
pnpm test:ci

# Run in watch mode
pnpm test -- --watch
```

### Test Organization

- Unit tests: `*.test.js` in `__tests__/` directories
- Property-based tests: `*.properties.test.js`
- Co-locate tests with source files

## Type Safety

ReScript provides compile-time type safety:

### No Null/Undefined Errors

Use the `option<'a>` type instead of null/undefined:

```rescript
// Instead of null/undefined
let maybeUser: option<user> = Some({id: "1", name: "John"})

// Pattern match to handle both cases
switch maybeUser {
| Some(user) => Console.log("User: " ++ user.name)
| None => Console.log("No user")
}

// Helper functions
let userName = maybeUser->Belt.Option.getWithDefault({id: "", name: "Guest"})
let hasUser = maybeUser->Belt.Option.isSome
```

### Strong Static Typing

```rescript
// Type inference
let count = 42  // inferred as int
let name = "John"  // inferred as string

// Explicit types
let age: int = 25
let email: string = "john@example.com"

// Custom types
type user = {
  id: string,
  name: string,
  age: int,
}

let john: user = {
  id: "1",
  name: "John",
  age: 25,
}
```

### Pattern Matching

```rescript
// Exhaustive pattern matching
type status = Loading | Success(string) | Error(string)

let message = switch status {
| Loading => "Loading..."
| Success(data) => "Success: " ++ data
| Error(err) => "Error: " ++ err
}

// Compiler ensures all cases are handled
```

### Immutability

```rescript
// Values are immutable by default
let x = 10
// x = 20  // Compile error!

// Use spread to create new records
let user = {id: "1", name: "John"}
let updatedUser = {...user, name: "Jane"}

// Arrays are mutable (use carefully)
let arr = [1, 2, 3]
arr[0] = 10  // This works but avoid when possible
```

## Common Patterns

### Form Handling with useReducer

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
  | UpdateEmail(email) => {...state, email: email}
  | UpdatePassword(password) => {...state, password: password}
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
    // Handle form submission
  }
  
  <form onSubmit={handleSubmit}>
    <input
      type_="email"
      value={state.email}
      onChange={evt => {
        let value = ReactEvent.Form.target(evt)["value"]
        dispatch(UpdateEmail(value))
      }}
    />
    <input
      type_="password"
      value={state.password}
      onChange={evt => {
        let value = ReactEvent.Form.target(evt)["value"]
        dispatch(UpdatePassword(value))
      }}
    />
    <button type_="submit"> {React.string("Submit")} </button>
  </form>
}
```

### API Calls with Effects

```rescript
@react.component
let make = () => {
  let (data, setData) = React.useState(() => None)
  let (loading, setLoading) = React.useState(() => true)
  let (error, setError) = React.useState(() => None)
  
  React.useEffect0(() => {
    let fetchData = async () => {
      try {
        let response = await Fetch.get("/api/data", None)
        
        if Fetch.ok(response) {
          let json = await Fetch.json(response)
          setData(_ => Some(json))
          setLoading(_ => false)
        } else {
          setError(_ => Some("Failed to load data"))
          setLoading(_ => false)
        }
      } catch {
      | _ => {
          setError(_ => Some("Network error"))
          setLoading(_ => false)
        }
      }
    }
    
    fetchData()->ignore
    None
  })
  
  <div>
    {switch (loading, error, data) {
    | (true, _, _) => <p> {React.string("Loading...")} </p>
    | (false, Some(err), _) => <p> {React.string("Error: " ++ err)} </p>
    | (false, None, Some(_)) => <p> {React.string("Data loaded")} </p>
    | (false, None, None) => <p> {React.string("No data")} </p>
    }}
  </div>
}
```

### Conditional Rendering

```rescript
@react.component
let make = (~isLoggedIn: bool, ~user: option<user>) => {
  <div>
    {if isLoggedIn {
      <p> {React.string("Welcome back!")} </p>
    } else {
      <p> {React.string("Please log in")} </p>
    }}
    
    {switch user {
    | Some(u) => <p> {React.string("User: " ++ u.name)} </p>
    | None => React.null
    }}
  </div>
}
```

### List Rendering

```rescript
@react.component
let make = (~items: array<string>) => {
  <ul>
    {items
    ->Belt.Array.mapWithIndex((index, item) => {
      <li key={Belt.Int.toString(index)}>
        {React.string(item)}
      </li>
    })
    ->React.array}
  </ul>
}
```

## Troubleshooting

### ReScript Compiler Errors

**Issue**: "A ReScript build is already running"

**Solution**:
```bash
# Kill the process
pkill -f rescript

# Or clean and rebuild
pnpm res:clean
pnpm res:build
```

### Import Errors

**Issue**: JavaScript can't find the ReScript module

**Solutions**:
1. Check that `.res.js` file exists next to `.res` file
2. Make sure you're importing with `.res.js` extension
3. Verify ReScript compiler ran successfully: `pnpm res:build`
4. Check Vite config includes `.res.js` in resolve extensions

### Type Errors

**Issue**: Type mismatch or missing type annotations

**Solutions**:
- Add explicit type annotations to function parameters
- Use `option<'a>` instead of null/undefined
- Ensure pattern matching covers all cases
- Check that record fields match type definition

### HMR Not Working

**Issue**: Changes not reflected in browser

**Solutions**:
- Ensure ReScript compiler is running in watch mode (`pnpm res:watch`)
- Check that Vite dev server is running (`pnpm start`)
- Verify file changes are being detected (check terminal output)
- Try restarting both processes

### Build Errors

**Issue**: Production build fails

**Solutions**:
- Run `pnpm res:clean` then `pnpm res:build`
- Check for syntax errors in `.res` files
- Ensure all dependencies are installed
- Verify bsconfig.json is valid JSON

## Migration Strategy

### Phase 1: Infrastructure (Complete ✅)
1. ✅ Install ReScript and dependencies
2. ✅ Configure bsconfig.json
3. ✅ Update Vite configuration
4. ✅ Create JavaScript interop bindings
5. ✅ Verify compilation and HMR

### Phase 2: Component Migration (In Progress)
1. **Start Simple**: Begin with static components
   - Landing page (no state, no API)
   - NotFound page (simple error display)

2. **Add Complexity**: Progress to interactive components
   - Login form (form state, Redux, validation)
   - CreateRole form (form state, Redux)

3. **Advanced Features**: Tackle complex components
   - Profile page (view/edit toggle, validation, API)
   - Admin dashboard (API fetching, data display)

4. **Test Thoroughly**: For each component
   - Write unit tests
   - Compare behavior with Elm version
   - Verify UI/UX matches exactly

5. **Document Patterns**: Record learnings
   - Common patterns discovered
   - Challenges and solutions
   - Best practices for team

### Migration Checklist (Per Component)

- [ ] Read and understand Elm source code
- [ ] Create ReScript component file
- [ ] Implement component logic
- [ ] Add type annotations
- [ ] Create bindings if needed
- [ ] Write unit tests
- [ ] Verify compilation
- [ ] Test in browser
- [ ] Compare with Elm version
- [ ] Update imports in JavaScript
- [ ] Document any issues or learnings

## Resources

### Official Documentation
- [ReScript Documentation](https://rescript-lang.org/)
- [ReScript-React Documentation](https://rescript-lang.org/docs/react/latest/introduction)
- [ReScript Syntax Cheatsheet](https://rescript-lang.org/docs/manual/latest/overview)

### Community
- [ReScript Forum](https://forum.rescript-lang.org/)
- [ReScript Discord](https://discord.gg/reasonml)

### Learning Resources
- [ReScript Tutorial](https://rescript-lang.org/docs/manual/latest/introduction)
- [ReScript by Example](https://rescript-lang.org/docs/manual/latest/overview)

### Project Documentation
- `TASK_1_VERIFICATION.md` - Infrastructure verification report
- `.kiro/specs/elm-to-react-migration/` - Migration spec files
  - `requirements.md` - Feature requirements
  - `design.md` - Technical design
  - `tasks.md` - Implementation tasks

## Migrated Components

The following components have been successfully migrated to ReScript:

### Static Components
1. **Landing** (`components/Landing/Landing.res`)
   - Static hero section with CTA button
   - No state or API calls
   - Simplest component pattern

2. **NotFound** (`components/NotFound/NotFound.res`)
   - Static 404 error page
   - Simple error message display

### Form Components with Redux
3. **Login** (`components/Login/Login.res`)
   - Form state with useReducer
   - Redux integration (useDispatch, useSelector)
   - Form validation and submission
   - Toast notifications on success/error
   - Navigation after login

4. **CreateRole** (`components/CreateRole/CreateRole.res`)
   - Form state management
   - Redux action dispatch
   - Navigation on success
   - Error handling with toasts

5. **SignUp** (`components/SignUp/SignUp.res`)
   - Multi-field form (firstname, lastname, email, password)
   - Password validation (matching, length)
   - Redux integration
   - localStorage updates
   - Demonstrates React → ReScript pattern

### API Integration Components
6. **Admin** (`components/Admin/Admin.res`)
   - API fetching with useEffect
   - Stats display (users, documents, roles)
   - Error handling
   - Authenticated API calls

7. **RolesAdmin** (`components/RolesAdmin/RolesAdmin.res`)
   - API fetching for roles list
   - Table rendering with data
   - Materialize tooltip initialization
   - Floating action button

### Complex Components
8. **Profile** (`components/Profile/Profile.res`)
   - View/edit mode toggle
   - Complex form with validation
   - Password validation (match, length > 6)
   - API calls with authentication
   - localStorage updates
   - Multiple useEffect hooks
   - Most complex component pattern

## Component Patterns

### Pattern 1: Static Component
```rescript
// Simple component with no state
@react.component
let make = () => {
  <div>
    <h1> {React.string("Hello World")} </h1>
  </div>
}

let default = make
```

### Pattern 2: Form with Local State
```rescript
// Form with useReducer for state management
type state = { email: string, password: string }
type action = UpdateEmail(string) | UpdatePassword(string)

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
  
  // ... render form
}
```

### Pattern 3: Redux Integration
```rescript
// Component with Redux hooks
open Redux
open ReactRouter

@react.component
let make = () => {
  let dispatch = useDispatch()
  let navigate = useNavigate()
  let user = useSelector(store => store.auth.user)
  
  // ... use Redux state and dispatch
}
```

### Pattern 4: API Calls
```rescript
// Component with API fetching
@react.component
let make = () => {
  let (data, setData) = React.useState(() => None)
  
  React.useEffect0(() => {
    let fetchData = async () => {
      let response = await Fetch.get("/api/data", Some(token))
      if Fetch.ok(response) {
        let json = await Fetch.json(response)
        setData(_ => Some(json))
      }
    }
    fetchData()->ignore
    None
  })
  
  // ... render data
}
```

## Next Steps

The ReScript migration is complete! All 8 components have been migrated from Elm to ReScript.

### Future Enhancements (Optional)

1. **Migrate More React Components**
   - Use patterns from SignUp migration
   - Start with leaf components
   - Progress to more complex components

2. **Improve Type Safety**
   - Add more specific types
   - Create domain-specific types
   - Add JSON decoders for API responses

3. **Optimize Performance**
   - Add React.memo where appropriate
   - Use useMemo for expensive computations
   - Implement code splitting

4. **Enhance Testing**
   - Add more property-based tests
   - Test edge cases
   - Add integration tests

For detailed task information, see `.kiro/specs/elm-to-react-migration/tasks.md`.
