#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Submitting feedback to aggregator...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:8788/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github",
    "source_id": "issue-123",
    "title": "R2 bucket access is slow",
    "content": "We noticed that accessing R2 buckets from Workers has significant latency.",
    "author": "dev@example.com",
    "metadata": {"repo": "myrepo"}
  }')

FEEDBACK_ID=$(echo $RESPONSE | jq -r '.id')
echo -e "${GREEN}Feedback submitted: $FEEDBACK_ID${NC}"

sleep 2

echo -e "${BLUE}Step 2: Processing queue (triggering workflow)...${NC}"
curl -X POST http://localhost:8788/process-queue

echo -e "\n${BLUE}Step 3: Checking processed feedback...${NC}"
sleep 3
curl -s http://localhost:8788/feedback?status=processed | jq '.'