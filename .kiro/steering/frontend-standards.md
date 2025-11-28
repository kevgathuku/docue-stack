---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend Standards (React + Elm)

## Technology Stack

- **React**: 16.6.x (needs modernization to 18.x)
- **Elm**: Hybrid architecture with Elm components
- **State Management**: Redux with redux-thunk
- **Routing**: React Router 4.x
- **Build Tool**: Webpack 4.x with custom scripts
- **Testing**: Jest + Enzyme for React, elm-test for Elm
- **Styling**: CSS with normalize.css

## Hybrid Architecture

This app uses both React and Elm:
- React handles the main application shell and most UI
- Elm components are embedded for specific features
- Use `elm-webpack-loader` for Elm integration
- Elm files are compiled as part of the webpack build

## Code Style

- Use modern ES6+ syntax (const/let, arrow functions, destructuring)
- Prefer functional components with hooks over class components
- Use PropTypes for type checking (consider migrating to TypeScript)
- Follow React best practices for component composition
- Keep components small and focused

## State Management

- Use Redux for global state
- Use redux-thunk for async actions
- Keep actions, reducers, and selectors organized
- Avoid prop drilling - use connect() or hooks
- Consider migrating to Redux Toolkit for modernization

## API Communication

- Use superagent for HTTP requests (consider migrating to fetch/axios)
- API calls should be in action creators (thunks)
- Backend proxy configured in package.json: `http://localhost:8000`
- Handle loading states and errors consistently

## Build and Development

- Custom webpack configuration in `config/` and `scripts/`
- Development server with hot reloading
- Production builds optimized with code splitting
- Service worker for PWA capabilities (workbox)

## Modernization Priorities

When updating frontend code:
1. Upgrade React to 18.x with new root API
2. Migrate class components to functional components with hooks
3. Update React Router to v6
4. Consider migrating from Redux to Context API or Zustand
5. Update webpack to v5 or migrate to Vite
6. Replace deprecated packages (enzyme → React Testing Library)
7. Update Babel configuration for modern syntax
8. Consider TypeScript migration for better type safety
9. Update Elm to latest 0.19.x if needed
10. Modernize CSS approach (CSS Modules, Tailwind, or styled-components)

## Testing

- Jest for React unit tests
- elm-test for Elm code
- Prefer React Testing Library over Enzyme for new tests
- Test user interactions, not implementation details
- Maintain test coverage for critical paths
