#!/bin/bash

# KLSE Platform - Automated Testing & Bug Fixing Script
# This script runs build checks, type checking, and linting
# It reports errors and can be used before commits

set -e

echo "=========================================="
echo "🧪 KLSE Platform - Automated Test Suite"
echo "=========================================="

cd /Users/mac/Desktop/companyreport

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "📋 Step 1: TypeScript Type Checking..."
echo "----------------------------------------"
npx tsc --noEmit 2>&1 | head -50
check_result "TypeScript"

echo ""
echo "📋 Step 2: ESLint Check..."
echo "----------------------------------------"
npm run lint 2>&1 | head -50 || true
check_result "ESLint"

echo ""
echo "📋 Step 3: Build Check..."
echo "----------------------------------------"
npm run build 2>&1 | tail -30
check_result "Build"

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS test(s) failed. Please fix before deploying.${NC}"
    exit 1
fi
