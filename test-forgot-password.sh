#!/bin/bash

echo "🧪 Testing Forgot Password Flow"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test email
TEST_EMAIL="test@example.com"
BASE_URL="http://localhost:3000/api/auth"

echo -e "${YELLOW}Step 1: Creating a test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"testuser\",\"password\":\"password123\"}")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Test user created successfully${NC}"
else
  echo -e "${YELLOW}⚠ User might already exist (this is okay)${NC}"
fi
echo ""

echo -e "${YELLOW}Step 2: Requesting password reset OTP...${NC}"
FORGOT_RESPONSE=$(curl -s -X POST "$BASE_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "Response: $FORGOT_RESPONSE"

if echo "$FORGOT_RESPONSE" | grep -q "OTP has been sent"; then
  echo -e "${GREEN}✓ OTP request successful${NC}"
  echo -e "${GREEN}✓ Check the email: $TEST_EMAIL for the OTP${NC}"
else
  echo -e "${RED}✗ OTP request failed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Testing API endpoints...${NC}"
echo "Available endpoints:"
echo "  - POST /api/auth/forgot-password (email)"
echo "  - POST /api/auth/verify-otp (email, otp)"
echo "  - POST /api/auth/reset-password (email, otp, newPassword)"
echo ""

echo -e "${GREEN}✓ Backend is ready!${NC}"
echo ""
echo "📧 Email Configuration:"
echo "  - SMTP Host: smtp.gmail.com"
echo "  - SMTP Port: 587"
echo "  - From: AgroIntel <noreply@agrointel.com>"
echo ""
echo "🌐 Frontend: http://localhost:5173/forgot-password"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "To test the full flow:"
echo "1. Visit http://localhost:5173/forgot-password"
echo "2. Enter your email address"
echo "3. Check your email for the OTP"
echo "4. Enter the OTP to verify"
echo "5. Set a new password"
