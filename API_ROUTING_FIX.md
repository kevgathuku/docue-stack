# API Routing Fix for Vercel

## The Problem

Frontend worked but backend API routes returned 404 errors.

## Root Cause

Vercel's modern API expects serverless functions to be in the `api/` directory at the project root. When you use:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/index.js" }
  ]
}
```

Vercel doesn't automatically recognize `backend/index.js` as a serverless function because:
1. It's not in the conventional `api/` directory
2. Modern Vercel API uses convention-based routing
3. Files in `api/` are automatically treated as serverless functions

## The Solution

Created a thin wrapper at `api/index.js`:

```javascript
// Vercel serverless function wrapper for Express backend
module.exports = require('../backend/index.js');
```

This:
- ✅ Places a file in Vercel's expected `api/` directory
- ✅ Re-exports your existing Express app
- ✅ Allows Vercel to recognize it as a serverless function
- ✅ No changes needed to your backend code

## Updated Configuration

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    }
  ]
}
```

**How it works:**
1. Request comes in: `https://your-app.vercel.app/api/users/login`
2. Vercel matches rewrite rule: `/api/:path*`
3. Routes to: `/api` (which is `api/index.js`)
4. `api/index.js` loads: `backend/index.js` (your Express app)
5. Express handles: `/api/users/login` route

## File Structure

```
project-root/
├── api/
│   └── index.js          # Vercel serverless function wrapper
├── backend/
│   ├── index.js          # Your Express app (unchanged)
│   ├── server/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── models/
│   └── package.json
├── frontend/
│   ├── build/            # Vite output
│   └── package.json
└── vercel.json
```

## Why This Approach?

### Alternative 1: Move backend to api/ ❌
```
api/
├── index.js
├── server/
├── controllers/
└── ...
```
**Problem:** Breaks your monorepo structure, requires major refactoring

### Alternative 2: Use legacy builds ❌
```json
{
  "version": 2,
  "builds": [
    { "src": "backend/index.js", "use": "@vercel/node" }
  ]
}
```
**Problem:** Mixes paradigms, more complex, legacy API

### Alternative 3: Wrapper (Current) ✅
```
api/index.js → backend/index.js
```
**Benefits:**
- ✅ Minimal change (one file)
- ✅ Keeps monorepo structure
- ✅ Uses modern Vercel API
- ✅ No backend code changes

## Testing

After deployment:

```bash
# Test healthcheck
curl https://your-app.vercel.app/api/health
# Should return: {"status":"ok","timestamp":"...","service":"docue-api"}

# Test authentication
curl https://your-app.vercel.app/api/roles
# Should return: 403 (no token - means API is working)

# Test frontend
open https://your-app.vercel.app
# Should load React app
```

## How Vercel Processes Requests

```
Request: /api/users/login
    ↓
Vercel checks rewrites
    ↓
Matches: /api/:path* → /api
    ↓
Looks for: api/index.js
    ↓
Executes: api/index.js (serverless function)
    ↓
Loads: backend/index.js (Express app)
    ↓
Express routes: /api/users/login
    ↓
Response: JSON data
```

## Key Concepts

1. **Convention over configuration**: Vercel expects `api/` directory
2. **Serverless functions**: Each file in `api/` becomes a function
3. **Express compatibility**: Express apps work as serverless functions when exported
4. **Monorepo support**: Wrapper pattern preserves your structure

## Troubleshooting

### API still returns 404

**Check:**
- `api/index.js` exists at project root
- `api/index.js` exports the Express app
- Vercel build logs show "Serverless Functions" section
- Rewrite rule matches your API paths

### API works but routes are wrong

**Check:**
- Express routes start with `/api/`
- Rewrite source pattern matches your URLs
- Backend `server/routes/` files are included in deployment

### Function timeout errors

**Check:**
- Database connection is fast
- MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Queries are optimized
- Consider increasing `maxDuration` (requires paid plan)

## Environment Variables

Make sure these are set in Vercel dashboard:

```bash
MONGODB_URL=mongodb+srv://...
SECRET=your-jwt-secret
NODE_ENV=production
```

## Next Steps

1. ✅ Deploy and test all API endpoints
2. ✅ Verify frontend can communicate with backend
3. ✅ Test authentication flow
4. ✅ Check Vercel function logs for any errors
5. ✅ Monitor function execution times

---

**Status:** Backend API routing is now properly configured for Vercel! 🚀
