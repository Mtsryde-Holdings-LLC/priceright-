# PriceRight - Production Deployment Guide

> Complete checklist and guide for deploying PriceRight to production

**Last Updated**: 2025-11-18
**Application**: PriceRight Multi-Tenant SaaS
**Stack**: Next.js 14, PostgreSQL, Redis, Prisma

---

## 📋 Pre-Deployment Checklist

### ✅ Required Infrastructure

#### 1. **Database - PostgreSQL** (CRITICAL)
- [ ] PostgreSQL 14+ database provisioned
- [ ] Connection pooling configured (recommended: PgBouncer or Prisma Accelerate)
- [ ] SSL/TLS enabled for connections
- [ ] Backup strategy in place (daily automated backups)
- [ ] Database URL obtained

**Recommended Providers**:
- ✅ Supabase (includes connection pooling, backups)
- ✅ Neon (serverless PostgreSQL)
- ✅ Railway (easy setup)
- ✅ AWS RDS (enterprise)
- ✅ DigitalOcean Managed Database

#### 2. **Redis** (CRITICAL - for job queue)
- [ ] Redis 6+ instance provisioned
- [ ] TLS/SSL enabled
- [ ] Persistence enabled (AOF or RDB)
- [ ] Memory limit set (minimum 512MB)
- [ ] Redis URL obtained

**Recommended Providers**:
- ✅ Upstash (serverless Redis, perfect for Vercel)
- ✅ Redis Cloud
- ✅ AWS ElastiCache
- ✅ Railway

#### 3. **File Storage** (OPTIONAL - for brand approval docs)
- [ ] S3-compatible storage provisioned
- [ ] Bucket created
- [ ] CORS configured
- [ ] Access keys generated

**Recommended Providers**:
- ✅ AWS S3
- ✅ Cloudflare R2 (S3-compatible, cheaper)
- ✅ Vercel Blob Storage
- ✅ DigitalOcean Spaces

#### 4. **Application Hosting**
- [ ] Hosting platform selected
- [ ] Domain configured (if custom domain)
- [ ] SSL certificate (automatic with most platforms)

**Recommended Platforms**:
- ✅ **Vercel** (easiest, best Next.js support) ⭐ RECOMMENDED
- ✅ AWS Amplify
- ✅ Railway (includes DB + Redis)
- ✅ Render
- ✅ DigitalOcean App Platform

---

## 🔐 Environment Variables Configuration

### Critical Variables (MUST BE SET)

```bash
# === DATABASE (REQUIRED) ===
DATABASE_URL="postgresql://user:password@host:5432/priceright?schema=public&sslmode=require"
# Note: Add ?sslmode=require for production
# If using connection pooling, you might need a separate DIRECT_URL

# === NEXTAUTH (REQUIRED) ===
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="<GENERATE_STRONG_SECRET>"
# Generate with: openssl rand -base64 32

# === REDIS (REQUIRED FOR BACKGROUND JOBS) ===
REDIS_URL="rediss://default:password@host:6379"
# Note: Use rediss:// (with 's') for TLS
```

### Optional but Recommended

```bash
# === FILE STORAGE (for brand approval uploads) ===
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="priceright-production"
S3_REGION="us-east-1"
S3_ENDPOINT="https://s3.amazonaws.com"

# === MONITORING ===
SENTRY_DSN="https://your-sentry-dsn"
```

### Marketplace API Keys (Add as needed)

```bash
# Amazon
AMAZON_CLIENT_ID="..."
AMAZON_CLIENT_SECRET="..."
AMAZON_REFRESH_TOKEN="..."

# Walmart
WALMART_CLIENT_ID="..."
WALMART_CLIENT_SECRET="..."

# Shopify
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."

# WooCommerce
WOOCOMMERCE_CONSUMER_KEY="..."
WOOCOMMERCE_CONSUMER_SECRET="..."

# Facebook
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."

# TikTok
TIKTOK_APP_KEY="..."
TIKTOK_APP_SECRET="..."

# WhatsApp
WHATSAPP_BUSINESS_ID="..."
WHATSAPP_ACCESS_TOKEN="..."
```

---

## 🚀 Deployment Steps

### Option 1: Deploy to Vercel (Recommended - Easiest)

#### Step 1: Prepare Infrastructure

1. **Set up PostgreSQL**
   ```bash
   # Using Supabase (recommended)
   - Sign up at https://supabase.com
   - Create new project
   - Go to Project Settings > Database
   - Copy Connection String (Pooling mode)
   ```

2. **Set up Redis**
   ```bash
   # Using Upstash (recommended for Vercel)
   - Sign up at https://upstash.com
   - Create Redis database
   - Copy UPSTASH_REDIS_REST_URL
   ```

#### Step 2: Deploy to Vercel

1. **Connect Repository**
   ```bash
   # Option A: Via Vercel Dashboard
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository

   # Option B: Via CLI
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables**
   - In Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables listed above
   - **IMPORTANT**: Set for Production, Preview, and Development

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Initial Deployment**
   ```bash
   # Vercel will automatically deploy on git push
   git push origin main

   # Or manual deploy
   vercel --prod
   ```

#### Step 3: Database Migration

```bash
# After first deployment, run migrations
# Option A: Locally (connect to prod DB)
DATABASE_URL="<prod-url>" npx prisma migrate deploy

