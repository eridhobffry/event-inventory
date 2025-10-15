# Deployment Guide

This guide covers deploying EventForge Inventory to production.

## Architecture Overview

- **Frontend**: Next.js 15 app → Vercel
- **Backend**: Fastify API → Railway/Render/Fly.io
- **Database**: Neon PostgreSQL (already serverless)
- **Auth**: Neon Auth (Stack Auth) - Cloud-hosted

## Prerequisites Checklist

Before deploying, ensure you have:

- ✅ Neon database created (we have: `plain-glitter-25894813`)
- ✅ Stack Auth project created at https://app.stack-auth.com
- ✅ Vercel account for frontend deployment
- ✅ Railway/Render account for backend deployment
- ✅ All environment variables documented

## Part 1: Database Setup (Neon)

### Already Complete!

Your database is ready:

- **Project ID**: `plain-glitter-25894813`
- **Connection String**: Already in `env.template`
- **pgvector**: Extension enabled

### Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional for production)
npx prisma db seed
```

## Part 2: Backend Deployment

### Option A: Railway (Recommended)

1. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create New Project**:

   ```bash
   cd backend
   railway init
   ```

3. **Add Environment Variables**:

   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set API_KEY_SECRET="your-random-secret-32-chars"
   railway variables set PORT="3001"
   railway variables set NEXT_PUBLIC_STACK_PROJECT_ID="your-stack-id"
   railway variables set NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="your-key"
   railway variables set STACK_SECRET_SERVER_KEY="your-secret"
   railway variables set CORS_ORIGIN="https://your-frontend.vercel.app"
   ```

4. **Deploy**:

   ```bash
   railway up
   ```

5. **Get URL**:
   ```bash
   railway domain
   # Copy the URL (e.g., https://your-app.up.railway.app)
   ```

### Option B: Render

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

   - **Name**: `eventforge-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Instance Type**: Free (or paid for production)

5. **Add Environment Variables**:

   - `DATABASE_URL`
   - `API_KEY_SECRET`
   - `PORT` = `3001`
   - Stack Auth variables
   - `CORS_ORIGIN`

6. Click **"Create Web Service"**

7. **Copy the URL** (e.g., https://eventforge-api.onrender.com)

### Option C: Fly.io

1. **Install flyctl**:

   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Create fly.toml**:

   ```toml
   app = "eventforge-api"

   [build]
     [build.args]
       NODE_VERSION = "22"

   [env]
     PORT = "3001"

   [[services]]
     internal_port = 3001
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

3. **Set Secrets**:

   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set API_KEY_SECRET="..."
   # ... other variables
   ```

4. **Deploy**:
   ```bash
   cd backend
   fly launch
   fly deploy
   ```

## Part 3: Frontend Deployment (Vercel)

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:

   - **Framework Preset**: Next.js
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Add Environment Variables**:

   **Required**:

   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app` (from Part 2)
   - `NEXT_PUBLIC_STACK_PROJECT_ID` = (from Stack Auth dashboard)
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` = (from Stack Auth)
   - `STACK_SECRET_SERVER_KEY` = (from Stack Auth - mark as secret)

6. Click **"Deploy"**

7. **Note your URL** (e.g., https://eventforge-inventory.vercel.app)

### Method 2: Vercel CLI

```bash
cd app
npm install -g vercel
vercel login
vercel
# Follow prompts and add environment variables
```

## Part 4: Stack Auth Configuration

1. Go to https://app.stack-auth.com
2. Select your project
3. **Update URLs**:

   - **App URL**: `https://your-app.vercel.app`
   - **API URL**: `https://your-backend.railway.app`
   - **Allowed Callback URLs**: `https://your-app.vercel.app/handler/callback`
   - **Allowed Sign-out URLs**: `https://your-app.vercel.app`

4. Save changes

## Part 5: Update CORS

Update backend CORS to allow your frontend:

```bash
# On Railway/Render
railway variables set CORS_ORIGIN="https://your-app.vercel.app"

# Or in Render dashboard
CORS_ORIGIN=https://your-app.vercel.app
```

## Part 6: Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-backend.railway.app/api/v1/health
# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 2. API Docs

Visit: `https://your-backend.railway.app/docs`

### 3. Frontend

Visit: `https://your-app.vercel.app`

Try:

- Sign up for an account
- Create an item
- Run an audit
- Generate an API key

### 4. MCP Integration

1. Create API key in Settings
2. Connect Claude Desktop:
   - URL: `https://your-backend.railway.app/mcp`
   - Header: `x-api-key`
   - Key: [your generated key]

## Environment Variables Reference

### Backend Variables

