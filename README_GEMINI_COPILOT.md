# E-commerce Copilot with Google Gemini Integration

This document describes the complete implementation of the E-commerce Copilot system using Google Gemini API instead of OpenAI.

## Overview

The Copilot system provides AI-powered insights and recommendations for e-commerce businesses by analyzing Shopify and Meta Ads data. It uses Google Gemini for natural language processing and includes comprehensive caching, rate limiting, and usage tracking.

## Architecture

### Core Components

1. **Data Collector** (`src/utils/copilotContext.ts`)
   - Builds comprehensive context from database
   - Aggregates Shopify and Meta Ads metrics
   - Calculates derived metrics (ROAS, profit margins, etc.)
   - Identifies alerts and top performers

2. **Caching & Rate Limiting** (`src/utils/cacheAndRateLimit.ts`)
   - 30-second TTL caching per workspace
   - 5 requests/minute rate limiting per workspace
   - Memory-based implementation for simplicity

3. **Gemini Integration** (`src/api/copilot/query.ts`)
   - Google Gemini API integration
   - Function calling for structured recommendations
   - Safety measures and hallucination prevention

4. **Usage Tracking** (`src/utils/apiUsageTracking.ts`)
   - Per-workspace API usage monitoring
   - Token consumption tracking
   - Database persistence for analytics

## API Endpoint

### POST `/api/copilot/query`

**Request:**
```json
{
  "workspace_id": "string",
  "user_query": "string"
}
```

**Response:**
```json
{
  "context": {
    "workspace_id": "string",
    "timestamp": "string",
    "shopify": {
      "revenue_last_7_days": "number",
      "orders_last_7_days": "number",
      "average_order_value": "number",
      "top_skus": [{
        "sku": "string",
        "revenue": "number",
        "units_sold": "number"
      }]
    },
    "meta_ads": {
      "spend_last_7_days": "number",
      "impressions_last_7_days": "number",
      "clicks_last_7_days": "number",
      "top_campaigns": [{
        "campaign_name": "string",
        "spend": "number",
        "revenue": "number",
        "roas": "number"
      }]
    },
    "derived": {
      "blended_roas": "number",
      "gross_profit_yesterday": "number"
    },
    "alerts_count": "number"
  },
  "llm_response": "string",
  "recommendations": [{
    "actions": [{
      "action_type": "string",
      "target": "object",
      "confidence": "number",
      "explanation": "string"
    }]
  }],
  "tokens_used": "number"
}
```

**Headers:**
- `X-RateLimit-Limit`: Rate limit per minute
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
- `X-API-Tokens-Used`: Tokens used in this request
- `X-API-Session-Tokens`: Total session tokens
- `X-API-Session-Requests`: Total session requests

## Gemini Function Schema

The system uses Gemini's function calling feature for structured recommendations:

```json
{
  "name": "recommendation",
  "description": "Provide structured recommendations based on e-commerce data analysis",
  "parameters": {
    "type": "object",
    "properties": {
      "actions": {
        "type": "array",
        "description": "List of recommended actions",
        "items": {
          "type": "object",
          "properties": {
            "action_type": {
              "type": "string",
              "enum": [
                "increase_budget",
                "decrease_budget",
                "pause_campaign",
                "restock_product",
                "optimize_targeting",
                "adjust_bidding",
                "create_campaign",
                "update_product_price"
              ]
            },
            "target": {
              "type": "object",
              "description": "Target entity (campaign, product, etc.)"
            },
            "confidence": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Confidence level (0-1)"
            },
            "explanation": {
              "type": "string",
              "description": "Detailed explanation for the recommendation"
            }
          },
          "required": ["action_type", "target", "confidence", "explanation"]
        }
      }
    },
    "required": ["actions"]
  }
}
```

## Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (for data access)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Caching Configuration

```typescript
// Default settings in cacheAndRateLimit.ts
const CACHE_TTL = 30 * 1000; // 30 seconds
const RATE_LIMIT = 5; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute
```

### Usage Limits

```typescript
// Default limits in apiUsageTracking.ts
const DAILY_TOKEN_LIMIT = 100000;
const DAILY_REQUEST_LIMIT = 1000;
const SESSION_TOKEN_LIMIT = 10000;
const SESSION_REQUEST_LIMIT = 100;
```

## Database Schema

### API Usage Logs Table

```sql
CREATE TABLE api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_usage_workspace_date ON api_usage_logs(workspace_id, DATE(created_at));
CREATE INDEX idx_api_usage_session ON api_usage_logs(session_id, created_at);
```

### Required Data Tables

