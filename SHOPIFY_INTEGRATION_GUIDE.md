# Shopify Integration Guide

## Overview

This guide explains how to set up and use the Shopify integration with Neo AI Copilot. The integration allows Neo to access real-time data from your Shopify store, including products, orders, inventory, and analytics.

## 🚀 Quick Setup

### 1. Shopify App Configuration

1. **Create a Shopify App**:
   - Go to your Shopify Partner Dashboard
   - Create a new app or use an existing one
   - Note down your Client ID and Client Secret

2. **Configure API Permissions**:
   Your app needs the following scopes:
   ```
   read_products
   read_orders
   read_inventory
   read_analytics
   read_reports
   read_customers
   ```

3. **Generate Admin API Access Token**:
   - Install your app on your Shopify store
   - Generate an Admin API access token
   - This token will be used for API calls

### 2. Environment Configuration

Update your `.env` file with the following variables:

```env
# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=your-shop-name.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_api_access_token_here
SHOPIFY_CLIENT_ID=your_client_id_here
SHOPIFY_CLIENT_SECRET=your_client_secret_here
SHOPIFY_API_VERSION=2024-01
```

**Important**: Replace the placeholder values with your actual Shopify credentials.

### 3. Verify Integration

Run the test script to verify your integration:

```bash
node test-shopify-integration.js
```

This will test:
- Environment configuration
- API connectivity
- Data retrieval
- Caching performance

## 📊 Available Features

### Real-time Data Access

- **Sales Data**: Revenue, orders, conversion rates
- **Inventory Management**: Stock levels, low stock alerts
- **Product Analytics**: Top-selling products, performance metrics
- **Order Tracking**: Order status, fulfillment data
- **Customer Insights**: Customer behavior and retention

### API Endpoints

#### 1. Products
```http
GET /api/shopify/products?userId=USER_ID
POST /api/shopify/products
```

#### 2. Orders
```http
GET /api/shopify/orders?userId=USER_ID&days=30
POST /api/shopify/orders
```

#### 3. Inventory
```http
GET /api/shopify/inventory?useEnv=true&threshold=10
POST /api/shopify/inventory
```

#### 4. Analytics
```http
GET /api/shopify/analytics?useEnv=true&days=30
```

#### 5. Real-time Data
```http
GET /api/realtime/data?type=sales
GET /api/realtime/data?type=inventory
GET /api/realtime/data?type=analytics
```

### Neo AI Integration

Neo can now access and analyze your Shopify data to provide:

- **Sales Insights**: "Show me today's sales performance"
- **Inventory Alerts**: "Which products are running low?"
- **Product Analysis**: "What are my top-selling products this month?"
- **Order Management**: "How many orders do I have pending?"
- **Business Intelligence**: "Generate a sales report for the last 30 days"

## 🔧 Configuration Options

### Authentication Methods

1. **Environment Variables** (Recommended for development):
   - Uses admin API access token from `.env`
   - Suitable for single-store setups

2. **User-specific Credentials**:
   - Stores encrypted credentials per user
   - Suitable for multi-tenant applications

### Caching Configuration

- **Cache Duration**: 5 minutes (configurable)
- **Cache Types**: Sales data, inventory data, analytics
- **Cache Management**: Automatic expiration and manual refresh

### Rate Limiting

- **API Calls**: Respects Shopify's rate limits
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error reporting

## 🛡️ Security Features

### Data Protection

- **Encrypted Storage**: User credentials are encrypted
- **Environment Variables**: Sensitive data in `.env`
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all inputs

### Error Handling

- **Graceful Degradation**: Fallback to cached data
- **Detailed Logging**: Comprehensive error tracking
- **User-friendly Messages**: Clear error explanations

### Access Control

- **API Key Validation**: Optional API key protection
- **CORS Configuration**: Controlled cross-origin access
- **Request Logging**: Audit trail for all requests

## 🔍 Troubleshooting

### Common Issues

1. **"Shopify not configured" Error**:
   - Check your `.env` file
   - Verify all required variables are set
   - Ensure no extra spaces or quotes

2. **"Authentication failed" Error**:
   - Verify your access token is valid
   - Check token permissions/scopes
   - Ensure your app is installed on the store

3. **"Rate limit exceeded" Error**:
   - Wait for the rate limit to reset
   - Implement request queuing
   - Consider caching strategies

4. **"Resource not found" Error**:
   - Verify the resource exists in Shopify
   - Check API endpoint URLs
   - Ensure proper API version

### Debug Mode

Enable debug mode for detailed error information:

```env
NODE_ENV=development
```

This will include:
- Full error stack traces
- Request/response details
- Performance metrics

### Health Check

Monitor integration health:

```http
GET /api/test-shopify?type=connection
```

Returns:
- Connection status
- Configuration validation
- API accessibility

## 📈 Performance Optimization

### Caching Strategy

- **Smart Caching**: Automatic cache invalidation
- **Selective Updates**: Update only changed data
- **Background Refresh**: Preload frequently accessed data

### API Optimization

- **Batch Requests**: Combine multiple API calls
- **Pagination**: Handle large datasets efficiently
- **Field Selection**: Request only needed data

### Monitoring

- **Response Times**: Track API performance
- **Error Rates**: Monitor failure patterns
- **Cache Hit Rates**: Optimize caching strategy

## 🔄 Data Synchronization

### Automatic Sync

- **Scheduled Updates**: Regular data refresh
- **Real-time Updates**: Webhook integration (optional)
- **Incremental Sync**: Update only changed records

### Manual Sync

```http
POST /api/realtime/data
{
  "action": "refreshData"
}
```

### Sync Status

```http
GET /api/realtime/data?type=freshness
```

## 🚀 Advanced Usage

### Custom Queries

Neo supports natural language queries:

- "Show me products with less than 10 items in stock"
- "What's my average order value this month?"
- "Which products have the highest return rate?"
- "Generate a sales trend chart for the last quarter"

### Data Export

Export data in various formats:

- **JSON**: Raw data for integrations
- **CSV**: Spreadsheet-compatible format
- **Charts**: Visual data representations
- **Reports**: Formatted business reports

### Webhooks (Optional)

Set up webhooks for real-time updates:

1. Configure webhook endpoints in Shopify
2. Point to your server's webhook handler
3. Enable automatic data synchronization

## 📞 Support

### Getting Help

1. **Check Logs**: Review server and application logs
2. **Test Integration**: Run the test script
3. **Verify Configuration**: Double-check environment variables
4. **Review Documentation**: Shopify API documentation

### Common Commands

```bash
# Test integration
node test-shopify-integration.js

# Check server logs
npm run dev:api

# Verify environment
echo $SHOPIFY_SHOP_DOMAIN

# Health check
curl http://localhost:3001/health
```

---

**Note**: This integration is designed to work seamlessly with Neo AI Copilot. Once configured, Neo will automatically have access to your Shopify data and can provide intelligent insights and assistance with your e-commerce operations.