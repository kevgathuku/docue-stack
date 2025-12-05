# Vercel Deployment Guide

This guide covers deploying both the backend API and frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   pnpm add -g vercel
   ```
3. **MongoDB Atlas**: Set up a hosted MongoDB instance at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

## Deployment Options

### Option 1: Separate Deployments (Recommended)

Deploy backend and frontend as separate Vercel projects.

#### Deploy Backend API

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `MONGODB_URL` - Your MongoDB Atlas connection string
   - `SECRET` - JWT secret key (generate a strong random string)
   - `NODE_ENV` - Set to `production`

4. Note the deployment URL (e.g., `https://your-api.vercel.app`)

#### Deploy Frontend

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Update API endpoint in your frontend code to point to the backend URL

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Set environment variables:
   - `REACT_APP_API_URL` - Your backend API URL from step 4 above
   - `NODE_ENV` - Set to `production`

### Option 2: Monorepo Deployment

Deploy both from the root directory (more complex setup).

1. From the root directory:
   ```bash
   vercel
   ```

2. Configure environment variables in Vercel dashboard for both projects

## Environment Variables Setup

### Backend Environment Variables

In Vercel Dashboard → Your Backend Project → Settings → Environment Variables:

```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/docue?retryWrites=true&w=majority
SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
PORT=8000
```

### Frontend Environment Variables

In Vercel Dashboard → Your Frontend Project → Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-backend-api.vercel.app
NODE_ENV=production
```

## MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. Create a database user:
   - Database Access → Add New Database User
   - Choose password authentication
   - Save username and password

3. Whitelist Vercel IPs:
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` (allow from anywhere) for Vercel serverless functions
   - Note: This is safe with proper authentication

4. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `docue` or your preferred database name

## Important Backend Changes for Vercel

Vercel uses serverless functions, so you need to export the Express app properly.

The current `backend/index.js` already exports the app correctly:

```javascript
// Export the app object
module.exports = app;
```

This works with Vercel's `@vercel/node` builder.

## Frontend Build Configuration

Update `frontend/package.json` to ensure proper build:

```json
{
  "scripts": {
    "build": "node scripts/build.js",
    "vercel-build": "pnpm build"
  }
}
```

## Deployment Commands

### Deploy to Production

```bash
# Backend
cd backend
vercel --prod

# Frontend
cd frontend
vercel --prod
```

### Deploy to Preview (Staging)

```bash
# Backend
cd backend
vercel

# Frontend
cd frontend
vercel
```

## Post-Deployment

### Test the API

```bash
# Health check (public endpoint - no authentication required)
curl https://your-backend-api.vercel.app/api/health

# Should return: {"status":"ok","timestamp":"...","service":"docue-api"}

# Test authenticated endpoint
curl https://your-backend-api.vercel.app/api/roles

# Should return 403 (no token) - this means API authentication is working
```

### Test the Frontend

Visit your frontend URL: `https://your-frontend.vercel.app`

## Continuous Deployment

### GitHub Integration

1. Go to Vercel Dashboard
2. Import your GitHub repository
3. Configure:
   - **Backend**: Set root directory to `backend`
   - **Frontend**: Set root directory to `frontend`
4. Add environment variables
5. Deploy

Vercel will automatically deploy on every push to your repository.

### Branch Deployments

- `main` branch → Production deployment
- Other branches → Preview deployments

## Troubleshooting

### Backend Issues

**Problem**: "Cannot connect to MongoDB"
- **Solution**: Check MongoDB Atlas connection string and IP whitelist

**Problem**: "Module not found"
- **Solution**: Ensure all dependencies are in `dependencies`, not `devDependencies`

**Problem**: "Function timeout"
- **Solution**: Vercel free tier has 10s timeout. Optimize slow queries.

### Frontend Issues

**Problem**: "API calls failing"
- **Solution**: Update API URL to point to Vercel backend URL

**Problem**: "Build fails"
- **Solution**: Check build logs in Vercel dashboard. May need to update webpack config.

**Problem**: "Elm compilation fails"
- **Solution**: Ensure `elm` binary is available. May need custom build script.

## Cost Considerations

### Vercel Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function execution
- Automatic HTTPS
- Preview deployments

### Vercel Pro ($20/month):
- More bandwidth
- Longer function execution time
- Team collaboration features

### MongoDB Atlas Free Tier:
- 512MB storage
- Shared cluster
- Good for development/small projects

## Security Checklist

- [ ] Use strong JWT secret (32+ random characters)
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS (automatic with Vercel)
- [ ] Regularly rotate secrets
- [ ] Monitor usage in Vercel dashboard

## Custom Domains

### Add Custom Domain

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `api.yourdomain.com` for backend)
3. Update DNS records as instructed
4. Vercel automatically provisions SSL certificate

### Recommended Setup

- Backend: `api.yourdomain.com`
- Frontend: `yourdomain.com` or `app.yourdomain.com`

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → Your Project → Analytics

### Logs

View real-time logs:
```bash
vercel logs <deployment-url>
```

Or view in Vercel Dashboard → Your Project → Deployments → View Logs

## Alternative: Deploy Frontend to Vercel, Backend Elsewhere

If you prefer, you can:
- Deploy frontend to Vercel (great for static sites)
- Deploy backend to:
  - Railway.app (easier for Node.js apps with persistent connections)
  - Render.com (free tier available)
  - Heroku (paid)
  - DigitalOcean App Platform

This gives you more flexibility for the backend (WebSockets, long-running processes, etc.)

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
