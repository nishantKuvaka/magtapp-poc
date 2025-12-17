#!/bin/bash

# ECR Push Script for Django Load Test POC
# This script builds, tags, and pushes the Docker image to AWS ECR

set -e  # Exit on error

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
REPOSITORY_NAME="django-loadtest"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Django Load Test - ECR Push Script                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS_ACCOUNT_ID is set
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: AWS_ACCOUNT_ID environment variable is not set${NC}"
    echo -e "${YELLOW}💡 Usage: AWS_ACCOUNT_ID=123456789012 ./push-to-ecr.sh${NC}"
    exit 1
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE_NAME="${ECR_URI}/${REPOSITORY_NAME}:${IMAGE_TAG}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   • AWS Region: ${AWS_REGION}"
echo "   • AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "   • Repository: ${REPOSITORY_NAME}"
echo "   • Image Tag: ${IMAGE_TAG}"
echo "   • Full Image Name: ${FULL_IMAGE_NAME}"
echo ""

# Step 1: Authenticate Docker to ECR
echo -e "${YELLOW}🔐 Step 1: Authenticating Docker to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully authenticated to ECR${NC}"
else
    echo -e "${RED}❌ Failed to authenticate to ECR${NC}"
    exit 1
fi
echo ""

# Step 2: Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Step 2: Checking if ECR repository exists...${NC}"
if aws ecr describe-repositories --repository-names ${REPOSITORY_NAME} --region ${AWS_REGION} >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Repository '${REPOSITORY_NAME}' already exists${NC}"
else
    echo -e "${YELLOW}⚠️  Repository doesn't exist. Creating...${NC}"
    aws ecr create-repository --repository-name ${REPOSITORY_NAME} --region ${AWS_REGION}
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully created repository '${REPOSITORY_NAME}'${NC}"
    else
        echo -e "${RED}❌ Failed to create repository${NC}"
        exit 1
    fi
fi
echo ""

# Step 3: Build Docker image
echo -e "${YELLOW}🔨 Step 3: Building Docker image...${NC}"
docker build -t ${REPOSITORY_NAME}:${IMAGE_TAG} .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully built Docker image${NC}"
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi
echo ""

# Step 4: Tag image for ECR
echo -e "${YELLOW}🏷️  Step 4: Tagging image for ECR...${NC}"
docker tag ${REPOSITORY_NAME}:${IMAGE_TAG} ${FULL_IMAGE_NAME}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully tagged image${NC}"
else
    echo -e "${RED}❌ Failed to tag image${NC}"
    exit 1
fi
echo ""

# Step 5: Push image to ECR
echo -e "${YELLOW}🚀 Step 5: Pushing image to ECR...${NC}"
docker push ${FULL_IMAGE_NAME}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed image to ECR${NC}"
else
    echo -e "${RED}❌ Failed to push image to ECR${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ SUCCESS!                                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📦 Image pushed successfully!${NC}"
echo -e "${YELLOW}🔗 Image URI: ${FULL_IMAGE_NAME}${NC}"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "   1. Create ECS Task Definition using this image"
echo "   2. Deploy to ECS cluster (EC2 or Fargate)"
echo "   3. Run load tests with k6"
echo ""
echo -e "${YELLOW}📋 Example ECS Task Definition snippet:${NC}"
echo '   {
     "containerDefinitions": [{
       "name": "django-loadtest",
       "image": "'${FULL_IMAGE_NAME}'",
       "portMappings": [{
         "containerPort": 8000,
         "protocol": "tcp"
       }],
       "environment": [
         {"name": "DEBUG", "value": "False"},
         {"name": "ALLOWED_HOSTS", "value": "*"}
       ]
     }]
   }'
echo ""
