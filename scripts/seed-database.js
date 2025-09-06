import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate dates in the last 14 days
function getRandomDateInLast14Days() {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const randomTime = fourteenDaysAgo.getTime() + Math.random() * (now.getTime() - fourteenDaysAgo.getTime());
  return new Date(randomTime).toISOString();
}

// Helper function to generate random IDs
function generateRandomId(prefix = '', length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Sample products data
const products = [
  {
    id: generateRandomId('prod_'),
    name: 'Wireless Bluetooth Headphones',
    sku: 'WBH-001',
    price: 79.99,
    cost: 35.00,
    stock_quantity: 5, // Low stock
    category: 'Electronics',
    description: 'High-quality wireless headphones with noise cancellation',
    image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20headphones%20product%20photo&image_size=square'
  },
  {
    id: generateRandomId('prod_'),
    name: 'Smart Fitness Watch',
    sku: 'SFW-002',
    price: 199.99,
    cost: 89.00,
    stock_quantity: 0, // Out of stock
    category: 'Wearables',
    description: 'Advanced fitness tracking with heart rate monitor',
    image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20watch%20product%20photo&image_size=square'
  },
  {
    id: generateRandomId('prod_'),
    name: 'Organic Cotton T-Shirt',
    sku: 'OCT-003',
    price: 29.99,
    cost: 12.00,
    stock_quantity: 150,
    category: 'Clothing',
    description: 'Comfortable organic cotton t-shirt in various colors',
    image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20t-shirt%20product%20photo&image_size=square'
  },
  {
    id: generateRandomId('prod_'),
    name: 'Stainless Steel Water Bottle',
    sku: 'SSWB-004',
    price: 24.99,
    cost: 8.50,
    stock_quantity: 3, // Low stock
    category: 'Accessories',
    description: 'Insulated stainless steel water bottle, 32oz',
    image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=stainless%20steel%20water%20bottle%20product%20photo&image_size=square'
  },
  {
    id: generateRandomId('prod_'),
    name: 'Laptop Stand Adjustable',
    sku: 'LSA-005',
    price: 49.99,
    cost: 22.00,
    stock_quantity: 75,
    category: 'Office',
    description: 'Ergonomic adjustable laptop stand for better posture',
    image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=adjustable%20laptop%20stand%20product%20photo&image_size=square'
  }
];

// Generate Shopify orders
function generateShopifyOrders(products) {
  const orders = [];
  
  for (let i = 0; i < 50; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const totalPrice = product.price * quantity;
    const order = {
      order_id: generateRandomId('shop_', 10),
      sku: product.sku,
      product_id: product.id,
      quantity: quantity,
      revenue: totalPrice,
      total_price: totalPrice,
      shipping_cost: Math.random() * 10,
      refunds: 0,
      currency: 'USD',
      date_created: getRandomDateInLast14Days(),
      synced_at: getRandomDateInLast14Days()
    };
    orders.push(order);
  }
  
  return orders;
}

// Generate Meta campaigns
function generateMetaCampaigns() {
  const campaigns = [
    {
      id: generateRandomId('camp_'),
      campaign_id: generateRandomId('meta_', 12),
      name: 'Holiday Electronics Sale',
      status: 'active',
      daily_budget: 150.00,
      total_spend: 2100.00,
      impressions: 45000,
      clicks: 890,
      conversions: 23,
      revenue: 1840.00,
      roas: 0.88, // Poor ROAS
      ctr: 1.98,
      cpc: 2.36,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    },
    {
      id: generateRandomId('camp_'),
      campaign_id: generateRandomId('meta_', 12),
      name: 'Fitness Watch Promotion',
      status: 'paused',
      daily_budget: 100.00,
      total_spend: 850.00,
      impressions: 28000,
      clicks: 560,
      conversions: 8,
      revenue: 1599.92,
      roas: 1.88, // Good ROAS
      ctr: 2.00,
      cpc: 1.52,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    },
    {
      id: generateRandomId('camp_'),
      campaign_id: generateRandomId('meta_', 12),
      name: 'Summer Apparel Collection',
      status: 'active',
      daily_budget: 200.00,
      total_spend: 1680.00,
      impressions: 67000,
      clicks: 1340,
      conversions: 45,
      revenue: 1349.55,
      roas: 0.80, // Poor ROAS
      ctr: 2.00,
      cpc: 1.25,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    },
    {
      id: generateRandomId('camp_'),
      campaign_id: generateRandomId('meta_', 12),
      name: 'Office Accessories Bundle',
      status: 'active',
      daily_budget: 75.00,
      total_spend: 525.00,
      impressions: 18500,
      clicks: 370,
      conversions: 21,
      revenue: 1049.79,
      roas: 2.00, // Good ROAS
      ctr: 2.00,
      cpc: 1.42,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    }
  ];
  
  return campaigns;
}

// Generate alerts
function generateAlerts(products) {
  const alerts = [];
  
  // Low stock alerts
  products.filter(p => p.stock_quantity <= 5 && p.stock_quantity > 0).forEach(product => {
    alerts.push({
      type: 'low_stock',
      sku: product.sku,
      message: `Product ${product.name} (SKU: ${product.sku}) has only ${product.stock_quantity} units remaining in stock.`,
      severity: 'warning',
      status: 'open',
      workspace_id: 'default_workspace',
      product_id: product.id,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    });
  });
  
  // Out of stock alerts
  products.filter(p => p.stock_quantity === 0).forEach(product => {
    alerts.push({
      type: 'out_of_stock',
      sku: product.sku,
      message: `Product ${product.name} (SKU: ${product.sku}) is completely out of stock and needs immediate restocking.`,
      severity: 'critical',
      status: 'open',
      workspace_id: 'default_workspace',
      product_id: product.id,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    });
  });
  
  // Campaign performance alerts
  alerts.push({
    type: 'campaign_performance',
    sku: 'CAMPAIGN-001',
    message: 'Multiple campaigns showing ROAS below 1.0. Consider pausing or optimizing these campaigns.',
    severity: 'warning',
    status: 'open',
    workspace_id: 'default_workspace',
    product_id: 'campaign_performance_alert',
    created_at: getRandomDateInLast14Days(),
    updated_at: getRandomDateInLast14Days()
  });
  
  return alerts;
}

// Generate shipments
function generateShipments() {
  const carriers = ['DHL', 'FedEx', 'UPS'];
  const statuses = ['Label Created', 'Picked Up', 'In Transit', 'Delivered'];
  const shipments = [];
  
  for (let i = 0; i < 15; i++) {
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    shipments.push({
      user_id: '00000000-0000-0000-0000-000000000000', // Default user ID
      order_id: generateRandomId('order_', 8),
      tracking_number: generateRandomId(carrier.substring(0, 3).toUpperCase(), 10),
      provider: carrier.toLowerCase(),
      provider_name: carrier,
      status: status,
      cost: Math.random() * 20 + 5, // Random cost between $5-25
      estimated_delivery: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      current_location: `${carrier} Facility - City ${i + 1}`,
      created_at: getRandomDateInLast14Days(),
      updated_at: getRandomDateInLast14Days()
    });
  }
  
  return shipments;
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('shipments').delete().neq('id', '');
    await supabase.from('alerts').delete().neq('id', '');
    await supabase.from('meta_campaigns').delete().neq('id', '');
    await supabase.from('shopify_orders').delete().neq('id', '');
    await supabase.from('products').delete().neq('id', '');
    
    // Insert products
    console.log('📦 Inserting products...');
    const { error: productsError } = await supabase
      .from('products')
      .insert(products);
    
    if (productsError) {
      console.error('Error inserting products:', productsError);
      return;
    }
    
    // Insert Shopify orders
    console.log('🛒 Inserting Shopify orders...');
    const orders = generateShopifyOrders(products);
    const { error: ordersError } = await supabase
      .from('shopify_orders')
      .insert(orders);
    
    if (ordersError) {
      console.error('Error inserting orders:', ordersError);
      return;
    }
    
    // Insert Meta campaigns
    console.log('📊 Inserting Meta campaigns...');
    const campaigns = generateMetaCampaigns();
    const { error: campaignsError } = await supabase
      .from('meta_campaigns')
      .insert(campaigns);
    
    if (campaignsError) {
      console.error('Error inserting campaigns:', campaignsError);
      return;
    }
    
    // Insert alerts
    console.log('🚨 Inserting alerts...');
    const alerts = generateAlerts(products);
    const { error: alertsError } = await supabase
      .from('alerts')
      .insert(alerts);
    
    if (alertsError) {
      console.error('Error inserting alerts:', alertsError);
      return;
    }
    
    // Insert shipments
    console.log('🚚 Inserting shipments...');
    const shipments = generateShipments();
    const { error: shipmentsError } = await supabase
      .from('shipments')
      .insert(shipments);
    
    if (shipmentsError) {
      console.error('Error inserting shipments:', shipmentsError);
      return;
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded data summary:`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Campaigns: ${campaigns.length}`);
    console.log(`   - Alerts: ${alerts.length}`);
    console.log(`   - Shipments: ${shipments.length}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

// Run the seeding
seedDatabase().then(() => {
  console.log('🎉 Seeding process finished!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});