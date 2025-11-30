# Backend Utility Scripts

This directory contains utility scripts for managing the backend database and users.

## List Users

View all users in the database with their roles.

### Usage

```bash
# Using pnpm (recommended in monorepo)
pnpm --filter backend run list-users

# Or directly with node
node backend/scripts/list-users.js
```

### Output

Shows each user with:
- Email address
- Full name
- Current role and access level
- Login status

## Update User Role

Update a user's role by their email address.

### Usage

```bash
# Using pnpm (recommended in monorepo)
pnpm --filter backend run update-role <email> <role>

# Or directly with node
node backend/scripts/update-user-role.js <email> <role>
```

### Available Roles

- **viewer** (accessLevel 0) - Read-only access
- **staff** (accessLevel 1) - Can edit content
- **admin** (accessLevel 2) - Full system access

### Examples

```bash
# Make a user an admin
pnpm --filter backend run update-role user@example.com admin

# Make a user staff
pnpm --filter backend run update-role user@example.com staff

# Make a user a viewer
pnpm --filter backend run update-role user@example.com viewer
```

### Output

The script will:
1. ✓ Find the user by email
2. ✓ Find the requested role
3. ✓ Show current role (if any)
4. ✓ Update the user's role
5. ✓ Confirm the change

### Requirements

- MongoDB must be running
- `.env` file must be configured with `MONGODB_URL`
- User must exist in the database
- Role must exist in the database (run migrations first)

### Troubleshooting

**User not found:**
- Check the email address is correct
- Verify the user exists in the database

**Role not found:**
- Run migrations: `pnpm --filter backend exec migrate`
- Check available roles in the database

**Database connection error:**
- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env` file
