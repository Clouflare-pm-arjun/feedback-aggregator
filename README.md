# Feedback Aggregator

The Feedback Aggregator is a Cloudflare Worker that receives feedback from various sources (webhooks, scrapers, etc.) and stores them in a D1 database. It is designed to write feedback to a Cloudflare Queue for downstream processing.

## Architecture

```
Webhooks/Scrapers → feedback-aggregator → D1 Database → Cloudflare Queue (FEEDBACKS-TO-PROCESS)
                                                              ↓
                                                      feedback-workflow
```

## Features

- **Multi-source feedback ingestion**: Supports feedback from:
  - Customer Support Tickets
  - Discord messages
  - GitHub issues
  - Email
  - X/Twitter mentions
  - Community forums
  - Other sources (extensible)

- **D1 Database storage**: All feedback is stored in D1 with metadata
- **Queue integration**: Designed to write to Cloudflare Queue (documented, not implemented due to paid tier)

## Setup

### 1. Create D1 Database

```bash
# Create the database
wrangler d1 create feedback-db

# This will output a database_id. Update wrangler.jsonc with this ID.
```

### 2. Initialize Database Schema

```bash
# Apply the schema
wrangler d1 execute feedback-db --file=./schema.sql

# Or apply the migration
wrangler d1 execute feedback-db --file=./migrations/0001_initial.sql
```

### 3. Load Mock Data (Optional)

```bash
# Load sample feedback data
wrangler d1 execute feedback-db --file=./mock-data.sql
```

### 4. Update wrangler.jsonc

Update the `database_id` in `wrangler.jsonc` with the ID from step 1.

### 5. Deploy

```bash
npm run deploy
```

## API Documentation

### Swagger UI

Interactive API documentation is available at `/docs` endpoint. This provides a full Swagger UI interface where you can:
- Browse all available endpoints
- View request/response schemas
- Test API calls directly from the browser
- Download the OpenAPI specification

**Access:** `GET /docs`

The OpenAPI specification is available at `/openapi.yaml` in YAML format.

## API Endpoints

### POST /feedback

Submit new feedback for processing.

**Request Body:**
```json
{
  "source": "support",
  "source_id": "TICKET-12345",
  "title": "Slow API response times",
  "content": "We are experiencing very slow response times...",
  "author": "john.doe@company.com",
  "author_email": "john.doe@company.com",
  "metadata": {
    "priority": "high",
    "category": "performance"
  }
}
```

**Response:**
```json
{
  "success": true,
  "id": "fb-1234567890-abc123",
  "message": "Feedback stored successfully. In production, this would be sent to FEEDBACKS-TO-PROCESS queue."
}
```

### GET /feedback

Retrieve feedback with optional filters.

**Query Parameters:**
- `source` - Filter by source (support, discord, github, email, twitter, forum)
- `status` - Filter by status (pending, processing, processed)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Example:**
```
GET /feedback?source=support&status=pending&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fb-001",
      "source": "support",
      "title": "Slow API response times",
      "content": "...",
      "status": "pending",
      "created_at": 1704067200,
      "metadata": {...}
    }
  ],
  "count": 1
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "feedback-aggregator"
}
```

### GET /docs

Interactive API documentation (Swagger UI).

**Response:** HTML page with Swagger UI interface

### GET /openapi.yaml

OpenAPI specification in YAML format.

**Response:** OpenAPI 3.0.3 specification file

### POST /process-queue

Process pending feedback queue by sending feedback to the workflow service.

**Description:** 
Fetches pending feedback from D1, sends them to the workflow service via service binding, and marks them as processed in D1 upon successful workflow creation.

**Response:**
```json
{
  "success": true,
  "processed": 1,
  "failed": 0,
  "message": "Processed 1 feedback items, 0 failed",
  "errors": []
}
```

**Error Response (500):**
```json
{
  "error": "Failed to process queue",
  "details": "Error message"
}
```

## Testing

### Testing Online (Production)

The complete flow can be tested using Swagger documentation after deploying both workers.

#### Prerequisites

1. Deploy both workers:
   ```bash
   # Deploy workflow worker first
   cd feedback-workflow
   npx wrangler deploy

   # Then deploy aggregator worker
   cd feedback-aggregator
   npx wrangler deploy
   ```

2. Access Swagger Documentation:
   - **Aggregator Swagger**: `https://feedback-aggregator.arjunchangeeacharya1998.workers.dev/docs`
   - **Workflow Swagger**: `https://feedback-workflow.arjunchangeeacharya1998.workers.dev/docs`

#### Test Flow Steps

**Step 1: Submit Feedback**

1. Open Aggregator Swagger UI: `https://feedback-aggregator.arjunchangeeacharya1998.workers.dev/docs`
2. Find `POST /feedback` endpoint
3. Click "Try it out"
4. Use the example payload or customize:
   ```json
   {
     "source": "support",
     "source_id": "TICKET-12345",
     "title": "Slow API response times",
     "content": "We are experiencing very slow response times from the API during peak hours.",
     "author": "john.doe@company.com",
     "author_email": "john.doe@company.com",
     "metadata": {
       "priority": "high",
       "category": "performance"
     }
   }
   ```
