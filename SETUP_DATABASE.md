# Database Setup Guide

## Current Issue

You're seeing 500 errors because the database connection is not configured:

```
Can't reach database server at ep-muddy-smoke-adf1g125-pooler.c-2.us-east-1.aws.neon.tech:5432
```

This is a **template database URL** that doesn't exist. You need to create your own database.

## Quick Fix (5 minutes)

### Step 1: Create a Neon Database

**Option A: Using Neon MCP (Recommended - Easiest)**

If you have the Neon MCP server configured in Cascade:

```bash
# The MCP will create a database for you automatically
# Just ask: "Create a new Neon database for this project"
```

**Option B: Manual Setup (5 minutes)**

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up or log in (free tier available)
3. Click **"Create Project"**
4. **Project Settings**:
   - Name: `event-inventory`
   - Region: Choose closest to you (e.g., `us-east-1`)
   - Postgres version: 17 (or latest)
5. Click **"Create Project"**
6. **Copy the connection string** - it will look like:
   ```
   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Configure Backend Environment

1. **Create `/backend/.env` file**:

```bash
cd backend
cp .env.example .env
# Or create it manually:
touch .env
```

2. **Edit `/backend/.env`** and add:

```env
# Replace with YOUR connection string from Step 1
DATABASE_URL="postgresql://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"

# Stack Auth - get from https://app.stack-auth.com
NEXT_PUBLIC_STACK_PROJECT_ID="your-stack-project-id"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="your-stack-client-key"  
STACK_SECRET_SERVER_KEY="your-stack-secret-key"

# These can stay as-is for development
API_KEY_SECRET="60012c8cd4d41e50fd06c96fea3887c07e04f06a9187d474abb918851571d0b2"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### Step 3: Configure Frontend Environment

1. **Create `/frontend/.env.local` file**:

```bash
cd frontend
touch .env.local
```

2. **Edit `/frontend/.env.local`** and add:

```env
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Stack Auth - same values as backend
NEXT_PUBLIC_STACK_PROJECT_ID="your-stack-project-id"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="your-stack-client-key"
STACK_SECRET_SERVER_KEY="your-stack-secret-key"
```

### Step 4: Setup Database Schema

```bash
# From project root directory
cd /Users/eridhobufferyrollian/Documents/Project/event-inventory

# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Seed database with sample data (optional)
npx prisma db seed
```

### Step 5: Restart Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 6: Test

1. Go to [http://localhost:3000](http://localhost:3000)
2. Sign up / Sign in
3. Create an event
4. No more 500 errors! ✅

## Stack Auth Setup (If Not Done)

If you don't have Stack Auth credentials yet:

1. Go to [https://app.stack-auth.com](https://app.stack-auth.com)
2. Sign up and create a new project
3. Copy these values:
   - **Project ID** → `NEXT_PUBLIC_STACK_PROJECT_ID`
   - **Publishable Client Key** → `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
   - **Secret Server Key** → `STACK_SECRET_SERVER_KEY`
4. In Stack Auth dashboard:
   - Set **App URL**: `http://localhost:3000`
   - Set **API URL**: `http://localhost:3001`

## Verification Commands

```bash
# Check if database is connected
npx prisma db execute --stdin <<< "SELECT 1;"

# View database in browser
npx prisma studio

# Check backend health
curl http://localhost:3001/api/v1/health
```

## Troubleshooting

### Error: "P1001: Can't reach database server"
- Database URL is wrong or database is paused
- Check connection string in `.env`
- Make sure database is active in Neon console

### Error: "relation does not exist"
- You haven't run migrations yet
- Run: `npx prisma migrate dev`

### Error: "Environment variable not found: DATABASE_URL"
- You created `.env` in wrong directory
- Make sure it's in `/backend/.env`
- NOT in project root

### 401 Unauthorized Errors
- Stack Auth not configured properly
- Check all three Stack Auth environment variables
- Verify callback URLs in Stack Auth dashboard

## Quick Reference

### File Locations
```
/backend/.env              ← Backend environment variables
/frontend/.env.local       ← Frontend environment variables
/prisma/schema.prisma      ← Database schema
```

### Important URLs
- Neon Console: https://console.neon.tech
- Stack Auth: https://app.stack-auth.com  
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/docs
- Prisma Studio: http://localhost:5555 (run `npx prisma studio`)
