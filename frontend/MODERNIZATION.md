# Frontend Modernization Plan

This document outlines a phased approach to modernize the frontend from React 16 + Webpack 4 to modern tooling.

## Current State Analysis

### Major Issues
- **React 16.6** → Need React 18.x (current: 19.x available)
- **Webpack 4** → Need Webpack 5 or migrate to Vite
- **Deprecated packages**: babel-eslint, enzyme, eslint-loader, html-webpack-plugin alpha
- **Old testing**: Enzyme (deprecated) → Need React Testing Library
- **Mixed typing**: Flow + PropTypes → Should consolidate
- **Old Redux**: No Redux Toolkit
- **React Router 4** → Current is v7
- **Superagent** → Consider fetch/axios

### What's Working
- ✅ Elm integration (keep this)
- ✅ Redux architecture (just needs modernization)
- ✅ Component structure
- ✅ Custom webpack config (gives flexibility)

## Recommended Approach: Incremental Modernization

**Don't rewrite everything at once.** Follow this phased approach:

---

## Phase 1: Get It Running (Week 1)

**Goal**: Make the app work with current dependencies, fix critical issues

### Step 1.1: Update Safe Dependencies

```bash
cd frontend

# Update build tools (safe updates)
pnpm add -D \
  dotenv@^17.2.3 \
  fs-extra@^11.3.2 \
  chalk@^4.1.2 \
  resolve@^1.22.11

# Update runtime dependencies (safe)
pnpm add \
  normalize.css@^8.0.1 \
  prop-types@^15.8.1 \
  moment@^2.30.1
```

### Step 1.2: Fix Webpack 4 Compatibility

The current webpack 4 setup should work. Just ensure:

```bash
# Verify webpack builds
pnpm build

# If it fails, check for Node 22 compatibility issues
```

### Step 1.3: Test the App

```bash
# Start dev server
pnpm start

# Should run on http://localhost:3000
```

**Deliverable**: App runs in development mode

---

## Phase 2: Update React to 18 (Week 2)

**Goal**: Modernize React while maintaining compatibility

### Step 2.1: Update React Core

```bash
# Update React to 18.x (not 19 yet - too new)
pnpm add react@^18.3.1 react-dom@^18.3.1

# Update React ecosystem
pnpm add \
  react-redux@^9.2.0 \
  react-router-dom@^6.28.0 \
  react-select@^5.10.2
```

### Step 2.2: Update Root Rendering

Update `src/index.js`:

```javascript
// Old React 16 way
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// New React 18 way
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### Step 2.3: Update React Router

React Router 6 has breaking changes. Update routes:

```javascript
// Old v4 way
<Route path="/users" component={Users} />

// New v6 way
<Route path="/users" element={<Users />} />
```

### Step 2.4: Test Everything

```bash
# Run tests (they might fail - that's expected)
pnpm test

# Manual testing in browser
pnpm start
```

**Deliverable**: React 18 running, routes working

---

## Phase 3: Modernize Testing (Week 3)

**Goal**: Replace Enzyme with React Testing Library

### Step 3.1: Install React Testing Library

```bash
# Remove enzyme
pnpm remove enzyme enzyme-adapter-react-16

# Add React Testing Library
pnpm add -D \
  @testing-library/react@^16.1.0 \
  @testing-library/jest-dom@^6.6.3 \
  @testing-library/user-event@^14.5.2
```

### Step 3.2: Update Test Setup

Update `src/setupTests.js`:

```javascript
import '@testing-library/jest-dom';
```

### Step 3.3: Convert Tests

Convert one test file at a time:

```javascript
// Old Enzyme way
import { shallow } from 'enzyme';
const wrapper = shallow(<Component />);
expect(wrapper.find('.class')).toHaveLength(1);

// New RTL way
import { render, screen } from '@testing-library/react';
render(<Component />);
expect(screen.getByText('text')).toBeInTheDocument();
```

**Deliverable**: Tests using React Testing Library

---

## Phase 4: Update Build Tools (Week 4)

**Goal**: Webpack 4 → Webpack 5 or evaluate Vite

### Option A: Update to Webpack 5 (Safer)

```bash
# Update webpack and loaders
pnpm add -D \
  webpack@^5.103.0 \
  webpack-dev-server@^5.2.2 \
  html-webpack-plugin@^5.6.5 \
  mini-css-extract-plugin@^2.9.4 \
  css-loader@^7.1.2 \
  style-loader@^4.0.0 \
  babel-loader@^10.0.0 \
  terser-webpack-plugin@^5.3.14
```

Update webpack config for v5 changes:
- Remove `node` polyfills config
- Update `optimization` config
- Fix deprecated options

### Option B: Migrate to Vite (Better long-term)

Vite is faster and simpler than Webpack:

```bash
# Install Vite
pnpm add -D vite@^6.0.0 @vitejs/plugin-react@^4.3.4

