#!/bin/bash

#############################################################
# PriceRight - Automated Production Deployment Script
#############################################################
# This script automates the deployment of PriceRight to production
# Usage: ./deploy.sh [options]
#############################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-false}"
AUTO_CONFIRM="${AUTO_CONFIRM:-false}"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ██████╗ ██████╗ ██╗ ██████╗███████╗               ║
║   ██╔══██╗██╔══██╗██║██╔════╝██╔════╝               ║
║   ██████╔╝██████╔╝██║██║     █████╗                 ║
║   ██╔═══╝ ██╔══██╗██║██║     ██╔══╝                 ║
║   ██║     ██║  ██║██║╚██████╗███████╗               ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝               ║
║                                                       ║
║   RIGHT   - Automated Deployment Script              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}Starting PriceRight deployment...${NC}\n"

#############################################################
# Helper Functions
#############################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        return 1
    fi
    log_success "$1 is installed"
    return 0
}

confirm() {
    if [ "$AUTO_CONFIRM" = "true" ]; then
        return 0
    fi

    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    return 1
}

#############################################################
# Step 1: Prerequisites Check
#############################################################

log_info "Step 1: Checking prerequisites..."

REQUIRED_COMMANDS=("node" "npm" "git")
OPTIONAL_COMMANDS=("docker" "vercel")

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! check_command "$cmd"; then
        log_error "Missing required command: $cmd"
        exit 1
    fi
done

log_info "Checking optional commands..."
for cmd in "${OPTIONAL_COMMANDS[@]}"; do
    check_command "$cmd" || log_warning "$cmd not found (optional)"
done

log_success "Prerequisites check completed\n"

#############################################################
# Step 2: Environment Validation
#############################################################

log_info "Step 2: Validating environment variables..."

if [ -f ".env.${DEPLOYMENT_ENV}" ]; then
    source ".env.${DEPLOYMENT_ENV}"
    log_success "Loaded .env.${DEPLOYMENT_ENV}"
elif [ -f ".env" ]; then
    source ".env"
    log_warning "Using .env file (not environment-specific)"
else
    log_error "No .env file found. Please create .env.${DEPLOYMENT_ENV}"
    exit 1
fi

# Run environment validation script
if [ -f "scripts/validate-env.sh" ]; then
    bash scripts/validate-env.sh
else
    log_warning "Environment validation script not found"
fi

log_success "Environment validation completed\n"

#############################################################
# Step 3: Install Dependencies
#############################################################

log_info "Step 3: Installing dependencies..."

npm ci --production=false
log_success "Dependencies installed\n"

#############################################################
# Step 4: Generate Prisma Client
#############################################################

log_info "Step 4: Generating Prisma client..."

npm run db:generate
log_success "Prisma client generated\n"

#############################################################
# Step 5: Run Tests (Optional)
#############################################################

if [ "$SKIP_TESTS" = "false" ]; then
    log_info "Step 5: Running tests..."

    if npm run test --if-present; then
        log_success "Tests passed\n"
    else
        log_error "Tests failed!"
        if confirm "Tests failed. Continue anyway?"; then
            log_warning "Continuing despite test failures..."
        else
            exit 1
        fi
    fi
else
    log_warning "Step 5: Skipping tests (SKIP_TESTS=true)\n"
fi

#############################################################
# Step 6: Type Check
#############################################################

log_info "Step 6: Running TypeScript type check..."

if npm run typecheck; then
    log_success "Type check passed\n"
else
    log_error "Type check failed!"
    if confirm "Type check failed. Continue anyway?"; then
        log_warning "Continuing despite type errors..."
    else
        exit 1
    fi
fi

#############################################################
# Step 7: Build Application
#############################################################

log_info "Step 7: Building application..."

if npm run build; then
    log_success "Build completed successfully\n"
else
    log_error "Build failed!"
    exit 1
fi

#############################################################
# Step 8: Database Migrations
#############################################################

if [ "$SKIP_MIGRATIONS" = "false" ]; then
    log_info "Step 8: Running database migrations..."

    if confirm "Run database migrations on ${DEPLOYMENT_ENV}?"; then
        npx prisma migrate deploy
        log_success "Database migrations completed\n"
    else
        log_warning "Skipping database migrations\n"
    fi
else
    log_warning "Step 8: Skipping migrations (SKIP_MIGRATIONS=true)\n"
fi

#############################################################
# Step 9: Deploy to Vercel
#############################################################

log_info "Step 9: Deploying to Vercel..."

if command -v vercel &> /dev/null; then
    if confirm "Deploy to Vercel now?"; then
        if [ "$DEPLOYMENT_ENV" = "production" ]; then
            vercel --prod
        else
            vercel
        fi
        log_success "Vercel deployment completed\n"
    else
        log_warning "Skipping Vercel deployment\n"
    fi
else
    log_warning "Vercel CLI not installed. Skipping Vercel deployment."
    log_info "Install with: npm i -g vercel"
    log_info "Or deploy via GitHub integration\n"
fi

#############################################################
# Step 10: Deploy Workers (Docker)
#############################################################

log_info "Step 10: Deploying background workers..."

if command -v docker &> /dev/null; then
    if confirm "Build and deploy worker Docker container?"; then
        bash scripts/deploy-workers.sh
        log_success "Workers deployed\n"
    else
        log_warning "Skipping worker deployment\n"
    fi
else
    log_warning "Docker not installed. Skipping worker deployment."
    log_info "Workers need to be deployed separately to Railway/Render\n"
fi

#############################################################
# Step 11: Health Check
#############################################################

log_info "Step 11: Running health checks..."

if [ -f "scripts/health-check.sh" ]; then
    sleep 5  # Wait for deployment to stabilize
    bash scripts/health-check.sh
else
    log_warning "Health check script not found"
fi

#############################################################
# Deployment Summary
#############################################################

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Completed Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}\n"

log_info "Deployment Summary:"
echo "  Environment: ${DEPLOYMENT_ENV}"
echo "  Timestamp: $(date)"
echo "  Git Commit: $(git rev-parse --short HEAD)"
echo "  Git Branch: $(git rev-parse --abbrev-ref HEAD)"

if [ ! -z "$VERCEL_URL" ]; then
    echo -e "\n${BLUE}Application URL:${NC} $VERCEL_URL"
fi

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Verify deployment at your production URL"
echo "  2. Run smoke tests"
echo "  3. Monitor error tracking (Sentry)"
echo "  4. Check database connections"
echo "  5. Verify background jobs are running"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo "  View logs:        vercel logs"
echo "  Rollback:         vercel rollback"
echo "  Check status:     vercel inspect"

echo -e "\n${GREEN}Happy deploying! 🚀${NC}\n"
