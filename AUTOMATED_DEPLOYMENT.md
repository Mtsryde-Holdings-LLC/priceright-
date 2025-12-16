# PriceRight - Automated Deployment Guide

> Complete guide for automated infrastructure setup and deployment

**Last Updated**: 2025-12-16
**Deployment Type**: Fully Automated
**Time to Deploy**: 30-60 minutes

---

## 🎯 Overview

This guide covers **fully automated deployment** using:
- **Infrastructure as Code** (Terraform)
- **CI/CD Pipeline** (GitHub Actions)
- **Deployment Scripts** (Bash automation)
- **Container Orchestration** (Docker)

**What Gets Automated**:
- ✅ Infrastructure provisioning
- ✅ Environment configuration
- ✅ Database migrations
- ✅ Application deployment
- ✅ Worker deployment
- ✅ Health checks
- ✅ Rollback capabilities

---

## 📋 Prerequisites

### Required Tools

```bash
# 1. Node.js 18+
node --version  # Should be >= 18.0.0

# 2. Git
git --version

# 3. Terraform (for infrastructure)
brew install terraform  # macOS
# OR
sudo apt install terraform  # Linux

# 4. Docker (for workers)
docker --version

# 5. Vercel CLI (optional but recommended)
npm install -g vercel

# 6. Railway CLI (for workers, optional)
npm install -g @railway/cli
```

### Required Accounts

1. **GitHub Account** - For repository and CI/CD
2. **Vercel Account** - For Next.js hosting
3. **AWS Account** - For S3 storage (and optionally RDS/ElastiCache)
4. **Database Provider** - Supabase (recommended) or AWS RDS
5. **Redis Provider** - Upstash (recommended) or AWS ElastiCache

### Required Secrets

You'll need to obtain:
- Vercel API token
- AWS credentials
- Database URL
- Redis URL
- NextAuth secret

---

## 🚀 Deployment Methods

Choose your preferred method:

### Method 1: One-Command Deployment (Recommended)
- **Time**: 30 minutes
- **Complexity**: Low
- **Best for**: Quick production deployment

### Method 2: Terraform + CI/CD (Enterprise)
- **Time**: 60 minutes
- **Complexity**: Medium
- **Best for**: Team environments, infrastructure control

### Method 3: Docker Compose (Self-Hosted)
- **Time**: 20 minutes
- **Complexity**: Low
- **Best for**: Development, self-hosted deployments

---

## 🎬 Method 1: One-Command Deployment

### Step 1: Setup External Services

#### 1.1 PostgreSQL (Supabase)

```bash
# 1. Go to https://supabase.com
# 2. Create account and new project
# 3. Name: priceright-production
# 4. Generate strong database password
# 5. Select region closest to users
# 6. Wait 2-3 minutes for provisioning

# 7. Get connection string:
#    Project Settings → Database → Connection Pooling
#    Copy "Connection string" (URI mode)
```

Save as: `DATABASE_URL`

#### 1.2 Redis (Upstash)

```bash
# 1. Go to https://upstash.com
# 2. Create account
# 3. Create Redis database
#    Name: priceright-production
#    Region: Same as your app deployment
#    Type: Regional (or Global for multi-region)

# 4. Copy "UPSTASH_REDIS_REST_URL"
```

Save as: `REDIS_URL`

#### 1.3 Generate Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Save this value!
```

Save as: `NEXTAUTH_SECRET`

### Step 2: Configure Environment

```bash
# Clone repository (if not already)
git clone https://github.com/your-username/priceright.git
cd priceright

# Create production environment file
cp .env.example .env.production

# Edit environment file
nano .env.production
```

Add your values:

```bash
# Database
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Redis
REDIS_URL="rediss://default:[PASSWORD]@us1-merry-firefly-12345.upstash.io:6379"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"  # Will update after Vercel deployment
NEXTAUTH_SECRET="[generated secret from above]"

