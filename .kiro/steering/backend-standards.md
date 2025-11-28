---
inclusion: fileMatch
fileMatchPattern: "backend/**/*"
---

# Backend Standards (Express + MongoDB)

## Technology Stack

- **Runtime**: Node.js 22.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jasmine with Supertest for API testing
- **Auth**: JWT (jsonwebtoken) with bcrypt-nodejs

## Code Style

- Use modern ES6+ syntax (const/let, arrow functions, async/await)
- Prefer async/await over callbacks and raw promises
- Use destructuring where appropriate
- Follow single quotes convention for strings

## Architecture Patterns

- **Routes**: Define in `server/routes/`
- **Controllers**: Business logic in `server/controllers/`
- **Models**: Mongoose schemas in `server/models/`
- **Config**: Configuration files in `server/config/`
- **Migrations**: Database migrations in `migrations/`

## Error Handling

- Use Express error middleware pattern
- Return consistent JSON error responses: `{ error: message }`
- Handle 404s explicitly
- Avoid sending responses after headers are sent

## Security Best Practices

- Store secrets in environment variables (never commit `.env`)
- Use JWT for authentication with `x-access-token` header
- Enable CORS with explicit allowed headers
- Use compression middleware for responses
- Validate and sanitize all user inputs

## Modernization Priorities

When updating backend code:
1. Replace deprecated packages (bcrypt-nodejs → bcrypt)
2. Update Mongoose to latest 8.x (currently on 4.7.9)
3. Migrate from old callback patterns to async/await
4. Update Express to latest 4.x
5. Replace deprecated middleware patterns
6. Update test framework if needed (Jasmine → Jest/Vitest)
7. Add TypeScript types gradually if beneficial
