# Running Migrations on Vercel

## The Challenge

**Problem:** `postinstall` scripts run during Vercel's **build phase**, but:
- ❌ Database connection may not be available during build
- ❌ Build happens in a temporary container (not the runtime environment)
- ❌ Serverless functions are stateless (no persistent "start")
- ❌ Each function invocation is isolated

**Key insight:** Vercel builds are separate from runtime execution.

## Why `postinstall` Is Problematic

```
Vercel Build Process:
1. Install dependencies (postinstall runs here)
   ↓
   [No database connection yet]
   ↓
2. Build frontend/backend
   ↓
3. Deploy to CDN/Functions
   ↓
4. Runtime: Function invoked
   ↓
   [Database connection available now]
```

If migrations run in step 1, they'll fail because MongoDB isn't accessible during build.

## Solutions Comparison

| Approach | When Runs | Pros | Cons |
|----------|-----------|------|------|
| postinstall | Build time | Automatic | No DB access |
| postbuild | Build time | After build | Still no DB |
| Auto-seed middleware | Runtime | Has DB access | Runs on cold start |
| Build hook script | Build time | Automatic | Needs DB during build |
| Manual seed endpoint | On-demand | Full control | Manual step |

## Solution 1: Runtime Migration (Recommended) ✅

Run migrations on first request, similar to the auto-seed we implemented.

### Create `backend/server/middleware/autoMigrate.js`:

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let migrated = false;

async function autoMigrate(req, res, next) {
  if (migrated) {
    return next();
  }

  try {
    console.log('[Auto-Migrate] Running migrations...');
    
    // Run migrate command
    const { stdout, stderr } = await execAsync(
      './node_modules/.bin/migrate up',
      { cwd: __dirname + '/../..' }
    );
    
    if (stdout) console.log('[Auto-Migrate]', stdout);
    if (stderr) console.error('[Auto-Migrate]', stderr);
    
    console.log('[Auto-Migrate] Migrations completed');
    migrated = true;
  } catch (error) {
    console.error('[Auto-Migrate] Error:', error);
    // Don't block the request if migration fails
  }

  next();
}

module.exports = autoMigrate;
```

### Update `backend/index.js`:

```javascript
// Auto-run migrations on first request (for Vercel)
if (isProduction) {
  app.use(require('./server/middleware/autoMigrate'));
}

