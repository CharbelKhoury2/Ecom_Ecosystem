// Simple test endpoint for Shopify integration

export async function GET(request) {
  try {
    // Handle URL parsing more robustly
    let testType = 'connection';
    try {
      const url = new URL(request.url, 'http://localhost:3001');
      testType = url.searchParams.get('type') || 'connection';
    } catch (urlError) {
      console.log('URL parsing error:', urlError.message);
      // Extract type from query string manually if URL parsing fails
      const queryMatch = request.url.match(/[?&]type=([^&]*)/i);
      if (queryMatch) {
        testType = queryMatch[1];
      }
    }

    // Simple connection test
    if (testType === 'connection') {
      // Check if environment variables are set
      const hasShopifyConfig = !!(process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            connected: hasShopifyConfig,
            timestamp: new Date().toISOString(),
            error: hasShopifyConfig ? null : 'Shopify environment variables not configured',
            config: {
              shopDomain: process.env.SHOPIFY_SHOP_DOMAIN ? 'configured' : 'missing',
              accessToken: process.env.SHOPIFY_ACCESS_TOKEN ? 'configured' : 'missing',
              clientId: process.env.SHOPIFY_CLIENT_ID ? 'configured' : 'missing',
              clientSecret: process.env.SHOPIFY_CLIENT_SECRET ? 'configured' : 'missing'
            }
          }
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mock sales data
    if (testType === 'sales') {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            revenue: {
              today: 0,
              thisMonth: 0,
              growth: 0,
              lastUpdated: new Date().toISOString()
            },
            orders: {
              today: 0,
              thisMonth: 0,
              averageOrderValue: 0,
              conversionRate: 0
            },
            topProducts: []
          }
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mock inventory data
    if (testType === 'inventory') {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            products: {
              total: 0,
              lowStock: 0,
              outOfStock: 0,
              topSelling: []
            },
            alerts: [],
            lastUpdated: new Date().toISOString()
          }
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Default response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shopify integration test endpoint',
        availableTypes: ['connection', 'sales', 'inventory'],
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Test Shopify API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process test request',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === 'testConnection') {
      const hasShopifyConfig = !!(process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN);
      
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            connected: hasShopifyConfig,
            message: hasShopifyConfig ? 'Shopify configuration found' : 'Shopify configuration missing',
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Test Shopify POST error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to execute test action',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}