The system expects these tables to exist:

- `shopify_orders`: Order data with revenue, dates
- `shopify_products`: Product catalog with SKUs, pricing, inventory
- `meta_campaigns`: Campaign performance data
- `meta_ads`: Ad-level metrics

## Safety Measures

### Hallucination Prevention

1. **Data Validation**: All responses are validated against available context data
2. **Fallback Responses**: Rule-based responses when Gemini is unavailable
3. **Confidence Scoring**: Recommendations include confidence levels
4. **Audit Logging**: All interactions are logged for review

### Response Validation

```typescript
function validateAndSanitizeResponse(response: string, context: any): string {
  // Remove any references to data not in context
  // Validate numerical claims against actual metrics
  // Ensure recommendations are actionable
  // Log suspicious responses for review
}
```

## Testing

### Unit Tests

```bash
npm run test src/tests/copilot.test.ts
```

Tests cover:
- Context building and caching
- Rate limiting functionality
- Usage tracking accuracy
- Data aggregation correctness

### Integration Tests

```bash
npm run test src/tests/copilot.integration.test.ts
```

Tests cover:
- Full API endpoint functionality
- Error handling scenarios
- Rate limiting behavior
- Gemini API integration
- Function calling with recommendations

### Manual Testing

```bash
# Start development server
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/api/copilot/query \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "test-workspace",
    "user_query": "What are my top performing products?"
  }'
```

## Performance Considerations

### Database Optimization

1. **Aggregated Queries**: Use SQL aggregations instead of application-level calculations
2. **Indexed Lookups**: Ensure proper indexing on workspace_id and date fields
3. **Connection Pooling**: Use Supabase connection pooling for scalability

### Caching Strategy

1. **Context Caching**: 30-second TTL reduces database load
2. **Memory Storage**: In-memory caching for development simplicity
3. **Cache Invalidation**: Automatic expiration prevents stale data

### Rate Limiting

1. **Per-Workspace Limits**: Prevents abuse while allowing legitimate usage
2. **Sliding Window**: More accurate than fixed-window rate limiting
3. **Graceful Degradation**: Clear error messages with retry timing

## Monitoring and Analytics

### Usage Analytics

```sql
-- Daily usage summary
SELECT 
  workspace_id,
  DATE(created_at) as date,
  SUM(tokens_used) as total_tokens,
  SUM(request_count) as total_requests
FROM api_usage_logs 
GROUP BY workspace_id, DATE(created_at)
ORDER BY date DESC;

-- Top consumers
SELECT 
  workspace_id,
  SUM(tokens_used) as total_tokens,
  COUNT(*) as total_requests
FROM api_usage_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY workspace_id
ORDER BY total_tokens DESC;
```

### Error Monitoring

- Monitor Gemini API response times and error rates
- Track cache hit/miss ratios
- Alert on unusual usage patterns
- Log validation failures for model improvement

## Security

### API Key Management

1. **Environment Variables**: Store keys securely in environment
2. **No Logging**: Never log API keys or sensitive data
3. **Rotation**: Regular key rotation recommended
4. **Scope Limitation**: Use minimum required permissions

### Data Privacy

1. **Workspace Isolation**: Data is strictly isolated by workspace_id
2. **Minimal Data**: Only necessary data is sent to Gemini
3. **Retention Policies**: Implement data retention policies
4. **Audit Trails**: Comprehensive logging for compliance

## Deployment

### Production Checklist

- [ ] Set GEMINI_API_KEY environment variable
- [ ] Configure Supabase connection
- [ ] Run database migrations
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting for production load
- [ ] Test error handling scenarios
- [ ] Verify security measures

### Scaling Considerations

1. **Horizontal Scaling**: Stateless design supports multiple instances
2. **Database Scaling**: Consider read replicas for high load
3. **Cache Scaling**: Move to Redis for distributed caching
4. **Rate Limiting**: Consider distributed rate limiting solutions

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**: Check workspace usage patterns
2. **Cache Misses**: Verify TTL configuration
3. **Gemini API Errors**: Check API key and quota
4. **Database Timeouts**: Optimize queries and indexing

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG_COPILOT = 'true';
```

### Health Checks

```bash
# Check API health
curl http://localhost:3000/api/health

# Check database connectivity
npm run db:check

# Verify Gemini API access
npm run gemini:test
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run tests
npm run test

# Start development server
npm run dev
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Write comprehensive tests
- Document complex functions
- Use meaningful variable names

### Pull Request Process

1. Create feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit pull request with clear description

## License

This project is licensed under the MIT License.