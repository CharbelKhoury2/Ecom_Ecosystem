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
  
  // Load Shopify routes
  try {
    const shopifyModule = await import('./src/api/shopify/orders.js');
    app.use('/api/shopify', shopifyModule.default || shopifyModule);
    console.log('✅ Loaded Shopify API routes');
  } catch (error) {
    console.log('⚠️  Shopify API routes not found:', error.message);
  }
  
  // Load Meta routes
  try {
    const metaModule = await import('./src/api/meta/campaign-control.js');
    app.use('/api/meta', metaModule.default || metaModule);
    console.log('✅ Loaded Meta API routes');
  } catch (error) {
    console.log('⚠️  Meta API routes not found:', error.message);
  }
  
  // Load Shipping routes
  try {
    const shippingModule = await import('./src/api/shipping/track.js');
    app.use('/api/shipping', shippingModule.default || shippingModule);
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
    app.use('/api/realtime', realTimeDataModule.default || realTimeDataModule);
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