// Auto-seed roles if database is empty
app.use(require('./server/middleware/autoSeed'));
```

**Pros:**
- ✅ Has database access
- ✅ Automatic
- ✅ Works with existing migrations

**Cons:**
- ⚠️ Adds latency to first request
- ⚠️ Runs on every cold start (but migrations are idempotent)

---

## Solution 2: Vercel Build Command with DB Access

If your MongoDB is accessible during build (some setups allow this), you can run migrations in the build command.

### Update `vercel.json`:

```json
{
  "buildCommand": "cd backend && pnpm install && ./node_modules/.bin/migrate up && cd ../frontend && pnpm build",
  "outputDirectory": "frontend/build",
  "installCommand": "pnpm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Pros:**
- ✅ Runs before deployment
- ✅ Uses existing migration system

**Cons:**
- ⚠️ Requires DB accessible during build
- ⚠️ Increases build time
- ⚠️ May fail if DB is unreachable

---

## Solution 3: Combine Auto-Seed with Migration Logic

Instead of running the `migrate` tool, incorporate migration logic directly into auto-seed.

### Create `backend/server/middleware/autoSetup.js`:

```javascript
const Roles = require('../models/roles');
const mongoose = require('mongoose');

let setupComplete = false;

async function autoSetup(req, res, next) {
  if (setupComplete) {
    return next();
  }

  try {
    console.log('[Auto-Setup] Initializing database...');

    // Ensure database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('[Auto-Setup] Waiting for database connection...');
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    }

    // Migration 1: Seed roles
    const roleCount = await Roles.countDocuments();
    if (roleCount === 0) {
      console.log('[Auto-Setup] Seeding roles...');
      const titles = Object.keys(Roles.ACCESS_LEVEL);
      const tasks = titles.map((title) => {
        const update = {
          title: title,
          accessLevel: Roles.ACCESS_LEVEL[title],
        };
        return Roles.findOneAndUpdate({ title: title }, update, { upsert: true });
      });
      await Promise.all(tasks);
      console.log('[Auto-Setup] Roles seeded:', titles);
    }

    // Add more migrations here as needed
    // Migration 2: ...
    // Migration 3: ...

    setupComplete = true;
    console.log('[Auto-Setup] Database initialization complete');
  } catch (error) {
    console.error('[Auto-Setup] Error:', error);
    // Don't block the request
  }

  next();
}

module.exports = autoSetup;
```

### Update `backend/index.js`:

```javascript
// Auto-setup database on first request (replaces autoSeed)
app.use(require('./server/middleware/autoSetup'));
```

**Pros:**
- ✅ Simple and reliable
- ✅ Has database access
- ✅ Easy to add new migrations
- ✅ No external dependencies

**Cons:**
- ⚠️ Need to manually port migrations
- ⚠️ Doesn't use existing migrate tool

---

## Solution 4: Manual Seed Endpoint (Current Best Practice)

Create a protected endpoint to run migrations on-demand.

### Create `api/migrate.js`:

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = async (req, res) => {
  // Security: Require secret
  const migrateSecret = process.env.MIGRATE_SECRET;
  const providedSecret = req.query.secret;

  if (!migrateSecret || providedSecret !== migrateSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Running migrations...');
    
    const { stdout, stderr } = await execAsync(
      'cd backend && ./node_modules/.bin/migrate up',
      { cwd: process.cwd() }
    );

    res.json({
      success: true,
      stdout: stdout,
      stderr: stderr,
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    });
  }
};
```

### Usage:

1. Add `MIGRATE_SECRET` to Vercel environment variables
2. Deploy
3. Run: `curl "https://your-app.vercel.app/api/migrate?secret=YOUR_SECRET"`
4. (Optional) Delete `api/migrate.js` after use

**Pros:**
- ✅ Full control
- ✅ Uses existing migrate tool
- ✅ Secure
- ✅ Can run anytime

**Cons:**
- ⚠️ Manual step required
- ⚠️ Need to remember to run after deploy

---

## Recommended Approach for Your Project

Given that you only have one migration (add-roles), I recommend **Solution 3** (Combined Auto-Setup):

### Why?

1. **Simple**: One middleware handles everything
2. **Reliable**: Runs at runtime with DB access
3. **Automatic**: No manual steps
4. **Maintainable**: Easy to add new setup tasks
5. **Fast**: Quick check on subsequent requests

### Implementation

I'll create this for you now...

---

## About `postinstall` Specifically

You **can** add a `postinstall` script, but it needs to handle the build-time environment:

### `backend/package.json`:

```json
{
  "scripts": {
    "postinstall": "node scripts/postinstall-migrate.js"
  }
}
```

### `backend/scripts/postinstall-migrate.js`:

```javascript
// Only run migrations if we have database access
// (This will fail during Vercel build, which is expected)

const isVercelBuild = process.env.VERCEL === '1' && !process.env.VERCEL_ENV;

if (isVercelBuild) {
  console.log('Skipping migrations during Vercel build');
  process.exit(0);
}

// Run migrations
const { execSync } = require('child_process');

try {
  console.log('Running migrations...');
  execSync('./node_modules/.bin/migrate up', { stdio: 'inherit' });
  console.log('Migrations complete');
} catch (error) {
  console.error('Migration failed:', error.message);
  // Don't fail the build
  process.exit(0);
}
```

**This approach:**
- ✅ Works locally (runs migrations after install)
- ✅ Skips during Vercel build (no DB access)
- ⚠️ Still need runtime solution for Vercel

---

## Final Recommendation

**Use the auto-setup middleware we already implemented** (`backend/server/middleware/autoSeed.js`).

It's:
- Already working
- Simple
- Automatic
- Production-ready

For future migrations, you can:
1. Add them to the auto-setup middleware, OR
2. Use the manual migrate endpoint when needed

The `postinstall` approach adds complexity without solving the core issue: Vercel needs runtime database access for migrations.
