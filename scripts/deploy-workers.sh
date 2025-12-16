#!/bin/bash

#############################################################
# Background Workers Deployment Script
#############################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Deploying PriceRight Background Workers...${NC}\n"

# Configuration
WORKER_IMAGE_NAME="${WORKER_IMAGE_NAME:-priceright-workers}"
WORKER_IMAGE_TAG="${WORKER_IMAGE_TAG:-latest}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"

#############################################################
# Build Docker Image
#############################################################

echo -e "${BLUE}[1/4]${NC} Building Docker image..."

docker build -f Dockerfile.workers -t ${WORKER_IMAGE_NAME}:${WORKER_IMAGE_TAG} .

echo -e "${GREEN}[✓]${NC} Docker image built successfully\n"

#############################################################
# Tag Image (if registry specified)
#############################################################

if [ ! -z "$DOCKER_REGISTRY" ]; then
    echo -e "${BLUE}[2/4]${NC} Tagging image for registry..."

    docker tag ${WORKER_IMAGE_NAME}:${WORKER_IMAGE_TAG} \
        ${DOCKER_REGISTRY}/${WORKER_IMAGE_NAME}:${WORKER_IMAGE_TAG}

    echo -e "${GREEN}[✓]${NC} Image tagged\n"

    #############################################################
    # Push to Registry
    #############################################################

    echo -e "${BLUE}[3/4]${NC} Pushing to registry..."

    docker push ${DOCKER_REGISTRY}/${WORKER_IMAGE_NAME}:${WORKER_IMAGE_TAG}

    echo -e "${GREEN}[✓]${NC} Image pushed to registry\n"
else
    echo -e "${YELLOW}[!]${NC} No DOCKER_REGISTRY specified, skipping push\n"
fi

#############################################################
# Deploy Options
#############################################################

echo -e "${BLUE}[4/4]${NC} Deployment options...\n"

echo "Choose deployment method:"
echo "  1) Run locally with Docker"
echo "  2) Deploy to Railway (CLI)"
echo "  3) Deploy to Render (manual)"
echo "  4) Skip (manual deployment)"
echo ""

read -p "Select option (1-4): " DEPLOY_OPTION

case $DEPLOY_OPTION in
    1)
        echo -e "\n${BLUE}Running workers locally...${NC}"
        docker run -d \
            --name priceright-workers \
            --env-file .env.production \
            --restart unless-stopped \
            ${WORKER_IMAGE_NAME}:${WORKER_IMAGE_TAG}

        echo -e "${GREEN}[✓]${NC} Workers started locally"
        echo "  View logs: docker logs -f priceright-workers"
        echo "  Stop: docker stop priceright-workers"
        ;;

    2)
        if command -v railway &> /dev/null; then
            echo -e "\n${BLUE}Deploying to Railway...${NC}"

            # Check if railway is linked
            if railway status &> /dev/null; then
                railway up
                echo -e "${GREEN}[✓]${NC} Deployed to Railway"
            else
                echo -e "${YELLOW}[!]${NC} Railway not linked. Run 'railway link' first"
            fi
        else
            echo -e "${YELLOW}[!]${NC} Railway CLI not installed"
            echo "  Install: npm i -g @railway/cli"
        fi
        ;;

    3)
        echo -e "\n${BLUE}Deploy to Render:${NC}"
        echo "  1. Go to https://render.com"
        echo "  2. Create new 'Background Worker'"
        echo "  3. Connect your GitHub repository"
        echo "  4. Set Docker command: npm run jobs:dev"
        echo "  5. Add environment variables from .env.production"
        echo "  6. Deploy!"
        ;;

    4)
        echo -e "\n${YELLOW}[!]${NC} Skipping automatic deployment"
        echo "Docker image is built and ready: ${WORKER_IMAGE_NAME}:${WORKER_IMAGE_TAG}"
        ;;

    *)
        echo -e "${YELLOW}[!]${NC} Invalid option. Skipping deployment."
        ;;
esac

echo -e "\n${GREEN}Worker deployment script completed!${NC}\n"
