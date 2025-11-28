---
inclusion: always
---

# Modernization Strategy

## Current State

This is a legacy document management system built around 2016-2018 that needs modernization to run on Node 22.x and use current best practices.

### Key Issues to Address

**Backend (Express + MongoDB)**
- Very old dependencies (Mongoose 4.7.9, Express 4.14.0)
- Deprecated packages (bcrypt-nodejs, old migrate package)
- Old callback-based patterns instead of async/await
- Outdated testing setup (Jasmine, old nyc)

**Frontend (React + Elm)**
- React 16.6.x (needs upgrade to 18.x)
- Webpack 4.x (outdated, consider Vite)
- Old Babel setup with deprecated presets
- Enzyme testing (deprecated, use React Testing Library)
- Mixed Flow and PropTypes (inconsistent typing)

## Incremental Modernization Approach

Follow this order to minimize breaking changes:

### Phase 1: Critical Updates (Do First)
1. Update Node.js to 22.x (already done in backend package.json)
2. Update package managers and ensure pnpm workspace works
3. Fix security vulnerabilities in dependencies
4. Update MongoDB/Mongoose to latest stable
5. Replace deprecated packages with modern alternatives

### Phase 2: Backend Modernization
1. Update Express and core middleware to latest 4.x
2. Migrate from callbacks to async/await patterns
3. Update authentication packages (bcrypt, jsonwebtoken)
4. Modernize test setup (consider Vitest or Jest)
5. Add better error handling and validation

### Phase 3: Frontend Modernization
1. Update React to 18.x with new root API
2. Update React Router to v6
3. Migrate from Enzyme to React Testing Library
4. Update webpack to v5 or evaluate Vite migration
5. Consolidate on single type system (TypeScript preferred)
6. Update Redux to Redux Toolkit if keeping Redux

### Phase 4: Optional Enhancements
1. Add TypeScript gradually (start with new files)
2. Improve build performance and bundle size
3. Add modern dev tools (ESLint 9, Prettier)
4. Consider replacing Biome with ESLint + Prettier if needed
5. Update CI/CD pipelines for new Node version

## Breaking Change Management

When making updates:
- Test thoroughly after each major dependency update
- Keep backend and frontend in sync for API contracts
- Update .env.example files when adding new config
- Document any new environment variables or setup steps
- Run both test suites after significant changes
- Check that MongoDB connection still works with new Mongoose

## Compatibility Notes

- Node 22.x requires native ESM or updated CommonJS patterns
- Some old packages may not work with Node 22 (replace them)
- Mongoose 8.x has breaking changes from 4.x (migration guide needed)
- React 18 has new concurrent features (update patterns carefully)
- Webpack 5 has breaking changes from 4 (or switch to Vite)

## When Making Changes

Always:
- Run tests after updates: `pnpm --filter <package> test`
- Check for deprecation warnings in console
- Update package.json scripts if needed
- Keep dependencies in sync between packages where shared
- Document breaking changes in commit messages
- Test the full stack together (backend + frontend)
