# 🚀 Production Deployment Checklist

**Project**: PriceRight
**Date**: _____________
**Deployed By**: _____________

---

## ✅ Infrastructure Setup

### Database (PostgreSQL)
- [ ] PostgreSQL 14+ instance provisioned
- [ ] Connection pooling enabled
- [ ] SSL/TLS enabled
- [ ] Automated backups configured
- [ ] Database URL saved in password manager
- [ ] Test connection successful

**Provider**: ________________ (Supabase/Neon/Railway/AWS RDS)
**Connection String**: (saved securely) ✓

---

### Redis
- [ ] Redis 6+ instance provisioned
- [ ] TLS/SSL enabled
- [ ] Persistence (AOF/RDB) enabled
- [ ] Memory limit set (min 512MB)
- [ ] Redis URL saved in password manager
- [ ] Test connection successful

**Provider**: ________________ (Upstash/Railway/AWS ElastiCache)
**Connection String**: (saved securely) ✓

---

### Application Hosting
- [ ] Hosting platform account created
- [ ] Repository connected
- [ ] Build configuration set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

**Platform**: ________________ (Vercel/Railway/AWS/Other)
**URL**: ________________

---

### File Storage (Optional)
- [ ] S3-compatible storage provisioned
- [ ] Bucket created
- [ ] CORS configured
- [ ] Access keys generated
- [ ] Keys saved in password manager

**Provider**: ________________ (AWS S3/Cloudflare R2/Vercel Blob)
**Bucket Name**: ________________

---

## 🔐 Environment Variables

### Critical Variables (MUST SET)

- [ ] `DATABASE_URL` set
- [ ] `NEXTAUTH_URL` set (matches deployment URL)
- [ ] `NEXTAUTH_SECRET` generated and set (32+ characters)
- [ ] `REDIS_URL` set (with TLS if required)

**NEXTAUTH_SECRET Generated**:
```bash
# Command used: openssl rand -base64 32
Date generated: ________________
```

---

### Optional Variables (Set as needed)

- [ ] `S3_ACCESS_KEY_ID`
- [ ] `S3_SECRET_ACCESS_KEY`
- [ ] `S3_BUCKET_NAME`
- [ ] `S3_REGION`
- [ ] `S3_ENDPOINT`
- [ ] `SENTRY_DSN` (monitoring)

**Marketplace API Keys** (check which ones added):
- [ ] Amazon (`AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_REFRESH_TOKEN`)
- [ ] Walmart (`WALMART_CLIENT_ID`, `WALMART_CLIENT_SECRET`)
- [ ] Shopify (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`)
- [ ] WooCommerce (`WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`)
- [ ] Facebook (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`)
- [ ] TikTok (`TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`)
- [ ] WhatsApp (`WHATSAPP_BUSINESS_ID`, `WHATSAPP_ACCESS_TOKEN`)

---

## 🗄️ Database Migration

- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Migrations deployed (`npx prisma migrate deploy`)
- [ ] Migrations verified (check Supabase table editor)
- [ ] Test data seeded (optional - `npm run db:seed`)
- [ ] Database backup taken before first migration

**Migration Date**: ________________
**Tables Created**: _____ (should be 20+ tables)

---

## 🔄 Background Workers

- [ ] Worker service deployed (Railway/Render/separate server)
- [ ] Same DATABASE_URL and REDIS_URL configured
- [ ] Worker confirmed running (`npm run jobs:dev`)
- [ ] Logs show worker activity
- [ ] Test job processed successfully

**Alternative**: Vercel Cron Jobs
- [ ] `vercel.json` cron configuration added
- [ ] Cron API routes created
- [ ] Cron jobs verified in Vercel dashboard

**Worker Service URL**: ________________

---

## 🛡️ Security

### Secrets Management
- [ ] All secrets stored in password manager
- [ ] `.env` file NOT committed to git
- [ ] `.gitignore` includes `.env`
- [ ] No hardcoded secrets in code
- [ ] Environment variables set in hosting platform

### Application Security
- [ ] HTTPS enforced (check URL redirects)
- [ ] Security headers configured (see `vercel.json`)
- [ ] CORS configured properly
- [ ] Rate limiting considered (add if needed)
- [ ] SQL injection protected (Prisma handles this)

### Database Security
- [ ] Database password is strong (20+ characters)
- [ ] IP restrictions configured (if available)
- [ ] SSL mode required in connection string
- [ ] Non-root database user created (if applicable)

---

## 📊 Monitoring & Logging

### Error Tracking
- [ ] Sentry configured (optional but recommended)
- [ ] `SENTRY_DSN` environment variable set
- [ ] Test error sent to Sentry
- [ ] Alert notifications configured

