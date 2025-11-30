---
inclusion: fileMatch
fileMatchPattern: "backend/**/*"
---

# Backend Standards (Express + MongoDB)

## Technology Stack

- **Runtime**: Node.js 22.x
- **Framework**: Express.js 4.x (latest)
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jasmine with Supertest for API testing
- **Auth**: JWT (jsonwebtoken) with bcrypt

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

## Modernization Status

**Completed:**
- ✅ Updated Express to 4.21.2
- ✅ Replaced bcrypt-nodejs with bcrypt 5.1.1
- ✅ Removed body-parser (using Express built-in)
- ✅ Updated ESLint to 9.x with flat config
- ✅ Updated core dependencies (morgan, compression, cors, etc.)
- ✅ Fixed dotenv.load() → dotenv.config()

**Remaining:**
1. Update Mongoose to latest 8.x (currently on 4.7.9)
2. Migrate from old callback patterns to async/await
3. Update test framework if needed (Jasmine → Jest/Vitest)
4. Add TypeScript types gradually if beneficial (Note: Frontend uses ReScript for type safety)

## Password Hashing

- Use `bcrypt` package (not bcrypt-nodejs)
- Hash passwords with 10 salt rounds: `bcrypt.hash(password, 10, callback)`
- Compare passwords: `bcrypt.compareSync(password, hash)`
- Always hash in pre-save hooks, only when password is modified

## API Response Standards

### Session Endpoint

The `/api/users/session` endpoint MUST return proper boolean values:

```javascript
// ✅ CORRECT - Return boolean
res.json({ loggedIn: false })
res.json({ loggedIn: true, user: userObject })

// ❌ WRONG - Never return strings
res.json({ loggedIn: 'false' })  // String "false" is truthy in JavaScript!
res.json({ loggedIn: user.loggedIn.toString() })
```

**Why This Matters**: The frontend relies on boolean values for authentication logic. Returning strings causes infinite redirect loops because `"false"` is truthy in JavaScript.

**Test Coverage**: All session endpoint tests verify `typeof loggedIn === 'boolean'`
