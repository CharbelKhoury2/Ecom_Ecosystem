import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Wrapper function to convert Web API handlers to Express handlers
const createWebAPIHandler = (handler) => {
  return async (req, res) => {
    try {
      // Convert Express request to Web API Request
      const url = new URL(req.url, `http://${req.get('host')}`);
      const webRequest = new Request(url.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
      });

      // Add query params and route params to the request
      webRequest.query = req.query;
      webRequest.params = req.params;

      // Call the Web API handler
      const webResponse = await handler(webRequest);

      // Convert Web API Response to Express response
      if (webResponse instanceof Response) {
        // Set status code
        res.status(webResponse.status);

        // Set headers
        webResponse.headers.forEach((value, key) => {
          res.set(key, value);
        });

        // Get response body
        const responseText = await webResponse.text();
        
        // Try to parse as JSON, if it fails send as text
        try {
          const jsonData = JSON.parse(responseText);
          res.json(jsonData);
        } catch {
          res.send(responseText);
        }
      } else {
        // Fallback for non-Response objects
        res.json(webResponse);
      }
    } catch (error) {
      console.error('Web API Handler Error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  };
};

// Function to dynamically load API routes
const loadAPIRoutes = async () => {
  // Load Test routes
  try {
    const testModule = await import('./src/api/test.js');
    app.use('/api/test', testModule.default || testModule);
    console.log('✅ Loaded Test API routes');
  } catch (error) {
    console.log('⚠️  Test API routes not found:', error.message);
  }
  
  // Load Shopify Test routes
  try {
    const shopifyTestModule = await import('./src/api/test-shopify.js');
    app.get('/api/test-shopify', shopifyTestModule.GET || ((req, res) => res.status(405).json({ error: 'Method not allowed' })));
    app.post('/api/test-shopify', shopifyTestModule.POST || ((req, res) => res.status(405).json({ error: 'Method not allowed' })));
    console.log('✅ Loaded Shopify Test API routes');
  } catch (error) {
    console.log('⚠️  Shopify Test API routes not found:', error.message);
  }
  
  // Load Shopify routes
  try {
    // Load individual Shopify endpoints
     const shopifyRoutes = [
       { path: '/orders', file: './src/api/shopify/orders.ts' },
       { path: '/products', file: './src/api/shopify/products.ts' },
       { path: '/auth', file: './src/api/shopify/auth.ts' },
       { path: '/analytics', file: './src/api/shopify/analytics.ts' },
       { path: '/inventory', file: './src/api/shopify/inventory.ts' }
     ];

    for (const route of shopifyRoutes) {
      try {
        const module = await import(route.file);
        if (module.GET) app.get(`/api/shopify${route.path}`, createWebAPIHandler(module.GET));
        if (module.POST) app.post(`/api/shopify${route.path}`, createWebAPIHandler(module.POST));
        console.log(`✅ Loaded Shopify ${route.path} routes`);
      } catch (error) {
        console.log(`⚠️  Shopify ${route.path} routes not found:`, error.message);
      }
    }
  } catch (error) {
    console.log('⚠️  Shopify API routes loading failed:', error.message);
  }
  
  // Load Meta routes
  try {
    const metaModule = await import('./src/api/meta/campaign-control.ts');
    if (metaModule.GET) app.get('/api/meta/campaign-control', createWebAPIHandler(metaModule.GET));
    if (metaModule.POST) app.post('/api/meta/campaign-control', createWebAPIHandler(metaModule.POST));
    console.log('✅ Loaded Meta API routes');
  } catch (error) {
    console.log('⚠️  Meta API routes not found:', error.message);
  }
  
  // Load Shipping routes
  try {
    const shippingModule = await import('./src/api/shipping/track.ts');
    if (shippingModule.GET) app.get('/api/shipping/track', createWebAPIHandler(shippingModule.GET));
    if (shippingModule.POST) app.post('/api/shipping/track', createWebAPIHandler(shippingModule.POST));
    console.log('✅ Loaded Shipping API routes');
  } catch (error) {
    console.log('⚠️  Shipping API routes not found:', error.message);
  }
  
  // Load Copilot routes
  try {
    const copilotModule = await import('./src/api/copilot/chat.js');
    app.use('/api/copilot', copilotModule.default || copilotModule);
    console.log('✅ Loaded Copilot API routes');
  } catch (error) {
    console.log('⚠️  Copilot API routes not found:', error.message);
  }
  
  // Load Real-time Data routes
  try {
    const realTimeDataModule = await import('./src/api/realtime/data.js');
    if (realTimeDataModule.GET) app.get('/api/realtime/data', createWebAPIHandler(realTimeDataModule.GET));
    if (realTimeDataModule.POST) app.post('/api/realtime/data', createWebAPIHandler(realTimeDataModule.POST));
    console.log('✅ Loaded Real-time Data API routes');
  } catch (error) {
    console.log('⚠️  Real-time Data API routes not found:', error.message);
  }
  
  // Load Metrics routes
  try {
    const metricsModule = await import('./src/api/metrics/true-pnl.js');
    app.use('/api/metrics', metricsModule.default || metricsModule);
    console.log('✅ Loaded Metrics API routes');
  } catch (error) {
    console.log('⚠️  Metrics API routes not found:', error.message);
  }
  
  // Load Alerts routes
  try {
    const alertsRoutes = [
      { path: '/inventory', file: './src/api/alerts/inventory.ts' },
      { path: '/acknowledge', file: './src/api/alerts/acknowledge.ts' },
      { path: '/manage', file: './src/api/alerts/manage.ts' },
      { path: '/scheduler', file: './src/api/alerts/scheduler.ts' }
    ];

    for (const route of alertsRoutes) {
      try {
        const module = await import(route.file);
        if (module.GET) app.get(`/api/alerts${route.path}`, createWebAPIHandler(module.GET));
        if (module.POST) app.post(`/api/alerts${route.path}`, createWebAPIHandler(module.POST));
        if (module.PATCH) app.patch(`/api/alerts${route.path}`, createWebAPIHandler(module.PATCH));
        console.log(`✅ Loaded Alerts ${route.path} routes`);
      } catch (error) {
        console.log(`⚠️  Alerts ${route.path} routes not found:`, error.message);
      }
    }
    
    // Add dynamic routes for alert-specific actions
    try {
      const mockRestockModule = await import('./src/api/alerts/mock_restock.ts');
      if (mockRestockModule.POST) app.post('/api/alerts/:alertId/mock_restock', createWebAPIHandler(mockRestockModule.POST));
      console.log('✅ Loaded Alerts mock_restock dynamic route');
    } catch (error) {
      console.log('⚠️  Alerts mock_restock route not found:', error.message);
    }
    
    try {
      const acknowledgeModule = await import('./src/api/alerts/acknowledge.ts');
      if (acknowledgeModule.PATCH) app.patch('/api/alerts/:alertId/acknowledge', createWebAPIHandler(acknowledgeModule.PATCH));
      console.log('✅ Loaded Alerts acknowledge dynamic route');
    } catch (error) {
      console.log('⚠️  Alerts acknowledge dynamic route not found:', error.message);
    }
  } catch (error) {
    console.log('⚠️  Alerts API routes loading failed:', error.message);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Load API routes
loadAPIRoutes().then(() => {
  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found` 
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}).catch((error) => {
  console.error('❌ Failed to load API routes:', error);
  process.exit(1);
});