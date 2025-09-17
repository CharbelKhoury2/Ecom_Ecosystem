import { supabase } from '../../lib/supabase-server';
import { getShopifyAPIFromEnv, getShopifyAPI } from '../../lib/shopify';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const useEnvCredentials = url.searchParams.get('useEnv') === 'true';
    const lowStockThreshold = parseInt(url.searchParams.get('threshold') || '10');

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
          JSON.stringify({ error: 'Missing userId parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      shopifyAPI = await getShopifyAPI(userId);
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify not connected for user' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch products from Shopify
    const products = await shopifyAPI.fetchProducts();

    // Process inventory data
    const inventoryData = {
      totalProducts: 0,
      totalVariants: 0,
      totalInventoryValue: 0,
      lowStockItems: [],
      outOfStockItems: [],
      inventoryByProduct: [],
      inventorySummary: {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      }
    };

    products.forEach(product => {
      inventoryData.totalProducts++;
      
      const productInventory = {
        productId: product.id,
        productTitle: product.title,
        variants: [],
        totalQuantity: 0,
        totalValue: 0
      };

      product.variants.forEach(variant => {
        inventoryData.totalVariants++;
        
        const quantity = variant.inventory_quantity || 0;
        const price = parseFloat(variant.price);
        const cost = parseFloat(variant.cost || '0');
        const value = price * quantity;
        
        inventoryData.totalInventoryValue += value;
        productInventory.totalQuantity += quantity;
        productInventory.totalValue += value;

        const variantData = {
          variantId: variant.id,
          sku: variant.sku || 'N/A',
          title: `${product.title}${variant.title !== 'Default Title' ? ` - ${variant.title}` : ''}`,
          price,
          cost,
          quantity,
          value,
          status: quantity === 0 ? 'out_of_stock' : quantity <= lowStockThreshold ? 'low_stock' : 'in_stock'
        };

        productInventory.variants.push(variantData);

        // Categorize inventory status
        if (quantity === 0) {
          inventoryData.inventorySummary.outOfStock++;
          inventoryData.outOfStockItems.push(variantData);
        } else if (quantity <= lowStockThreshold) {
          inventoryData.inventorySummary.lowStock++;
          inventoryData.lowStockItems.push(variantData);
        } else {
          inventoryData.inventorySummary.inStock++;
        }
      });

      inventoryData.inventoryByProduct.push(productInventory);
    });

    // Sort low stock and out of stock items by quantity (ascending)
    inventoryData.lowStockItems.sort((a, b) => a.quantity - b.quantity);
    inventoryData.outOfStockItems.sort((a, b) => a.title.localeCompare(b.title));

    // Round monetary values
    inventoryData.totalInventoryValue = Math.round(inventoryData.totalInventoryValue * 100) / 100;
    inventoryData.inventoryByProduct.forEach(product => {
      product.totalValue = Math.round(product.totalValue * 100) / 100;
    });

    return new Response(
      JSON.stringify({
        success: true,
        inventory: inventoryData,
        settings: {
          lowStockThreshold,
          lastUpdated: new Date().toISOString()
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify inventory error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch inventory data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, useEnvCredentials = false } = await request.json();

    let shopifyAPI;
    
    if (useEnvCredentials) {
      shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify environment credentials not configured' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      shopifyAPI = await getShopifyAPI(userId);
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify not connected for user' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch and sync inventory data
    const products = await shopifyAPI.fetchProducts();
    
    const inventoryRecords = [];
    for (const product of products) {
      for (const variant of product.variants) {
        inventoryRecords.push({
          user_id: userId || 'system',
          product_id: product.id.toString(),
          variant_id: variant.id.toString(),
          sku: variant.sku || null,
          title: `${product.title}${variant.title !== 'Default Title' ? ` - ${variant.title}` : ''}`,
          price: parseFloat(variant.price),
          cost: parseFloat(variant.cost || '0'),
          inventory_quantity: variant.inventory_quantity || 0,
          last_updated: new Date().toISOString(),
          synced_at: new Date().toISOString()
        });
      }
    }

    // Store inventory data
    if (inventoryRecords.length > 0) {
      const { error } = await supabase
        .from('shopify_inventory')
        .upsert(inventoryRecords, {
          onConflict: 'user_id,product_id,variant_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Database error storing inventory:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store inventory data' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inventoryItemsProcessed: inventoryRecords.length,
        uniqueProducts: products.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify inventory sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync inventory data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}