# Optional: S3 Storage
S3_ACCESS_KEY_ID="your-aws-access-key"
S3_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="priceright-production"
S3_REGION="us-east-1"
```

### Step 3: Run Automated Deployment

```bash
# Make deployment script executable
chmod +x deploy.sh
chmod +x scripts/*.sh

# Run deployment
./deploy.sh
```

The script will:
1. ✅ Check prerequisites
2. ✅ Validate environment variables
3. ✅ Install dependencies
4. ✅ Generate Prisma client
5. ✅ Run type checks
6. ✅ Build application
7. ✅ Run database migrations
8. ✅ Deploy to Vercel
9. ✅ Deploy workers
10. ✅ Run health checks

### Step 4: Configure Vercel Domain

```bash
# After deployment, update NEXTAUTH_URL
# Get your Vercel URL from deployment output

# Option A: Use Vercel domain
NEXTAUTH_URL="https://priceright-production.vercel.app"

# Option B: Add custom domain
vercel domains add your-domain.com

# Then update
NEXTAUTH_URL="https://your-domain.com"

# Redeploy with updated URL
vercel --prod
```

### Step 5: Verify Deployment

```bash
# Run health checks
APP_URL="https://your-vercel-url.vercel.app" bash scripts/health-check.sh

# Check application
open https://your-vercel-url.vercel.app

# Check health endpoint
curl https://your-vercel-url.vercel.app/api/health
```

✅ **Deployment Complete!**

---

## 🏗️ Method 2: Terraform + CI/CD

### Step 1: Configure Terraform

```bash
cd terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

Minimum configuration:

```hcl
environment      = "production"
aws_region       = "us-east-1"
vercel_api_token = "your-vercel-token"
github_repo      = "your-username/priceright"
nextauth_url     = "https://your-domain.com"
nextauth_secret  = "your-generated-secret"

# Using external services (recommended)
use_aws_rds         = false
use_aws_elasticache = false
database_url        = "postgresql://..."
redis_url           = "rediss://..."
```

### Step 2: Initialize and Apply Terraform

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply configuration
terraform apply

# Save outputs
terraform output > ../terraform-outputs.txt
terraform output -raw s3_access_key_id >> ../.env.production
terraform output -raw s3_secret_access_key >> ../.env.production
```

### Step 3: Configure GitHub Secrets

Go to: `GitHub Repository → Settings → Secrets and variables → Actions`

Add these secrets:

```
VERCEL_TOKEN              = [Your Vercel API token]
DATABASE_URL              = [From Terraform or Supabase]
REDIS_URL                 = [From Terraform or Upstash]
NEXTAUTH_SECRET           = [Generated secret]
NEXTAUTH_URL              = [Your production URL]
RAILWAY_TOKEN             = [For worker deployment]
PRODUCTION_URL            = [Your domain]
AWS_ACCESS_KEY_ID         = [From Terraform output]
AWS_SECRET_ACCESS_KEY     = [From Terraform output]
DOCKER_USERNAME           = [Optional: Docker Hub username]
DOCKER_PASSWORD           = [Optional: Docker Hub password]
```

### Step 4: Enable GitHub Actions

```bash
# Commit and push to trigger deployment
git add .
git commit -m "feat: Configure automated deployment"
git push origin main
```

GitHub Actions will automatically:
1. Run code quality checks
2. Run security scans
3. Deploy to Vercel
4. Deploy workers to Railway
5. Run database migrations
6. Execute health checks
7. Send notifications

### Step 5: Monitor Deployment

```bash
# Watch GitHub Actions
# Go to: Repository → Actions tab

# Or via CLI
gh run list
gh run watch
```

✅ **Automated CI/CD Active!**

---

## 🐳 Method 3: Docker Compose (Self-Hosted)

Perfect for development or self-hosted production.

### Step 1: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

```bash
# Set passwords
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
NEXTAUTH_SECRET=your-nextauth-secret

# Database will be auto-configured by Docker Compose
# No need to set DATABASE_URL or REDIS_URL
```

### Step 2: Start All Services

```bash
# Build and start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

This starts:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Next.js app (port 3000)
- Background workers
- Prisma Studio (port 5555, optional)

### Step 3: Run Migrations

```bash
# Execute migrations in Docker container
docker-compose exec app npx prisma migrate deploy

# Or run Prisma Studio
docker-compose --profile tools up prisma-studio
# Access at: http://localhost:5555
```

### Step 4: Access Application

```
Application: http://localhost:3000
Prisma Studio: http://localhost:5555
PostgreSQL: localhost:5432
Redis: localhost:6379
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

✅ **Local Deployment Running!**

---

## 🔄 CI/CD Pipeline Details

### Automated Workflows

#### On Push to `main`:
1. **Code Quality**
   - TypeScript type checking
   - ESLint validation
   - Unit tests (if present)
   - Build verification

2. **Security**
   - npm audit
   - Snyk vulnerability scan
   - Dependency checks

3. **Deployment**
   - Deploy to Vercel (production)
   - Deploy workers to Railway
   - Run database migrations
   - Health checks

4. **Notification**
   - Slack/Discord notification
   - GitHub deployment status

#### On Pull Request:
1. Code quality checks
2. Security scans
3. Preview deployment to Vercel
4. Comment PR with preview URL

### Manual Workflow Dispatch

```bash
# Trigger manual deployment via GitHub UI
# Repository → Actions → Deploy PriceRight → Run workflow

# Or via CLI
gh workflow run deploy.yml -f environment=production
```

---

## 🛠️ Deployment Scripts Reference

### Main Deployment Script

```bash
# Full deployment with all checks
./deploy.sh

# Skip tests
SKIP_TESTS=true ./deploy.sh

# Skip migrations
SKIP_MIGRATIONS=true ./deploy.sh

# Auto-confirm all prompts
AUTO_CONFIRM=true ./deploy.sh

# Deploy to staging
DEPLOYMENT_ENV=staging ./deploy.sh
```

### Validation Script

```bash
# Validate environment variables
bash scripts/validate-env.sh

# Returns exit code 0 if valid, 1 if errors
```

### Workers Deployment

```bash
# Deploy workers
bash scripts/deploy-workers.sh

# With custom registry
DOCKER_REGISTRY=your-registry.com bash scripts/deploy-workers.sh

# Build only (no deploy)
bash scripts/deploy-workers.sh
# Then select option 4
```

### Health Checks

```bash
# Check production health
APP_URL="https://your-domain.com" bash scripts/health-check.sh

# Custom health endpoint
APP_URL="https://your-domain.com" HEALTH_ENDPOINT="/api/custom-health" bash scripts/health-check.sh
```

---

## 📊 Monitoring & Observability

### Post-Deployment Monitoring

```bash
# View Vercel logs
vercel logs --follow

# View worker logs (if on Railway)
railway logs

# View Docker logs (if self-hosted)
docker-compose logs -f workers
```

### Health Check Endpoints

```bash
# Application health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "checks": {
    "database": "ok",
    "environment": "ok"
  }
}
```

### Sentry Integration (Optional)

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure
npx @sentry/wizard@latest -i nextjs

# Add to environment
SENTRY_DSN="your-sentry-dsn"

# Redeploy
./deploy.sh
```

---

## 🔧 Troubleshooting

### Deployment Fails: Environment Variables

```bash
# Validate your environment
bash scripts/validate-env.sh

# Check for common issues:
# - DATABASE_URL missing sslmode=require
# - REDIS_URL using redis:// instead of rediss://
# - NEXTAUTH_SECRET less than 32 characters
```

### Build Fails: Prisma Client Not Generated

```bash
# Manually generate
npx prisma generate

# Check package.json has postinstall script
npm run postinstall
```

### Workers Not Running

```bash
# Check worker deployment
docker ps  # If self-hosted
railway logs  # If on Railway

# Verify Redis connection
redis-cli -u $REDIS_URL ping

# Check job queues
npm run jobs:dev  # Run locally to test
```

### Database Connection Issues

```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check connection pooling
# Supabase: Use pooling URL (port 6543)
# AWS RDS: Enable RDS Proxy
```

### Health Checks Failing

```bash
# Check endpoint directly
curl -v https://your-domain.com/api/health

# Check Vercel logs
vercel logs --follow

# Verify environment variables in Vercel
vercel env ls
```

---

## 🔐 Security Checklist

After automated deployment, verify:

- [ ] All secrets are in environment variables (not code)
- [ ] DATABASE_URL includes `sslmode=require`
- [ ] REDIS_URL uses `rediss://` (TLS)
- [ ] NEXTAUTH_SECRET is strong (32+ characters)
- [ ] S3 bucket is private (not public)
- [ ] Rate limiting is enabled
- [ ] CORS is configured properly
- [ ] Security headers are set (check vercel.json)
- [ ] No secrets in Git history
- [ ] GitHub secrets are configured
- [ ] AWS IAM uses least-privilege

---

## 📈 Scaling Your Deployment

### Horizontal Scaling

```hcl
# Terraform: Increase worker replicas
resource "railway_service" "workers" {
  replicas = 3  # Scale to 3 instances
}
```

### Database Scaling

```bash
# Supabase: Upgrade plan via dashboard
# AWS RDS: Modify instance class

terraform apply -var="db_instance_class=db.t3.small"
```

### Redis Scaling

```bash
# Upstash: Upgrade to higher tier
# AWS ElastiCache: Increase node size

terraform apply -var="redis_node_type=cache.t3.small"
```

---

## 🎯 Next Steps After Deployment

1. **Set up monitoring**
   - Configure Sentry
   - Set up Vercel Analytics
   - Configure uptime monitoring

2. **Configure custom domain**
   ```bash
   vercel domains add your-domain.com
   ```

3. **Set up backups**
   - Database: Automated via Supabase/RDS
   - Redis: Enable persistence
   - Code: GitHub (already done)

4. **Load testing**
   ```bash
   npm install -g k6
   k6 run loadtest.js
   ```

5. **Team access**
   - Add team members to Vercel
   - Configure GitHub permissions
   - Share deployment documentation

---

## 📞 Support & Resources

- **Deployment Issues**: Check `scripts/health-check.sh` output
- **Terraform Issues**: See `terraform/README.md`
- **CI/CD Issues**: Check GitHub Actions logs
- **General Help**: See `DEPLOYMENT.md`

---

**🎉 Congratulations! Your PriceRight deployment is automated and production-ready!**