5. Click "Execute"
6. Note the returned `id` (e.g., `fb-1234567890-abc123`)

**Step 2: Process Queue (Triggers Workflow)**

1. In the same Aggregator Swagger UI, find `POST /process-queue`
2. Click "Try it out" → "Execute"
3. Expected response:
   ```json
   {
     "success": true,
     "processed": 1,
     "failed": 0,
     "message": "Processed 1 feedback items, 0 failed"
   }
   ```

This will:
- Fetch pending feedback from D1
- Call the workflow worker via service binding
- Create workflow instances
- Mark feedback as processed in D1

**Step 3: Verify Feedback Status**

1. In Aggregator Swagger, find `GET /feedback?status=processed`
2. Click "Try it out"
3. Set `status` parameter to `processed`
4. Click "Execute"
5. Confirm the feedback shows `status: "processed"`

**Step 4: Check Workflow Instances**

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages → Workflows**
3. You should see workflow instances with the name `feedback-processor`
4. Click an instance to view:
   - Status (running/completed)
   - Steps (extract-feedback-data, create-processed-feedback, store-to-r2)
   - Execution time and logs

**Step 5: Verify R2 Storage**

1. Cloudflare Dashboard → **R2 → feedback-processed** bucket
2. Find files like `feedback-{id}.json`
3. Open a file to view:
   - Raw feedback data
   - Extracted data (themes, urgency, value, sentiment)

### Testing Locally

For local development testing, you can run both workers on different ports:

**Terminal 1 - Aggregator Worker:**
```bash
cd feedback-aggregator
npx wrangler dev --port 8788
```

**Terminal 2 - Workflow Worker:**
```bash
cd feedback-workflow
npx wrangler dev --port 8787
```

Then test using curl or the Swagger UI:

```bash
# Submit feedback
curl -X POST http://localhost:8788/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "source": "support",
    "title": "Test feedback",
    "content": "This is a test feedback",
    "author": "test@example.com"
  }'

# Process queue
curl -X POST http://localhost:8788/process-queue

# Check processed feedback
curl http://localhost:8788/feedback?status=processed
```

**Note:** Service bindings work in both local and production environments automatically. No URL configuration is needed.

## Cloudflare Queue Integration

The aggregator is designed to write feedback to a Cloudflare Queue named `FEEDBACKS-TO-PROCESS` for downstream processing by the `feedback-workflow` service.

### Queue Configuration (Not Implemented - Paid Feature)

Since Cloudflare Queue is a paid feature, the queue integration is documented but not implemented. To implement it:

1. **Create the Queue:**
   ```bash
   wrangler queues create FEEDBACKS-TO-PROCESS
   ```

2. **Add Queue Binding to wrangler.jsonc:**
   ```jsonc
   {
     "queues": {
       "producers": [
         {
           "queue": "FEEDBACKS-TO-PROCESS",
           "binding": "FEEDBACKS_QUEUE"
         }
       ]
     }
   }
   ```

3. **Update index.ts to send to queue:**
   ```typescript
   // After storing in D1
   await env.FEEDBACKS_QUEUE.send(feedback);
   ```

4. **Configure Consumer in feedback-workflow:**
   ```jsonc
   {
     "queues": {
       "consumers": [
         {
           "queue": "FEEDBACKS-TO-PROCESS",
           "max_batch_size": 10,
           "max_batch_timeout": 30
         }
       ]
     }
   }
   ```

### Queue Message Format

Messages sent to the queue will have the following structure:
```json
{
  "id": "fb-1234567890-abc123",
  "source": "support",
  "source_id": "TICKET-12345",
  "title": "Slow API response times",
  "content": "We are experiencing very slow response times...",
  "author": "john.doe@company.com",
  "author_email": "john.doe@company.com",
  "status": "pending",
  "metadata": {
    "priority": "high",
    "category": "performance"
  },
  "created_at": 1704067200,
  "updated_at": 1704067200
}
```

## Database Schema

The `feedback` table has the following structure:

- `id` (TEXT, PRIMARY KEY) - Unique feedback identifier
- `source` (TEXT, NOT NULL) - Source system (support, discord, github, email, twitter, forum)
- `source_id` (TEXT) - Original ID from the source system
- `title` (TEXT) - Feedback title/subject
- `content` (TEXT, NOT NULL) - Feedback content
- `author` (TEXT) - Username or identifier
- `author_email` (TEXT) - Author email if available
- `status` (TEXT, DEFAULT 'pending') - Processing status
- `metadata` (JSON) - Source-specific metadata
- `created_at` (INTEGER) - Unix timestamp
- `updated_at` (INTEGER) - Unix timestamp

## Development

```bash
# Start local development server
npm run dev

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy
```

## Environment Variables

No environment variables are required. All configuration is done through Wrangler bindings.
