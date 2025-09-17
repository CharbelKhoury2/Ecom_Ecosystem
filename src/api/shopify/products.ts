import { supabase } from '../../lib/supabase-server';
import { getShopifyAPI, getShopifyAPIFromEnv } from '../../lib/shopify';

export async function POST(request: Request) {
  try {
    const { userId, useEnvCredentials = false } = await request.json();

    let shopifyAPI;
    
    if (useEnvCredentials) {
      // Use environment variables (admin API)
      shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify environment credentials not configured' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Use user-specific credentials
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      shopifyAPI = await getShopifyAPI(userId);
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify not connected' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch products from Shopify
    const products = await shopifyAPI.fetchProducts();

    // Process and store products
    const productRecords = [];
    for (const product of products) {
      for (const variant of product.variants) {
        productRecords.push({
          user_id: userId || 'system',
          product_id: product.id.toString(),
          sku: variant.sku || null,
          name: `${product.title}${variant.title !== 'Default Title' ? ` - ${variant.title}` : ''}`,
          cost_per_item: parseFloat(variant.cost || '0'),
          stock_quantity: variant.inventory_quantity || 0,
          price: parseFloat(variant.price),
          last_updated: new Date().toISOString(),
          synced_at: new Date().toISOString(),
        });
      }
    }

    // Batch insert products
    if (productRecords.length > 0) {
      const { error } = await supabase
        .from('shopify_products')
        .upsert(productRecords, {
          onConflict: 'user_id,product_id,sku',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Database error inserting products:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store products' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        productsProcessed: productRecords.length,
        uniqueProducts: products.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify products sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync products' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: products, error } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Database error fetching products:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ products: products || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get products error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}