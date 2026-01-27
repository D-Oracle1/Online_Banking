#!/bin/bash

# Automated Vercel Deployment Script for NextBanker
# This script automates the deployment process to Vercel

set -e  # Exit on error

echo "🚀 NextBanker - Automated Vercel Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
fi

echo -e "${BLUE}📦 Step 1: Building application locally...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 2: Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n): " commit_choice

    if [ "$commit_choice" = "y" ]; then
        echo "Enter commit message:"
        read commit_msg
        git add .
        git commit -m "$commit_msg"

        echo -e "${BLUE}Pushing to GitHub...${NC}"
        git push origin main
        echo -e "${GREEN}✅ Changes committed and pushed${NC}"
    else
        echo -e "${YELLOW}⚠️  Continuing with uncommitted changes...${NC}"
    fi
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi

echo ""
echo -e "${BLUE}🔑 Step 3: Checking environment variables...${NC}"
echo ""
echo "Required environment variables for Vercel:"
echo "  - DATABASE_URL"
echo "  - SESSION_SECRET"
echo "  - SMTP_HOST"
echo "  - SMTP_PORT"
echo "  - SMTP_SECURE"
echo "  - SMTP_USER"
echo "  - SMTP_PASSWORD"
echo "  - SMTP_FROM_NAME"
echo "  - SMTP_FROM_EMAIL"
echo ""
echo -e "${YELLOW}Make sure these are set in Vercel dashboard before deploying!${NC}"
echo "Visit: https://vercel.com/your-project/settings/environment-variables"
echo ""
read -p "Have you added all environment variables in Vercel? (y/n): " env_ready

if [ "$env_ready" != "y" ]; then
    echo ""
    echo -e "${YELLOW}Please add environment variables first:${NC}"
    echo "1. Go to https://vercel.com"
    echo "2. Select your project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add each variable from your .env file"
    echo "5. Re-run this script"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Step 4: Deploying to Vercel...${NC}"
echo ""
echo "Choose deployment type:"
echo "1) Preview deployment (for testing)"
echo "2) Production deployment"
echo ""
read -p "Enter choice (1 or 2): " deploy_choice

if [ "$deploy_choice" = "2" ]; then
    echo -e "${BLUE}Deploying to PRODUCTION...${NC}"
    vercel --prod
else
    echo -e "${BLUE}Creating PREVIEW deployment...${NC}"
    vercel
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ Deployment Successful!"
    echo "==========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit your deployment URL (shown above)"
    echo "2. Test login functionality"
    echo "3. Create admin account if needed"
    echo "4. Verify database connection"
    echo "5. Test email notifications"
    echo ""
    echo "View logs: https://vercel.com/dashboard"
else
    echo ""
    echo -e "${RED}=========================================="
    echo "❌ Deployment Failed"
    echo "==========================================${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check build logs above for errors"
    echo "2. Verify environment variables in Vercel"
    echo "3. Check Vercel dashboard for detailed logs"
    echo "4. Ensure all dependencies are in package.json"
    exit 1
fi