# Option B: Via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option C: Add to build command in vercel.json (not recommended for first deploy)
```

#### Step 4: Start Background Workers

**IMPORTANT**: Next.js on Vercel doesn't run long-lived processes. You need to deploy workers separately.

**Options**:

1. **Vercel Cron Jobs** (Limited - only for scheduled tasks)
   Create `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/inventory-sync",
         "schedule": "*/5 * * * *"
       },
       {
         "path": "/api/cron/repricing",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

2. **Deploy Workers to Railway/Render** (Recommended)
   - Create separate service for `npm run jobs:dev`
   - Use same DATABASE_URL and REDIS_URL
   - Keep workers running 24/7

3. **AWS Lambda/Background Functions**
   - Deploy workers as serverless functions
   - Trigger via EventBridge/Scheduler

---

### Option 2: Deploy to Railway (Includes Everything)

Railway provides database, Redis, and app hosting in one place.

#### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

#### Step 2: Add Services

```bash
# Add PostgreSQL
railway add --plugin postgresql

# Add Redis
railway add --plugin redis

# Variables are auto-configured!
```

#### Step 3: Deploy

```bash
# Link to GitHub (recommended)
railway link

# Or deploy directly
railway up
```

#### Step 4: Configure Domain

```bash
railway domain
```

Railway automatically:
- ✅ Sets up DATABASE_URL
- ✅ Sets up REDIS_URL
- ✅ Provides SSL certificates
- ✅ Handles environment variables

**Add remaining env vars**:
```bash
railway variables set NEXTAUTH_SECRET="<your-secret>"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
```

---

## 📊 Database Setup

### Initial Migration

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. (Optional) Seed demo data
npm run db:seed
```

### Connection Pooling (IMPORTANT)

For serverless environments (Vercel, AWS Lambda), use connection pooling:

**Option 1: Prisma Accelerate**
```bash
# Sign up: https://www.prisma.io/data-platform/accelerate
# Get connection string
# Update DATABASE_URL
```

**Option 2: PgBouncer**
```bash
# Supabase includes this automatically
# Just use the "Connection Pooling" URL
```

**Option 3: Supabase Pooler**
```
# Already included in Supabase connection string
```

---

## 🔒 Security Checklist

### Pre-Production Security

- [ ] **Change all default secrets**
  - [ ] Generate strong NEXTAUTH_SECRET
  - [ ] Use environment variables for all API keys
  - [ ] Never commit .env files

- [ ] **Database Security**
  - [ ] Enable SSL/TLS connections
  - [ ] Use strong passwords
  - [ ] Restrict IP access (if possible)
  - [ ] Enable audit logging

- [ ] **API Security**
  - [ ] Enable rate limiting (see below)
  - [ ] Configure CORS properly
  - [ ] Validate all user inputs
  - [ ] Use parameterized queries (Prisma does this)

- [ ] **Authentication**
  - [ ] NEXTAUTH_SECRET is strong (32+ chars)
  - [ ] HTTPS enforced on production domain
  - [ ] Session expiry configured

- [ ] **File Upload Security**
  - [ ] File type validation
  - [ ] Size limits enforced
  - [ ] Virus scanning (if handling user uploads)
  - [ ] Signed URLs for private files

### Add Rate Limiting

Create `src/middleware.ts` enhancement:

```typescript
// Add to existing middleware
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

// In middleware function
const { success } = await ratelimit.limit(ip)
if (!success) {
  return new Response("Too Many Requests", { status: 429 })
}
```

---

## 🏗️ Production Architecture

### Recommended Setup

```
┌─────────────────────────────────────────┐
│         Vercel (Next.js App)            │
│  - API Routes                           │
│  - React Pages                          │
│  - Static Assets (CDN)                  │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │PostgreSQL│    │   Redis    │
    │(Supabase)│    │ (Upstash)  │
    └──────────┘    └────────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼─────────┐
         │  Worker Service  │
         │   (Railway)      │
         │  - Jobs/Queues   │
         └──────────────────┘
```

---

## 🔍 Monitoring & Observability

### Essential Monitoring

1. **Error Tracking - Sentry**
   ```bash
   npm install @sentry/nextjs

   # Configure Sentry
   npx @sentry/wizard@latest -i nextjs

   # Add SENTRY_DSN to environment variables
   ```

2. **Application Performance**
   - Vercel Analytics (built-in)
   - New Relic (advanced)
   - DataDog (enterprise)

3. **Database Monitoring**
   - Supabase Dashboard (built-in)
   - PgAnalyze
   - Prisma Studio (development only)

4. **Uptime Monitoring**
   - UptimeRobot (free)
   - Pingdom
   - Better Uptime

### Logging

```typescript
// Use structured logging
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
})