# Create vite.config.js
```

**Pros of Vite**:
- Much faster dev server
- Simpler configuration
- Better DX
- Native ESM

**Cons**:
- Need to migrate webpack config
- Elm integration needs setup

**Deliverable**: Modern build system working

---

## Phase 5: Modernize State Management (Week 5)

**Goal**: Redux → Redux Toolkit

### Step 5.1: Install Redux Toolkit

```bash
pnpm add @reduxjs/toolkit@^2.5.0
```

### Step 5.2: Convert Store

```javascript
// Old way
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
const store = createStore(reducer, applyMiddleware(thunk));

// New way with RTK
import { configureStore } from '@reduxjs/toolkit';
const store = configureStore({
  reducer: rootReducer,
  // thunk is included by default
});
```

### Step 5.3: Convert Reducers to Slices

```javascript
// Old way
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    default:
      return state;
  }
};

// New way with createSlice
import { createSlice } from '@reduxjs/toolkit';
const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      state.todos.push(action.payload); // Immer makes this safe
    }
  }
});
```

**Deliverable**: Redux Toolkit integrated

---

## Phase 6: Code Quality & DX (Week 6)

**Goal**: Modern linting, formatting, and developer experience

### Step 6.1: Update ESLint

```bash
# Remove old eslint packages
pnpm remove babel-eslint eslint-loader

# Add modern ESLint
pnpm add -D \
  eslint@^9.39.1 \
  @eslint/js@^9.39.1 \
  eslint-plugin-react@^7.37.5 \
  eslint-plugin-react-hooks@^5.1.0
```

### Step 6.2: Remove Flow, Add TypeScript (Optional)

```bash
# Remove Flow
pnpm remove flow-bin @babel/plugin-syntax-flow @babel/plugin-transform-flow-strip-types

# Add TypeScript (optional but recommended)
pnpm add -D typescript@^5.7.3 @types/react@^18.3.18 @types/react-dom@^18.3.5
```

### Step 6.3: Update API Client

```bash
# Replace superagent with axios (more modern)
pnpm remove superagent
pnpm add axios@^1.7.9
```

**Deliverable**: Modern tooling and DX

---

## Phase 7: Optional Enhancements

### Consider These Improvements:

1. **Migrate to Vite** (if not done in Phase 4)
2. **Add TypeScript** gradually
3. **Update styling** (CSS Modules, Tailwind, or styled-components)
4. **Add Storybook** for component development
5. **Improve bundle size** with code splitting
6. **Add error boundaries**
7. **Implement React Suspense** for data fetching

---

## Quick Start: Minimal Updates to Get Running

If you just want to get it running quickly:

```bash
cd frontend

# 1. Update critical dependencies
pnpm add react@^18.3.1 react-dom@^18.3.1

# 2. Update index.js for React 18
# (see Phase 2.2 above)

# 3. Try to start
pnpm start

# 4. Fix errors as they appear
```

---

## Testing Strategy

After each phase:

1. **Manual testing**: Click through all features
2. **Automated tests**: Run `pnpm test`
3. **Build test**: Run `pnpm build`
4. **Elm tests**: Run `pnpm test:elm`

---

## Risk Mitigation

### Create a Branch

```bash
git checkout -b frontend-modernization
```

### Commit After Each Phase

```bash
git add .
git commit -m "Phase 1: Update safe dependencies"
```

### Keep Backend Working

The backend API should continue working throughout. Test with:

```bash
# Terminal 1: Backend
pnpm --filter backend start

# Terminal 2: Frontend
pnpm --filter frontend start
```

---

## Estimated Timeline

- **Phase 1** (Get Running): 1-2 days
- **Phase 2** (React 18): 2-3 days
- **Phase 3** (Testing): 3-5 days
- **Phase 4** (Build Tools): 3-5 days
- **Phase 5** (Redux Toolkit): 2-3 days
- **Phase 6** (Code Quality): 2-3 days

**Total**: 2-3 weeks for full modernization

---

## Alternative: Fresh Start with Vite

If the webpack config is too complex, consider:

```bash
# Create new Vite project
pnpm create vite frontend-new --template react

# Copy src/ components over
# Rewrite build config
# Integrate Elm
```

This might be faster than updating webpack 4 → 5.

---

## Decision Points

### Should you update Webpack or migrate to Vite?

**Update Webpack if**:
- You have complex webpack config
- Elm integration is tricky
- You want minimal changes

**Migrate to Vite if**:
- You want better DX
- You're okay with some rewrite
- You want faster builds

### Should you add TypeScript?

**Yes if**:
- Team knows TypeScript
- You want better type safety
- You're doing major refactoring anyway

**No if**:
- Team prefers JavaScript
- You want minimal changes
- PropTypes are working fine

---

## Next Steps

1. Review this plan with the team
2. Decide on approach (incremental vs fresh start)
3. Create a branch: `git checkout -b frontend-modernization`
4. Start with Phase 1
5. Test thoroughly after each phase
6. Commit frequently

## Questions?

- How much Elm code is there? (affects migration complexity)
- Are there any critical features that can't break?
- What's the timeline/urgency?
- Is the team comfortable with React 18 + modern tooling?
