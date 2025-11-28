---
inclusion: always
---

# Monorepo Structure and Conventions

This is a pnpm workspace monorepo with two main packages:

## Workspace Structure

- **Root**: Workspace configuration and shared tooling (Biome for formatting)
- **backend/**: Express.js + MongoDB API server (Node 22.x)
- **frontend/**: React + Elm hybrid application

## Package Manager

- Use `pnpm` for all package management operations
- Workspace packages are defined in `pnpm-workspace.yaml`
- Run commands in specific workspaces using `pnpm --filter <package-name> <command>`

## Key Commands

### Backend
- `pnpm --filter backend start` - Start backend dev server with nodemon
- `pnpm --filter backend test` - Run backend tests with Jasmine
- Backend runs on port 8000 by default

### Frontend
- `pnpm --filter frontend start` - Start frontend dev server
- `pnpm --filter frontend test` - Run frontend tests with Jest
- `pnpm --filter frontend test:elm` - Run Elm tests
- Frontend runs on port 3000 and proxies API requests to localhost:8000

### Root
- `pnpm format` - Format all code using Biome

## Environment Configuration

Both packages require `.env` files:
- Copy `.env.example` to `.env` in each package
- Backend requires: `PORT`, `SECRET`, `MONGODB_URL`, `NODE_ENV`
- Frontend requires: `NODE_ENV`
