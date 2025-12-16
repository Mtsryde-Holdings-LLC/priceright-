#!/bin/bash

#############################################################
# Production Health Check Script
#############################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Running production health checks...${NC}\n"

# Configuration
APP_URL="${APP_URL:-$NEXTAUTH_URL}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/api/health}"
MAX_RETRIES=3
RETRY_DELAY=5

CHECKS_PASSED=0
CHECKS_FAILED=0

#############################################################
# Helper Functions
#############################################################

check_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    echo -n "  Checking $description... "

    for i in $(seq 1 $MAX_RETRIES); do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓${NC} (HTTP $response)"
            ((CHECKS_PASSED++))
            return 0
        fi

        if [ $i -lt $MAX_RETRIES ]; then
            echo -n "."
            sleep $RETRY_DELAY
        fi
    done

    echo -e "${RED}✗${NC} (HTTP $response, expected $expected_status)"
    ((CHECKS_FAILED++))
    return 1
}

check_database() {
    echo -n "  Checking database connection... "

    if [ ! -z "$DATABASE_URL" ]; then
        # Try to connect using Prisma
        if npx prisma db execute --stdin <<< "SELECT 1" &> /dev/null; then
            echo -e "${GREEN}✓${NC}"
            ((CHECKS_PASSED++))
            return 0
        else
            echo -e "${RED}✗${NC}"
            ((CHECKS_FAILED++))
            return 1
        fi
    else
        echo -e "${YELLOW}!${NC} (DATABASE_URL not set)"
        return 1
    fi
}

check_redis() {
    echo -n "  Checking Redis connection... "

    if [ ! -z "$REDIS_URL" ]; then
        # Basic check - try to ping Redis if redis-cli is available
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
                echo -e "${GREEN}✓${NC}"
                ((CHECKS_PASSED++))
                return 0
            fi
        fi

        # If redis-cli not available, just warn
        echo -e "${YELLOW}!${NC} (cannot verify - redis-cli not installed)"
        return 0
    else
        echo -e "${YELLOW}!${NC} (REDIS_URL not set)"
        return 1
    fi
}

#############################################################
# Run Health Checks
#############################################################

echo -e "${BLUE}=== HTTP Endpoints ===${NC}"

if [ ! -z "$APP_URL" ]; then
    check_http_endpoint "$APP_URL$HEALTH_ENDPOINT" 200 "Health endpoint"
    check_http_endpoint "$APP_URL" 200 "Homepage"
    check_http_endpoint "$APP_URL/api/auth/signin" 200 "Auth endpoint"
else
    echo -e "${YELLOW}[!]${NC} APP_URL not set, skipping HTTP checks"
fi

echo -e "\n${BLUE}=== Infrastructure ===${NC}"

check_database
check_redis

echo -e "\n${BLUE}=== Application Health ===${NC}"

# Check if health endpoint returns valid JSON
if [ ! -z "$APP_URL" ]; then
    echo -n "  Checking health response format... "

    health_response=$(curl -s "$APP_URL$HEALTH_ENDPOINT" 2>/dev/null || echo "{}")

    if echo "$health_response" | grep -q '"status"'; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))

        # Display health status
        status=$(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "    Status: $status"

        # Check individual health checks
        if echo "$health_response" | grep -q '"database":"ok"'; then
            echo -e "    Database: ${GREEN}ok${NC}"
        else
            echo -e "    Database: ${RED}failed${NC}"
        fi

        if echo "$health_response" | grep -q '"environment":"ok"'; then
            echo -e "    Environment: ${GREEN}ok${NC}"
        else
            echo -e "    Environment: ${YELLOW}check required${NC}"
        fi
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
    fi
fi

#############################################################
# Summary
#############################################################

echo -e "\n${BLUE}=== Health Check Summary ===${NC}"
echo "  Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo "  Failed: ${RED}$CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}[✓] All health checks passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}[✗] Some health checks failed!${NC}"
    echo -e "${YELLOW}Please review the failed checks above.${NC}\n"
    exit 1
fi
