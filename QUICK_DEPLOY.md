# 🚀 Quick Deploy Guide - PriceRight

**Fastest path to production using Vercel + Supabase + Upstash**

Total Time: ~2 hours

---

## Step 1: Set Up Database (15 minutes)

### Supabase PostgreSQL

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `priceright-production`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
4. Wait for project to be ready (~2 min)
5. Go to **Settings** → **Database**
6. Copy **Connection Pooling** string (Transaction mode)
7. Add `?schema=public` to the end

```
Your DATABASE_URL will look like:
postgresql://postgres.xxx:password@aws-xxx.pooler.supabase.com:6543/postgres?schema=public
```

---

## Step 2: Set Up Redis (10 minutes)

### Upstash Redis

1. Go to https://upstash.com
2. Click "Create Database"
3. Fill in:
   - Name: `priceright-prod`
   - Type: Regional
   - Region: Same as your app hosting
4. Click "Create"
5. Copy **UPSTASH_REDIS_REST_URL** (use this as REDIS_URL)

```
Your REDIS_URL will look like:
rediss://default:xxxxx@amazing-dog-12345.upstash.io:6379
```

---

## Step 3: Generate NextAuth Secret (2 minutes)

```bash
# Run this command:
openssl rand -base64 32

# Copy the output - this is your NEXTAUTH_SECRET
```

---

## Step 4: Deploy to Vercel (30 minutes)

### A. Connect GitHub Repository

1. Go to https://vercel.com
2. Click "Add New Project"
3. Click "Import" next to your repository
4. Leave default settings:
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: (leave default)

### B. Add Environment Variables

**BEFORE clicking Deploy**, add these environment variables:

```bash
# === CRITICAL - REQUIRED ===
DATABASE_URL=<paste from Supabase>
REDIS_URL=<paste from Upstash>
NEXTAUTH_SECRET=<paste from openssl command>
NEXTAUTH_URL=https://your-project.vercel.app
```

**How to add**:
1. Click "Environment Variables" dropdown
2. Add each variable
3. Select "Production", "Preview", and "Development"
4. Click "Add"

### C. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Click "Visit" to see your deployed app

---

## Step 5: Run Database Migration (10 minutes)

### Option A: From Your Local Machine

```bash
# 1. Install dependencies (if not already)
npm install

# 2. Set production database URL temporarily
export DATABASE_URL="<your-supabase-url>"

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. (Optional) Seed demo data
npm run db:seed
```

### Option B: Use Vercel CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Pull environment variables
vercel env pull .env.production

# 5. Run migration
npx prisma migrate deploy
```

---

## Step 6: Set Up Background Workers (30 minutes)

**IMPORTANT**: Vercel doesn't run long-lived processes. Deploy workers to Railway.

### Deploy Workers to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select your repository
5. In **Settings**:
   - Name: `priceright-workers`
   - Build Command: `npm install`
   - Start Command: `npm run jobs:dev`

6. Add Environment Variables (same as Vercel):
   ```bash
   DATABASE_URL=<same as Vercel>
   REDIS_URL=<same as Vercel>
   ```

7. Click "Deploy"

**Alternative**: Use Vercel Cron Jobs (limited functionality)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Then create `/api/cron/sync/route.ts` to trigger jobs manually.

---

## Step 7: Test Your Deployment (15 minutes)

### Quick Smoke Test

1. **Visit your app**: https://your-project.vercel.app

2. **Create an account**:
   - Go to /signup
   - Fill in company name, name, email, password
   - Submit

3. **Login**:
   - Should redirect to /dashboard

4. **Check dashboard**:
   - Should see stats (all zeros initially)
   - Navigation should work

5. **Test API**:
   - Go to /products
   - Click "Add Product"
   - Fill in details
   - Verify it saves

### Check Logs

**Vercel**:
- Go to your project → Deployments → Latest → Functions
- Check for errors

**Railway** (Workers):
- Go to your project → Deployments → Latest
- Check logs for worker activity

---

## Step 8: Update NEXTAUTH_URL (5 minutes)

### If using custom domain:

1. In Vercel → Settings → Domains
2. Add your custom domain
3. Follow DNS instructions
4. Update NEXTAUTH_URL:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

---

## ✅ Deployment Complete!

Your PriceRight app is now live at:
- **App**: https://your-project.vercel.app
- **Database**: Supabase (managed)
- **Redis**: Upstash (managed)
- **Workers**: Railway (managed)

---

## 🔍 Verify Everything Works

Test these features:

- [ ] Signup/Login
- [ ] Dashboard loads
- [ ] Create product
- [ ] View products
- [ ] Pages load without errors
- [ ] API endpoints respond
- [ ] No console errors

---

## 📊 Monitor Your App

### Vercel Dashboard
- Analytics: See traffic and performance
- Logs: Check for errors
- Speed Insights: Monitor page load times

### Supabase Dashboard
- Database: View tables and data
- SQL Editor: Run queries
- Table Editor: Modify data

### Upstash Dashboard
- Redis: Monitor memory usage
- Metrics: See request patterns

---

## 🚨 Common Issues

### "Database connection error"
**Solution**: Check DATABASE_URL has `?schema=public` and uses pooling URL

### "NextAuth callback error"
**Solution**: Ensure NEXTAUTH_URL matches your domain exactly (no trailing slash)

### "Redis connection timeout"
**Solution**: Verify REDIS_URL uses `rediss://` (with 's' for TLS)

### "Background jobs not running"
**Solution**: Check Railway worker logs, ensure it's running

---

## 🎯 Next Steps

1. **Add Monitoring** (optional but recommended):
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Configure Marketplace APIs**:
   - Add marketplace API keys to Vercel environment variables
   - Test marketplace connections

3. **Enable Features**:
   - Set up S3 for file uploads (optional)
   - Configure email service (future feature)
   - Add analytics tracking

4. **Invite Team**:
   - Create additional user accounts
   - Test different user roles

---

## 💰 Cost Estimate

**For small-medium usage** (~1000 users, moderate activity):

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month |
| Upstash | Pay-as-you-go | ~$5-10/month |
| Railway (Workers) | Hobby | $5/month |
| **Total** | | **~$55-60/month** |

**Free tier available** for testing:
- Vercel Hobby (free)
- Supabase Free tier
- Upstash Free tier
- Railway Free trial

---

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed guide
- Review logs in Vercel/Railway
- Check database in Supabase
- Open GitHub issue for bugs

---

**🎉 Congratulations! Your app is live!** 🎉
