# Database Seeding on Vercel

Vercel doesn't provide console access, but you have several options to seed your database.

## Option 1: One-Time Seed Script (Recommended) ✅

Create a temporary API endpoint that seeds the database, then remove it after use.

### Step 1: Create Seed Endpoint

Create `api/seed.js`:

```javascript
const Roles = require('../backend/server/models/roles');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  // Security: Only allow in development or with secret key
  const seedSecret = process.env.SEED_SECRET;
  const providedSecret = req.query.secret;

  if (!seedSecret || providedSecret !== seedSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URL);
    }

    // Seed roles
    const titles = Object.keys(Roles.ACCESS_LEVEL);
    const tasks = titles.map((title) => {
      const update = {
        title: title,
        accessLevel: Roles.ACCESS_LEVEL[title],
      };
      return Roles.findOneAndUpdate({ title: title }, update, { upsert: true });
    });

    await Promise.all(tasks);

    res.json({
      success: true,
      message: 'Roles seeded successfully',
      roles: titles,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

### Step 2: Add Environment Variable

In Vercel Dashboard → Settings → Environment Variables:
```
SEED_SECRET=your-random-secret-key-here
```

### Step 3: Run Seed

```bash
curl "https://your-app.vercel.app/api/seed?secret=your-random-secret-key-here"
```

### Step 4: Remove Endpoint

After seeding, delete `api/seed.js` and redeploy for security.

---

## Option 2: Auto-Seed on First Request ✅

Modify your backend to automatically seed roles if they don't exist.

### Update `backend/index.js`:

Add this before your routes:

```javascript
// Auto-seed roles on first request
let rolesSeeded = false;

app.use(async (req, res, next) => {
  if (!rolesSeeded) {
    try {
      const Roles = require('./server/models/roles');
      const count = await Roles.countDocuments();
      
      if (count === 0) {
        console.log('Seeding roles...');
        const titles = Object.keys(Roles.ACCESS_LEVEL);
        const tasks = titles.map((title) => {
          const update = {
            title: title,
            accessLevel: Roles.ACCESS_LEVEL[title],
          };
          return Roles.findOneAndUpdate({ title: title }, update, { upsert: true });
        });
        await Promise.all(tasks);
        console.log('Roles seeded successfully');
      }
      rolesSeeded = true;
    } catch (error) {
      console.error('Auto-seed error:', error);
    }
  }
  next();
});
```

**Pros:**
- ✅ Automatic - no manual intervention
- ✅ Safe - only seeds if empty
- ✅ No security concerns

**Cons:**
- ⚠️ Adds latency to first request
- ⚠️ Runs on every cold start (but checks quickly)

---

## Option 3: Run Migration Locally Against Production DB

Connect to your production MongoDB from your local machine and run migrations.

### Step 1: Get Production MongoDB URL

From Vercel Dashboard → Settings → Environment Variables, copy `MONGODB_URL`

### Step 2: Run Migration Locally

```bash
cd backend

# Set production MongoDB URL temporarily
export MONGODB_URL="mongodb+srv://..."
export NODE_ENV=production

# Run migration
./node_modules/.bin/migrate up
```

**Pros:**
- ✅ Uses existing migration system
- ✅ Full control
- ✅ Can run any script

**Cons:**
- ⚠️ Requires local setup
- ⚠️ Need production credentials locally

---

## Option 4: MongoDB Atlas Data Import

Use MongoDB Atlas UI to import data directly.

### Step 1: Create JSON File

Create `roles-seed.json`:

```json
[
  { "title": "admin", "accessLevel": 1 },
  { "title": "viewer", "accessLevel": 2 },
  { "title": "editor", "accessLevel": 3 }
]
```

### Step 2: Import via Atlas

1. Go to MongoDB Atlas → Your Cluster
2. Click "Collections"
3. Select your database → "roles" collection
4. Click "Insert Document" → "Import JSON"
5. Upload `roles-seed.json`

**Pros:**
- ✅ No code needed
- ✅ Visual interface
- ✅ Safe

**Cons:**
- ⚠️ Manual process
- ⚠️ Need to know exact data structure

---

## Option 5: Vercel Build Hook Script

Run a script during Vercel build that seeds the database.

### Create `scripts/vercel-seed.js`:

```javascript
const mongoose = require('mongoose');
const Roles = require('../server/models/roles');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    const titles = Object.keys(Roles.ACCESS_LEVEL);
    const tasks = titles.map((title) => {
      const update = {
        title: title,
        accessLevel: Roles.ACCESS_LEVEL[title],
      };
      return Roles.findOneAndUpdate({ title: title }, update, { upsert: true });
    });

    await Promise.all(tasks);
    console.log('Roles seeded successfully');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
```

### Update `vercel.json`:

```json
{
  "buildCommand": "cd frontend && pnpm build && cd ../backend && node scripts/vercel-seed.js",
  ...
}
```

**Pros:**
- ✅ Runs automatically on deploy
- ✅ No manual intervention

**Cons:**
- ⚠️ Runs on every deploy (use upsert to avoid duplicates)
- ⚠️ Increases build time

---

## Recommended Approach

**For initial setup:** Use **Option 1** (One-time seed endpoint)
- Quick and secure
- Remove after use
- No code changes to main app

**For ongoing:** Use **Option 2** (Auto-seed on first request)
- Automatic
- Safe
- No maintenance

## Implementation: Option 2 (Auto-Seed)

This is the simplest long-term solution. Here's the complete implementation:

### File: `backend/server/middleware/autoSeed.js`

```javascript
const Roles = require('../models/roles');

let seeded = false;

async function autoSeedRoles(req, res, next) {
  if (seeded) {
    return next();
  }

  try {
    const count = await Roles.countDocuments();
    
    if (count === 0) {
      console.log('[Auto-Seed] Seeding roles...');
      const titles = Object.keys(Roles.ACCESS_LEVEL);
      const tasks = titles.map((title) => {
        const update = {
          title: title,
          accessLevel: Roles.ACCESS_LEVEL[title],
        };
        return Roles.findOneAndUpdate({ title: title }, update, { upsert: true });
      });
      
      await Promise.all(tasks);
      console.log('[Auto-Seed] Roles seeded successfully:', titles);
    }
    
    seeded = true;
  } catch (error) {
    console.error('[Auto-Seed] Error:', error);
    // Don't block the request if seeding fails
  }
  
  next();
}

module.exports = autoSeedRoles;
```

### Update `backend/index.js`:

Add after database connection and before routes:

```javascript
// Auto-seed roles if database is empty
app.use(require('./server/middleware/autoSeed'));

// Your existing routes
app.use(require('./server/routes'));
```

### Benefits:

- ✅ Zero configuration
- ✅ Works on first request
- ✅ Safe (checks before seeding)
- ✅ No security concerns
- ✅ No manual intervention needed

---

## Quick Start: One-Time Seed

If you just need to seed now, here's the fastest way:

1. **Create `api/seed.js`** (see Option 1 above)
2. **Add `SEED_SECRET` to Vercel** environment variables
3. **Deploy**
4. **Run:** `curl "https://your-app.vercel.app/api/seed?secret=YOUR_SECRET"`
5. **Delete `api/seed.js`** and redeploy

Done! 🎉
