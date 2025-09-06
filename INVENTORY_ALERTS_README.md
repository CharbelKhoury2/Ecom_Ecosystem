# Inventory Alerts System

A comprehensive inventory monitoring and alerting system for the E-commerce Copilot OS platform.

## Overview

The Inventory Alerts System automatically monitors product inventory levels across Shopify stores and generates intelligent alerts when stock levels require attention. The system includes automated scheduling, audit logging, and a complete management interface.

## Features

### 🔍 **Intelligent Alert Generation**
- **Low Stock Alerts**: Triggered when inventory falls below 10 units (Warning severity)
- **Out of Stock Alerts**: Triggered when inventory reaches 0 (Critical severity)
- **Automatic Alert Closure**: Alerts are automatically closed when inventory recovers to ≥10 units
- **Duplicate Prevention**: Prevents multiple alerts for the same SKU

### 📊 **Comprehensive Database Schema**
- **Enhanced Alerts Table**: Includes workspace support, product tracking, and acknowledgment features
- **Audit Logs**: Complete trail of all alert operations (create/close/acknowledge/mock_restock)
- **Multi-tenant Support**: Workspace-based isolation for different organizations

### ⚡ **Automated Scheduling**
- **30-minute Intervals**: Configurable automated inventory checks
- **Manual Triggers**: On-demand inventory checks via UI or API
- **Exponential Backoff**: Resilient error handling with retry logic
- **Rate Limiting**: Respects Shopify API limits

### 🎛️ **Management Interface**
- **Sortable/Filterable Table**: Advanced filtering by status, severity, and type
- **Acknowledgment System**: Track who acknowledged alerts and when
- **Mock Restock**: Development-only feature for testing workflows
- **Real-time Updates**: Live status updates and notifications

## Database Schema

### Alerts Table
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,              -- UUID
  workspace_id TEXT NOT NULL,       -- Multi-tenant support
  type TEXT NOT NULL,               -- 'Low Stock' | 'Out of Stock'
  sku TEXT NOT NULL,                -- Product SKU
  product_id TEXT,                  -- Shopify product ID
  message TEXT NOT NULL,            -- Human-readable alert message
  severity TEXT NOT NULL,           -- 'warning' | 'critical'
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  created_at TIMESTAMP DEFAULT now(),
  acknowledged_by TEXT NULL,        -- User who acknowledged
  acknowledged_at TIMESTAMP NULL    -- Acknowledgment timestamp
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,              -- User or system identifier
  action TEXT NOT NULL,             -- 'create', 'close', 'acknowledge', 'mock_restock'
  target_type TEXT NOT NULL,        -- 'alert', 'product', 'workspace'
  target_id TEXT NOT NULL,          -- ID of the target entity
  payload JSONB,                    -- Additional action details
  created_at TIMESTAMP DEFAULT now()
);
```

## API Endpoints

### Inventory Management

#### `POST /api/alerts/inventory`
Runs inventory check for a workspace.

**Request:**
```json
{
  "workspace_id": "ws_abc123",
  "force": false
}
```

**Response:**
```json
{
  "alerts": [...],
  "created": 2,
  "closed": 1,
  "products_checked": 150,
  "summary": {
    "new_alerts_created": 2,
    "alerts_closed": 1,
    "total_open_alerts": 5
  }
}
```

#### `GET /api/alerts/inventory`
Fetches alerts with filtering options.

**Query Parameters:**
- `workspace_id` (required): Workspace identifier
- `status`: Filter by status ('open', 'closed', 'all')
- `type`: Filter by type ('Low Stock', 'Out of Stock')
- `severity`: Filter by severity ('warning', 'critical')

### Alert Management

#### `PATCH /api/alerts/:id/acknowledge`
Acknowledges an alert.

**Request:**
```json
{
  "acknowledged_by": "user@example.com"
}
```

#### `POST /api/alerts/:id/mock_restock`
Simulates product restocking (development only).

**Request:**
```json
{
  "qty": 20,
  "actor": "user@example.com"
}
```

### Scheduler

#### `POST /api/alerts/scheduler`
Manually triggers the scheduler.

**Request:**
```json
{
  "manual": true,
  "workspace_id": "ws_abc123" // Optional: specific workspace
}
```

#### `GET /api/alerts/scheduler?action=status`
Returns scheduler status and configuration.

## Scheduler Configuration

### Default Settings
- **Check Interval**: 30 minutes
- **Retry Attempts**: 3 (with exponential backoff)
- **Base Delay**: 1000ms
- **Max Delay**: 8000ms (after 3 retries)

### Environment Variables
```bash
# Application URL for internal API calls
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment mode (affects mock restock availability)
NODE_ENV=development
```

### Scheduler Behavior
1. **Automatic Execution**: Runs every 30 minutes (configurable)
2. **Workspace Discovery**: Automatically detects active workspaces
3. **Error Handling**: Uses exponential backoff for failed requests
4. **Audit Logging**: Records all scheduler runs and results
5. **Rate Limiting**: Respects Shopify API limits with incremental syncs

## Testing

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test database
npm run db:test:setup
```

