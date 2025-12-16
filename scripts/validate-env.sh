#!/bin/bash

#############################################################
# Environment Variables Validation Script
#############################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Validating environment variables...${NC}\n"

ERRORS=0
WARNINGS=0

check_required() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo -e "${RED}[ERROR]${NC} $var_name is not set (REQUIRED)"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}[✓]${NC} $var_name is set"
        return 0
    fi
}

check_optional() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}[WARNING]${NC} $var_name is not set (optional)"
        ((WARNINGS++))
        return 1
    else
        echo -e "${GREEN}[✓]${NC} $var_name is set"
        return 0
    fi
}

validate_url() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ ! -z "$var_value" ]; then
        if [[ "$var_value" =~ ^https?:// ]]; then
            echo -e "${GREEN}[✓]${NC} $var_name is a valid URL"
        else
            echo -e "${YELLOW}[WARNING]${NC} $var_name might not be a valid URL"
            ((WARNINGS++))
        fi
    fi
}

validate_database_url() {
    if [ ! -z "$DATABASE_URL" ]; then
        if [[ "$DATABASE_URL" =~ ^postgres(ql)?:// ]]; then
            echo -e "${GREEN}[✓]${NC} DATABASE_URL format is valid"

            # Check for SSL mode in production
            if [[ ! "$DATABASE_URL" =~ sslmode=require ]] && [[ "$NODE_ENV" == "production" ]]; then
                echo -e "${YELLOW}[WARNING]${NC} DATABASE_URL should include sslmode=require in production"
                ((WARNINGS++))
            fi
        else
            echo -e "${RED}[ERROR]${NC} DATABASE_URL format is invalid"
            ((ERRORS++))
        fi
    fi
}

validate_redis_url() {
    if [ ! -z "$REDIS_URL" ]; then
        if [[ "$REDIS_URL" =~ ^redis(s)?:// ]]; then
            echo -e "${GREEN}[✓]${NC} REDIS_URL format is valid"

            # Check for TLS in production
            if [[ ! "$REDIS_URL" =~ ^rediss:// ]] && [[ "$NODE_ENV" == "production" ]]; then
                echo -e "${YELLOW}[WARNING]${NC} REDIS_URL should use rediss:// (TLS) in production"
                ((WARNINGS++))
            fi
        else
            echo -e "${RED}[ERROR]${NC} REDIS_URL format is invalid"
            ((ERRORS++))
        fi
    fi
}

echo "=== Critical Environment Variables ==="
check_required "DATABASE_URL"
validate_database_url

check_required "NEXTAUTH_SECRET"
if [ ! -z "$NEXTAUTH_SECRET" ]; then
    if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
        echo -e "${YELLOW}[WARNING]${NC} NEXTAUTH_SECRET should be at least 32 characters"
        ((WARNINGS++))
    fi
fi

check_required "NEXTAUTH_URL"
validate_url "NEXTAUTH_URL"

check_required "REDIS_URL"
validate_redis_url

echo -e "\n=== Optional Environment Variables ==="
check_optional "S3_ACCESS_KEY_ID"
check_optional "S3_SECRET_ACCESS_KEY"
check_optional "S3_BUCKET_NAME"
check_optional "S3_REGION"

check_optional "SENTRY_DSN"
check_optional "NODE_ENV"

echo -e "\n=== Marketplace API Keys (Optional) ==="
check_optional "AMAZON_CLIENT_ID"
check_optional "WALMART_CLIENT_ID"
check_optional "SHOPIFY_API_KEY"

echo -e "\n=== Validation Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}[✓]${NC} All required environment variables are set"
else
    echo -e "${RED}[✗]${NC} $ERRORS required environment variable(s) missing"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}[!]${NC} $WARNINGS warning(s) found"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Environment validation failed!${NC}"
    exit 1
else
    echo -e "${GREEN}Environment validation passed!${NC}"
    exit 0
fi