// In production, send to logging service
// - Logtail
// - Papertrail
// - AWS CloudWatch
```

---

## 📈 Scaling Considerations

### When to Scale

Monitor these metrics:
- Response time > 500ms
- Database connections > 80% of pool
- Redis memory > 80%
- Worker queue depth > 100

### Scaling Strategies

1. **Database**
   - Enable connection pooling
   - Add read replicas
   - Consider partitioning by tenantId
   - Use database indexes (already in schema)

2. **Application**
   - Vercel auto-scales (up to plan limits)
   - Upgrade Vercel plan for more bandwidth
   - Enable Edge functions where possible

3. **Workers**
   - Horizontal scaling (multiple worker instances)
   - Separate workers by job type
   - Use job priorities

4. **Redis**
   - Upgrade to larger instance
   - Enable Redis clustering (for very large scale)

---

## 🧪 Pre-Launch Testing

### Test Checklist

- [ ] **Authentication Flow**
  - [ ] Signup works
  - [ ] Login works
  - [ ] Logout works
  - [ ] Password validation
  - [ ] Session persistence

- [ ] **Multi-Tenancy**
  - [ ] Create multiple tenants
  - [ ] Verify data isolation
  - [ ] Test with different roles (OWNER, ADMIN, MEMBER)

- [ ] **API Endpoints**
  - [ ] Test all CRUD operations
  - [ ] Verify authorization
  - [ ] Test error handling

- [ ] **Background Jobs**
  - [ ] Inventory sync runs
  - [ ] Repricing calculations work
  - [ ] Jobs retry on failure

- [ ] **Database**
  - [ ] Migrations applied
  - [ ] Indexes created
  - [ ] Backup/restore tested

### Load Testing

```bash
# Use k6 for load testing
npm install -g k6

# Create test script
cat > loadtest.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('https://your-app.com/api/products');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

# Run test
k6 run loadtest.js
```

---

## 🚨 Common Deployment Issues & Solutions

### Issue 1: Build Fails - Prisma Client Not Generated

**Solution**:
```bash
# Add to package.json scripts
"postinstall": "prisma generate"
```

### Issue 2: Database Connection Fails

**Solutions**:
- Check SSL mode (`?sslmode=require`)
- Verify IP allowlist (add Vercel IPs)
- Use connection pooling
- Check connection string format

### Issue 3: Redis Connection Timeout

**Solutions**:
- Use TLS (`rediss://` instead of `redis://`)
- Check firewall rules
- Verify Redis is accessible from hosting platform

### Issue 4: Background Jobs Not Running

**Solutions**:
- Deploy workers separately (Vercel doesn't run long-lived processes)
- Use Railway/Render for worker service
- Or use Vercel Cron for scheduled tasks only

### Issue 5: NextAuth Callback Error

**Solution**:
```bash
# Ensure NEXTAUTH_URL matches exactly
NEXTAUTH_URL="https://yourdomain.com"  # No trailing slash!
```

---

## 📝 Post-Deployment Tasks

### Immediately After Deploy

1. **Verify Core Functionality**
   - [ ] Can create an account
   - [ ] Can login
   - [ ] Can create a product
   - [ ] Can connect a marketplace
   - [ ] Dashboard loads

2. **Check Monitoring**
   - [ ] Sentry receiving events
   - [ ] Logs appearing in dashboard
   - [ ] Metrics being tracked

3. **Database Health**
   - [ ] Run `EXPLAIN ANALYZE` on key queries
   - [ ] Check slow query logs
   - [ ] Verify indexes are used

4. **Security Scan**
   - [ ] Run security audit: `npm audit`
   - [ ] Check for exposed secrets
   - [ ] Verify HTTPS enforcement

### Week 1 Tasks

- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Check database growth
- [ ] Review user feedback
- [ ] Test backup restoration

### Ongoing Maintenance

- [ ] Weekly: Review logs and errors
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and optimize database
- [ ] Quarterly: Load testing
- [ ] Quarterly: Security audit

---

## 🎯 Deployment Timeline

### Minimal Setup (2-4 hours)
1. Set up Supabase database (15 min)
2. Set up Upstash Redis (10 min)
3. Deploy to Vercel (30 min)
4. Configure environment variables (30 min)
5. Run database migrations (15 min)
6. Test basic functionality (1 hour)

### Production-Ready Setup (1-2 days)
- Add monitoring (Sentry) - 2 hours
- Set up worker service (Railway) - 2 hours
- Configure file storage (S3) - 1 hour
- Add rate limiting - 1 hour
- Load testing - 2 hours
- Security hardening - 3 hours
- Documentation - 2 hours

---

## 📞 Support & Resources

### Documentation
- Next.js Deployment: https://nextjs.org/docs/deployment
- Prisma Production: https://www.prisma.io/docs/guides/deployment
- Vercel Docs: https://vercel.com/docs

### Community
- Next.js Discord
- Prisma Slack
- PriceRight GitHub Issues

---

## ✅ Final Pre-Launch Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Error tracking active
- [ ] Rate limiting enabled
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Rollback plan documented

---

**Ready to Deploy?** Follow the steps above and your PriceRight application will be production-ready! 🚀
