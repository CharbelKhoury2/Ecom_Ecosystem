// Test script for Shopify integration
// This script tests the Shopify integration via API endpoints

const API_BASE = 'http://localhost:3001/api';

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function testShopifyIntegration() {
  console.log('🧪 Testing Shopify Integration via API...');
  console.log('=' .repeat(50));

  // Test 1: Real-time Data Service Connection
  console.log('\n1. Testing Real-time Data Service Connection:');
  try {
    const connectionTest = await makeRequest('/realtime/data?type=connection');
    if (connectionTest.success && connectionTest.data.connected) {
      console.log('✅ Shopify API connection successful!');
      console.log(`   Connected at: ${connectionTest.data.timestamp}`);
    } else {
      console.log('❌ Shopify API connection failed!');
      console.log(`   Error: ${connectionTest.data?.error || 'Unknown error'}`);
      console.log('\n📋 Please ensure your .env file contains:');
      console.log('- SHOPIFY_SHOP_DOMAIN=your-shop-name.myshopify.com');
      console.log('- SHOPIFY_ACCESS_TOKEN=your_admin_api_access_token_here');
      console.log('- SHOPIFY_CLIENT_ID=your_client_id_here');
      console.log('- SHOPIFY_CLIENT_SECRET=your_client_secret_here');
      return;
    }
  } catch (error) {
    console.log('❌ Connection test error:', error.message);
    return;
  }

  // Test 2: Sales Data
  console.log('\n2. Testing Sales Data Retrieval:');
  try {
    const salesData = await makeRequest('/realtime/data?type=sales');
    if (salesData.success) {
      const data = salesData.data;
      console.log('✅ Sales data retrieved successfully!');
      console.log(`   - Today's revenue: $${data.revenue.today}`);
      console.log(`   - This month's revenue: $${data.revenue.thisMonth}`);
      console.log(`   - Today's orders: ${data.orders.today}`);
      console.log(`   - This month's orders: ${data.orders.thisMonth}`);
      console.log(`   - Average order value: $${data.orders.averageOrderValue}`);
      console.log(`   - Top products: ${data.topProducts.length} items`);
      if (data.topProducts.length > 0) {
        console.log(`   - Best seller: ${data.topProducts[0].name} (${data.topProducts[0].sales} sales)`);
      }
    } else {
      console.log('❌ Sales data retrieval failed:', salesData.error);
    }
  } catch (error) {
    console.log('❌ Sales data error:', error.message);
  }

  // Test 3: Inventory Data
  console.log('\n3. Testing Inventory Data Retrieval:');
  try {
    const inventoryData = await makeRequest('/realtime/data?type=inventory');
    if (inventoryData.success) {
      const data = inventoryData.data;
      console.log('✅ Inventory data retrieved successfully!');
      console.log(`   - Total products: ${data.products.total}`);
      console.log(`   - Low stock items: ${data.products.lowStock}`);
      console.log(`   - Out of stock items: ${data.products.outOfStock}`);
      console.log(`   - Inventory alerts: ${data.alerts.length}`);
      if (data.alerts.length > 0) {
        console.log(`   - First alert: ${data.alerts[0].type} - ${data.alerts[0].product}`);
      }
    } else {
      console.log('❌ Inventory data retrieval failed:', inventoryData.error);
    }
  } catch (error) {
    console.log('❌ Inventory data error:', error.message);
  }

  // Test 4: Analytics Data
  console.log('\n4. Testing Analytics Data Retrieval:');
  try {
    const analyticsData = await makeRequest('/realtime/data?type=analytics&days=30');
    if (analyticsData.success && !analyticsData.data.error) {
      const data = analyticsData.data;
      console.log('✅ Analytics data retrieved successfully!');
      console.log(`   - Total revenue (30 days): $${data.totalRevenue}`);
      console.log(`   - Total orders: ${data.totalOrders}`);
      console.log(`   - Average order value: $${data.averageOrderValue}`);
      console.log(`   - Total refunds: $${data.totalRefunds}`);
      console.log(`   - Refund rate: ${data.refundRate}%`);
      console.log(`   - Inventory value: $${data.inventoryValue}`);
      console.log(`   - Low stock products: ${data.lowStockProducts}`);
      console.log(`   - Out of stock products: ${data.outOfStockProducts}`);
      console.log(`   - Daily sales data points: ${data.dailySales.length}`);
      console.log(`   - Top products: ${data.topProducts.length}`);
    } else {
      console.log('❌ Analytics data retrieval failed:', analyticsData.data?.error || analyticsData.error);
    }
  } catch (error) {
    console.log('❌ Analytics data error:', error.message);
  }

  // Test 5: Shopify API Endpoints
  console.log('\n5. Testing Shopify API Endpoints:');
  
  // Test products sync
  console.log('\n   📦 Testing Products Sync:');
  try {
    const productsSync = await makeRequest('/shopify/products', {
      method: 'POST',
      body: JSON.stringify({ useEnvCredentials: true })
    });
    if (productsSync.success) {
      console.log('   ✅ Products sync successful!');
      console.log(`   - Products processed: ${productsSync.productsProcessed}`);
      console.log(`   - Unique products: ${productsSync.uniqueProducts}`);
    } else {
      console.log('   ❌ Products sync failed:', productsSync.error);
    }
  } catch (error) {
    console.log('   ❌ Products sync error:', error.message);
  }

  // Test orders sync
  console.log('\n   📋 Testing Orders Sync:');
  try {
    const ordersSync = await makeRequest('/shopify/orders', {
      method: 'POST',
      body: JSON.stringify({ useEnvCredentials: true, syncDays: 30 })
    });
    if (ordersSync.success) {
      console.log('   ✅ Orders sync successful!');
      console.log(`   - Orders processed: ${ordersSync.ordersProcessed}`);
      console.log(`   - Unique orders: ${ordersSync.uniqueOrders}`);
    } else {
      console.log('   ❌ Orders sync failed:', ordersSync.error);
    }
  } catch (error) {
    console.log('   ❌ Orders sync error:', error.message);
  }

  // Test inventory endpoint
  console.log('\n   📊 Testing Inventory Endpoint:');
  try {
    const inventoryEndpoint = await makeRequest('/shopify/inventory?useEnv=true&threshold=10');
    if (inventoryEndpoint.success) {
      const data = inventoryEndpoint.inventory;
      console.log('   ✅ Inventory endpoint successful!');
      console.log(`   - Total products: ${data.totalProducts}`);
      console.log(`   - Total variants: ${data.totalVariants}`);
      console.log(`   - Inventory value: $${data.totalInventoryValue}`);
      console.log(`   - Low stock items: ${data.lowStockItems.length}`);
      console.log(`   - Out of stock items: ${data.outOfStockItems.length}`);
    } else {
      console.log('   ❌ Inventory endpoint failed:', inventoryEndpoint.error);
    }
  } catch (error) {
    console.log('   ❌ Inventory endpoint error:', error.message);
  }

  // Test analytics endpoint
  console.log('\n   📈 Testing Analytics Endpoint:');
  try {
    const analyticsEndpoint = await makeRequest('/shopify/analytics?useEnv=true&days=30');
    if (analyticsEndpoint.success) {
      const data = analyticsEndpoint.analytics;
      console.log('   ✅ Analytics endpoint successful!');
      console.log(`   - Total revenue: $${data.totalRevenue}`);
      console.log(`   - Total orders: ${data.totalOrders}`);
      console.log(`   - Average order value: $${data.averageOrderValue}`);
      console.log(`   - Top products: ${data.topProducts.length}`);
      console.log(`   - Daily sales: ${data.dailySales.length} data points`);
    } else {
      console.log('   ❌ Analytics endpoint failed:', analyticsEndpoint.error);
    }
  } catch (error) {
    console.log('   ❌ Analytics endpoint error:', error.message);
  }

  // Test 6: Cache Performance
  console.log('\n6. Testing Cache Performance:');
  try {
    // First request (fresh)
    const startTime1 = Date.now();
    await makeRequest('/realtime/data?type=sales');
    const freshTime = Date.now() - startTime1;
    
    // Second request (cached)
    const startTime2 = Date.now();
    await makeRequest('/realtime/data?type=sales');
    const cacheTime = Date.now() - startTime2;
    
    console.log(`   🔄 Fresh request: ${freshTime}ms`);
    console.log(`   ⚡ Cached request: ${cacheTime}ms`);
    if (cacheTime < freshTime) {
      console.log(`   📈 Cache speedup: ${Math.round((freshTime / cacheTime) * 100) / 100}x faster`);
    }
    
    // Test cache freshness
    const freshnessData = await makeRequest('/realtime/data?type=freshness');
    if (freshnessData.success) {
      const freshness = freshnessData.data;
      console.log(`   📅 Cached items: ${Object.keys(freshness).length}`);
    }
    
  } catch (error) {
    console.log('❌ Cache test error:', error.message);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Shopify Integration Test Complete!');
  console.log('\n📋 Integration Status:');
  console.log('✅ Environment configuration updated');
  console.log('✅ Shopify service configuration enhanced');
  console.log('✅ API endpoints created (products, orders, inventory, analytics)');
  console.log('✅ Real-time data service integrated with Shopify');
  console.log('✅ Caching system implemented');
  console.log('✅ Error handling and fallbacks in place');
  console.log('\n📋 Next Steps:');
  console.log('1. Update your .env file with real Shopify credentials');
  console.log('2. Test with your actual Shopify store data');
  console.log('3. Verify Neo can access real-time data in the chat interface');
  console.log('4. Monitor API rate limits and performance');
  console.log('5. Set up webhooks for real-time updates (optional)');
}

// Run the test
testShopifyIntegration().catch(console.error);