| Variable                                   | Required | Example                 | Description                     |
| ------------------------------------------ | -------- | ----------------------- | ------------------------------- |
| `DATABASE_URL`                             | ✅       | `postgresql://...`      | Neon database connection string |
| `API_KEY_SECRET`                           | ✅       | `32-char-random-string` | Secret for API key encryption   |
| `PORT`                                     | ❌       | `3001`                  | Server port (default: 3001)     |
| `NEXT_PUBLIC_STACK_PROJECT_ID`             | ✅       | `proj_...`              | Stack Auth project ID           |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | ✅       | `pk_...`                | Stack Auth client key           |
| `STACK_SECRET_SERVER_KEY`                  | ✅       | `sk_...`                | Stack Auth secret key           |
| `CORS_ORIGIN`                              | ❌       | `https://app.com`       | Allowed frontend origin         |
| `LOG_LEVEL`                                | ❌       | `info`                  | Logging level                   |

### Frontend Variables

| Variable                                   | Required | Example           | Description                     |
| ------------------------------------------ | -------- | ----------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL`                      | ✅       | `https://api.com` | Backend API URL                 |
| `NEXT_PUBLIC_STACK_PROJECT_ID`             | ✅       | `proj_...`        | Stack Auth project ID           |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | ✅       | `pk_...`          | Stack Auth client key           |
| `STACK_SECRET_SERVER_KEY`                  | ✅       | `sk_...`          | Stack Auth secret (server-side) |

## Troubleshooting

### Issue: "CORS Error" in browser

**Solution**: Update `CORS_ORIGIN` in backend to match frontend URL

### Issue: "Unauthorized" when creating items

**Solution**:

1. Verify Stack Auth credentials are correct
2. Check Stack Auth dashboard has correct callback URLs
3. Clear browser cookies and sign in again

### Issue: Database connection failed

**Solution**:

1. Verify `DATABASE_URL` is correct
2. Check Neon database is not paused (wake it up)
3. Ensure connection string has `?sslmode=require`

### Issue: API key creation fails

**Solution**:

1. Check `API_KEY_SECRET` is set and is at least 32 characters
2. Verify user is authenticated
3. Check backend logs for specific error

### Issue: MCP connection fails

**Solution**:

1. Verify backend URL ends with `/mcp`
2. Check API key is valid and active
3. Ensure backend allows the request origin

## Monitoring & Maintenance

### Logs

**Railway**:

```bash
railway logs
```

**Render**: Check logs in dashboard

**Vercel**: Check logs in deployment page

### Database

Monitor via Neon dashboard:

- Query performance
- Storage usage
- Active connections

### Backups

Neon provides automatic backups. To create manual backup:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Scaling

**Frontend (Vercel)**:

- Auto-scales automatically
- No configuration needed

**Backend**:

- **Railway**: Upgrade instance size
- **Render**: Upgrade to paid tier for auto-scaling
- **Fly.io**: Scale with `fly scale count 2`

**Database (Neon)**:

- Upgrade to higher compute tier
- Enable autoscaling in Neon dashboard

## Cost Estimates

### Free Tier (Good for MVP)

- **Frontend**: Vercel - Free (100GB bandwidth)
- **Backend**: Railway - Free ($5/month credit) or Render Free
- **Database**: Neon - Free (0.5GB storage, 300 hours compute)
- **Auth**: Stack Auth - Free (up to 1,000 MAU)
- **Total**: $0/month

### Production Tier (Recommended)

- **Frontend**: Vercel Pro - $20/month
- **Backend**: Railway - ~$15/month or Render Standard - $25/month
- **Database**: Neon - ~$20/month (1GB storage, unlimited compute)
- **Auth**: Stack Auth - ~$20/month (up to 10,000 MAU)
- **Total**: ~$75-85/month

## Security Checklist

- [ ] All API keys stored as secrets (not in code)
- [ ] CORS configured to specific origin (not `*`)
- [ ] HTTPS enabled on all endpoints
- [ ] Stack Auth callback URLs whitelisted
- [ ] Database connection uses SSL
- [ ] Rate limiting enabled (default in code)
- [ ] Helmet security headers enabled (default in code)
- [ ] API keys regularly rotated
- [ ] Database backups scheduled
- [ ] Error messages don't leak sensitive info

## Next Steps After Deployment

1. **Set up monitoring**: Add error tracking (e.g., Sentry)
2. **Configure analytics**: Track usage patterns
3. **Create documentation**: User guides for your team
4. **Test MCP**: Verify Claude integration works
5. **Backup strategy**: Automate database backups
6. **CI/CD**: Set up automated deployments on git push

---

**Need Help?** Check the [README.md](./README.md) or [MCP_GUIDE.md](./docs/MCP_GUIDE.md)