### Running Tests

#### Unit Tests
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test src/tests/alerts.test.ts

# Run tests in watch mode
npm run test:watch
```

#### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run specific integration test
npm run test src/tests/alerts.integration.test.ts
```

#### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

### Test Structure

#### Unit Tests (`src/tests/alerts.test.ts`)
- Alert creation rules (Low Stock, Out of Stock)
- Duplicate prevention logic
- Alert acknowledgment functionality
- Mock restock operations
- Scheduler execution
- Error handling scenarios

#### Integration Tests (`src/tests/alerts.integration.test.ts`)
- Complete workflow: Product → Alert → Acknowledge → Restock → Close
- Database operations and data integrity
- API endpoint interactions
- Audit trail verification
- Error scenario handling

### Test Data Management
- **Isolated Test Environment**: Uses separate test workspace IDs
- **Automatic Cleanup**: Removes test data after each test
- **Mock Data**: Realistic product and alert scenarios
- **Database Transactions**: Ensures test isolation

## Usage Examples

### Manual Inventory Check
```javascript
// Trigger inventory check for specific workspace
const response = await fetch('/api/alerts/inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    workspace_id: 'your-workspace-id',
    force: true 
  })
});

const result = await response.json();
console.log(`Created ${result.created} alerts, closed ${result.closed} alerts`);
```

### Acknowledge Alert
```javascript
// Acknowledge an alert
const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    acknowledged_by: 'user@example.com' 
  })
});
```

### Run Scheduler
```javascript
// Manually trigger scheduler
const response = await fetch('/api/alerts/scheduler', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    manual: true,
    workspace_id: 'specific-workspace' // Optional
  })
});
```

## Monitoring and Observability

### Audit Logs
All alert operations are logged in the `audit_logs` table:
- Alert creation and closure
- Acknowledgments
- Mock restock operations
- Scheduler runs
- Error events

### Scheduler Status
Monitor scheduler health via the status endpoint:
```bash
curl "/api/alerts/scheduler?action=status"
```

### Error Handling
- **Exponential Backoff**: Automatic retry with increasing delays
- **Graceful Degradation**: Continues processing other workspaces if one fails
- **Comprehensive Logging**: Detailed error messages and stack traces
- **Status Reporting**: Clear success/failure indicators

## Development

### Mock Restock Feature
Available only in development mode (`NODE_ENV !== 'production'`):
- Simulates product restocking
- Updates inventory quantities
- Triggers automatic alert closure
- Useful for testing complete workflows

### Debugging
```bash
# Enable debug logging
DEBUG=alerts:* npm run dev

# View audit logs
select * from audit_logs order by created_at desc limit 10;

# Check scheduler status
curl "http://localhost:3000/api/alerts/scheduler?action=status"
```

## Deployment

### Production Considerations
1. **Environment Variables**: Ensure all required env vars are set
2. **Database Migrations**: Run migrations before deployment
3. **Scheduler Setup**: Configure external cron or serverless scheduler
4. **Rate Limiting**: Monitor Shopify API usage
5. **Error Monitoring**: Set up alerting for failed scheduler runs

### Scaling
- **Horizontal Scaling**: Scheduler can run on multiple instances
- **Database Optimization**: Indexes are optimized for query patterns
- **Workspace Isolation**: Natural partitioning by workspace_id
- **Async Processing**: Non-blocking operations with proper error handling

## Troubleshooting

### Common Issues

#### No Alerts Generated
1. Check if products exist in the workspace
2. Verify inventory_quantity field is populated
3. Ensure workspace_id is correct
4. Check for existing open alerts (no duplicates created)

#### Scheduler Not Running
1. Verify scheduler endpoint is accessible
2. Check for rate limiting issues
3. Review audit logs for error details
4. Ensure proper environment configuration

#### Database Errors
1. Verify database connection
2. Check if migrations have been applied
3. Ensure proper permissions for authenticated role
4. Review RLS policies

### Support
For issues or questions, check the audit logs first:
```sql
SELECT * FROM audit_logs 
WHERE action = 'scheduler_error' 
ORDER BY created_at DESC 
LIMIT 5;
```

This will show recent scheduler errors with detailed error information in the payload field.