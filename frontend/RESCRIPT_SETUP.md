# ReScript Setup Guide

This document describes the ReScript infrastructure setup for the Elm to ReScript migration.

## Overview

ReScript is a robustly typed language that compiles to JavaScript with first-class React support. This setup enables us to write type-safe React components that integrate seamlessly with our existing JavaScript/React codebase.

## Installation

ReScript and its dependencies are already installed:

```bash
pnpm add -D rescript @rescript/react @rescript/core
```

## Configuration

### bsconfig.json

The ReScript compiler is configured via `bsconfig.json`:

- **name**: Must match package.json name ("frontend")
- **sources**: Directories containing ReScript code
  - `src/components` - React components
  - `src/bindings` - JavaScript interop bindings
  - `src/features` - Redux slices and types
  - `src/utils` - Utility functions
- **package-specs**: ES6 modules with in-source compilation
- **suffix**: `.res.js` for compiled files
- **jsx**: Version 4 with automatic runtime

### Vite Configuration

Vite is configured to handle ReScript compiled files (`.res.js`):

```javascript
resolve: {
  extensions: ['.js', '.jsx', '.elm', '.res.js'],
}
```

### Jest Configuration

Jest is configured to transform ReScript files and the ReScript runtime:

```javascript
transform: {
  '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  '^.+\\.res\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
},
transformIgnorePatterns: [
  'node_modules/(?!(@rescript)/)',
],
```

## Development Workflow

### Building ReScript

```bash
# One-time build
pnpm res:build

# Watch mode (auto-recompile on changes)
pnpm res:watch

# Clean compiled files
pnpm res:clean
```

### Development Server

Start both ReScript compiler and Vite dev server:

```bash
# Terminal 1: ReScript compiler in watch mode
pnpm res:watch

# Terminal 2: Vite dev server
pnpm start
```

### Production Build

The production build automatically compiles ReScript before bundling:

```bash
pnpm build
# Runs: rescript build && vite build
```

## Hot Module Replacement (HMR)

HMR works seamlessly with ReScript:

1. ReScript compiler watches for `.res` file changes
2. Compiles to `.res.js` files
3. Vite detects `.res.js` changes
4. Browser updates via HMR

**Typical HMR time**: < 100ms for small changes

## File Structure

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
│   │   └── __tests__/
│   ├── features/
│   │   └── [feature]/
│   │       └── [Feature]Types.res # Type definitions
│   └── utils/
├── bsconfig.json                  # ReScript config
└── package.json
```

## Writing ReScript Components

### Basic Component

```rescript
// Component.res
@react.component
let make = () => {
  <div>
    <h1> {React.string("Hello from ReScript!")} </h1>
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

### Using Bindings

```rescript
// Using Redux
let dispatch = Redux.useDispatch()
let user = Redux.useSelector(store => store.auth.user)

// Using React Router
let navigate = ReactRouter.useNavigate()
navigate("/dashboard")

// Using localStorage
LocalStorage.setItem("token", "abc123")
let token = LocalStorage.getItemOption("token")
```

## JavaScript Interop

### Importing ReScript in JavaScript

```javascript
// Import compiled ReScript component
import MyComponent from './MyComponent.res.js';

// Use like any React component
<MyComponent />
```

### Calling JavaScript from ReScript

```rescript
// External binding
@scope("console") @val
external log: string => unit = "log"

// Usage
log("Hello from ReScript!")
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- Component.test.js

# Run with coverage
pnpm test:ci
```

### Test Structure

Tests are written in JavaScript using Jest and React Testing Library:

```javascript
// Component.test.js
import { render, screen } from '@testing-library/react';
import Component from '../Component.res.js';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello from ReScript!')).toBeInTheDocument();
  });
});
```

## Bindings

### Available Bindings

- **Redux.res**: Redux Toolkit (useDispatch, useSelector)
- **ReactRouter.res**: React Router (useNavigate)
- **LocalStorage.res**: Browser localStorage

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

## Common Issues

### ReScript Compilation Errors

- Check syntax in `.res` files
- Ensure all types are properly annotated
- Run `pnpm res:clean && pnpm res:build` to rebuild

### Import Errors

- Verify `.res.js` file exists (run `pnpm res:build`)
- Check import path includes `.res.js` extension
- Ensure Vite is configured to resolve `.res.js` files

### HMR Not Working

- Ensure ReScript compiler is running in watch mode
- Check that Vite dev server is running
- Verify file changes are being detected

## Migration Strategy

1. **Start Simple**: Begin with static components (Landing, NotFound)
2. **Add Complexity**: Progress to forms and API calls
3. **Test Thoroughly**: Write tests for each component
4. **Verify Behavior**: Compare with original Elm versions
5. **Document Patterns**: Record learnings for team

## Resources

- [ReScript Documentation](https://rescript-lang.org/)
- [ReScript-React Documentation](https://rescript-lang.org/docs/react/latest/introduction)
- [ReScript Forum](https://forum.rescript-lang.org/)

## Next Steps

1. Create type definitions for Redux state
2. Implement remaining bindings (Materialize, Fetch)
3. Migrate first component (Landing or NotFound)
4. Establish testing patterns
5. Document component migration process