**Sentry Project**: ________________

### Application Monitoring
- [ ] Vercel Analytics enabled (if using Vercel)
- [ ] Health check endpoint tested (`/api/health`)
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)

**Uptime Monitor URL**: ________________

### Logging
- [ ] Application logs visible in hosting dashboard
- [ ] Error logs capture stack traces
- [ ] Log retention configured

---

## 🧪 Testing

### Pre-Deployment Testing
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors in development

### Post-Deployment Smoke Tests
- [ ] Homepage loads (/)
- [ ] Login page loads (/login)
- [ ] Signup page loads (/signup)
- [ ] Can create account
- [ ] Can login successfully
- [ ] Dashboard loads after login
- [ ] Can create a product
- [ ] Can view products list
- [ ] API endpoints respond
- [ ] Health check returns healthy (`/api/health`)

**Test Account Created**:
- Email: ________________
- Password: (saved securely) ✓

### Functional Testing
- [ ] Multi-tenancy works (data isolated between accounts)
- [ ] Role-based access control works (OWNER/ADMIN/MEMBER)
- [ ] Marketplace connection can be added
- [ ] Background job executed successfully
- [ ] File upload works (if S3 configured)

---

## 🚀 Deployment

### Build Configuration
- [ ] Build command correct (`next build`)
- [ ] Node version specified (18+)
- [ ] Build succeeds on platform
- [ ] No build warnings (critical ones)

**Build Time**: ________ minutes
**Build Status**: ✅ Success / ❌ Failed

### Deployment Verification
- [ ] Deployment completed successfully
- [ ] Application accessible at deployment URL
- [ ] SSL certificate valid (green padlock)
- [ ] Custom domain working (if configured)
- [ ] API routes responding

**Deployment URL**: ________________
**Deployment Time**: ________________

---

## 📈 Performance

### Initial Benchmarks
- [ ] Homepage load time: ________ ms
- [ ] API response time: ________ ms
- [ ] Database query time: ________ ms
- [ ] Time to First Byte (TTFB): ________ ms

**Tools Used**:
- [ ] Lighthouse (Chrome DevTools)
- [ ] WebPageTest
- [ ] Vercel Speed Insights

**Lighthouse Score**: ________/100

---

## 📝 Documentation

- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Runbook created (incident response)
- [ ] Team access permissions set

**Documentation Location**: ________________

---

## 👥 Team Access

### Access Granted
- [ ] Development team access to repository
- [ ] DevOps team access to hosting platform
- [ ] Database access permissions set
- [ ] On-call rotation defined

**Team Members with Access**:
1. ________________ (Role: ________)
2. ________________ (Role: ________)
3. ________________ (Role: ________)

---

## 🔄 Post-Deployment

### Immediate (Within 1 hour)
- [ ] Monitor error rates
- [ ] Check application logs
- [ ] Verify database connections
- [ ] Test critical user flows
- [ ] Announce deployment to team

### Week 1
- [ ] Daily monitoring of errors
- [ ] Review performance metrics
- [ ] Check database growth
- [ ] Monitor Redis memory usage
- [ ] Collect user feedback

### Week 2-4
- [ ] Weekly performance review
- [ ] Database optimization (if needed)
- [ ] Review and fix any bugs
- [ ] Plan first maintenance window
- [ ] Document lessons learned

---

## 🆘 Rollback Plan

### If Deployment Fails
1. [ ] Revert to previous deployment (Vercel: redeploy previous)
2. [ ] Check logs for errors
3. [ ] Fix issues locally
4. [ ] Test fix
5. [ ] Redeploy

### Rollback Tested
- [ ] Know how to rollback on hosting platform
- [ ] Database migration rollback plan documented
- [ ] Backup restoration process tested

**Last Backup Date**: ________________

---

## ✅ Sign-Off

### Deployment Approval

**Approved by**: ________________
**Date**: ________________
**Signature**: ________________

### Post-Deployment Verification

**Verified by**: ________________
**Date**: ________________
**Status**: ✅ All checks passed / ⚠️ Issues found / ❌ Rollback required

---

## 📞 Emergency Contacts

**On-Call Engineer**: ________________
**Phone**: ________________

**Database Admin**: ________________
**Phone**: ________________

**Hosting Support**: ________________
**Email/Phone**: ________________

---

## 🎯 Success Criteria

Deployment is considered successful when:

- [ ] All critical checks ✅ passed
- [ ] No errors in last 1 hour of logs
- [ ] All smoke tests passed
- [ ] Response time < 500ms for API
- [ ] Health check returns "healthy"
- [ ] At least one real user signup and login successful
- [ ] Background worker processing jobs

**Deployment Status**: ________________

---

**Next Review Date**: ________________

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
