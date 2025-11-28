---
inclusion: always
---

# Development Workflow

## Getting Started

### Initial Setup
1. Ensure Node.js 22.x is installed
2. Install pnpm globally: `npm install -g pnpm`
3. Install dependencies: `pnpm install` (from root)
4. Set up environment files in both packages
5. Ensure MongoDB is running locally or configure remote connection

### Running the Application

**Full Stack Development:**
```bash
# Terminal 1 - Backend
pnpm --filter docue start

# Terminal 2 - Frontend  
pnpm --filter docue-frontend start
```

Access the app at `http://localhost:3000` (frontend proxies API to backend)

## Code Quality

### Formatting
- Use Biome for code formatting: `pnpm format`
- Format runs on the entire monorepo
- Consider setting up pre-commit hooks for auto-formatting

### Linting
- Backend uses ESLint with babel-eslint parser
- Frontend uses ESLint with React plugin
- Both have `.eslintrc` files with project-specific rules
- Run linting before committing changes

### Testing
- Always run tests before pushing: `pnpm --filter <package> test`
- Backend: Jasmine tests with Supertest for API testing
- Frontend: Jest tests for React, elm-test for Elm
- Maintain test coverage, especially for critical paths

## Common Tasks

### Adding Dependencies
```bash
# Add to backend
pnpm --filter docue add <package>

# Add to frontend
pnpm --filter docue-frontend add <package>

# Add dev dependency
pnpm --filter <package> add -D <package>
```

### Database Migrations
- Migrations are in `backend/migrations/`
- Run automatically on backend start via `prestart` script
- Use the `migrate` package for creating new migrations

### Environment Variables
- Never commit `.env` files
- Always update `.env.example` when adding new variables
- Backend requires: PORT, SECRET, MONGODB_URL, NODE_ENV
- Frontend requires: NODE_ENV

## Debugging

### Backend Debugging
- Morgan logger enabled in development mode
- Check console output for request logs
- Use `debug` package for detailed logging
- MongoDB connection errors are common - check MONGODB_URL

### Frontend Debugging
- React DevTools for component inspection
- Redux DevTools for state debugging
- Check browser console for errors
- Network tab for API request/response inspection

## Git Workflow

### Branch Strategy
- Work on feature branches
- Keep commits focused and atomic
- Write descriptive commit messages
- Test before pushing

### CI/CD
- Travis CI configured for backend
- SemaphoreCI configured for frontend
- Coveralls for code coverage tracking
- Ensure tests pass before merging

## Common Issues

### Port Conflicts
- Backend default: 8000
- Frontend default: 3000
- Change in .env if ports are in use

### MongoDB Connection
- Ensure MongoDB is running
- Check MONGODB_URL format in .env
- Test environment uses mockgoose (in-memory)

### Elm Compilation
- Elm files must be valid before webpack builds
- Run `pnpm --filter docue-frontend test:elm` to check Elm code
- Elm compiler errors are usually very helpful

### Node Version Issues
- Use Node 22.x as specified in backend package.json
- Consider using nvm or volta for Node version management
- Some old packages may need updates for Node 22 compatibility

## Performance Tips

- Use nodemon for backend hot reloading (already configured)
- Frontend has hot module replacement enabled
- Keep bundle sizes reasonable - check webpack output
- Use compression middleware in production (already enabled)
- Consider lazy loading for large React components

## Security Checklist

- [ ] Never commit secrets or API keys
- [ ] Use environment variables for sensitive data
- [ ] Keep dependencies updated for security patches
- [ ] Validate and sanitize all user inputs
- [ ] Use HTTPS in production
- [ ] Keep JWT secrets strong and rotated
- [ ] Review CORS configuration for production
