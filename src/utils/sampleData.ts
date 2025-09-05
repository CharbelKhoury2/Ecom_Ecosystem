export const generateSampleData = () => {
  const currentDate = new Date();
  const pastDays = 30;

  // Generate sample orders
  const orders = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Generate 15-25 orders per day
    const ordersPerDay = Math.floor(Math.random() * 10) + 15;
    
    for (let j = 0; j < ordersPerDay; j++) {
      const skus = ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005'];
      const sku = skus[Math.floor(Math.random() * skus.length)];
      
      let basePrice = 50;
      let costPerItem = 20;
      
      switch (sku) {
        case 'PROD-001': // Wireless Headphones
          basePrice = 150;
          costPerItem = 45;
          break;
        case 'PROD-002': // Smart Watch
          basePrice = 250;
          costPerItem = 75;
          break;
        case 'PROD-003': // Phone Case
          basePrice = 35;
          costPerItem = 14;
          break;
        case 'PROD-004': // Bluetooth Speaker
          basePrice = 120;
          costPerItem = 36;
          break;
        case 'PROD-005': // Charging Cable
          basePrice = 25;
          costPerItem = 10;
          break;
      }
      
      const quantity = Math.floor(Math.random() * 3) + 1;
      const total = basePrice * quantity;
      const refunds = Math.random() < 0.05 ? total * 0.5 : 0; // 5% chance of 50% refund
      
      orders.push({
        id: `order-${i}-${j}`,
        orderId: `ORD-${Date.now()}-${j}`,
        sku,
        quantity,
        revenue: total - refunds,
        total,
        refunds,
        cogs: costPerItem * quantity,
        shippingCost: 5,
        dateCreated: date,
      });
    }
  }

  // Generate sample products
  const products = [
    {
      id: 'prod-001',
      productId: 'shopify-001',
      sku: 'PROD-001',
      name: 'Wireless Headphones',
      costPerItem: 45,
      stockLevel: 45,
      lastUpdated: new Date(),
    },
    {
      id: 'prod-002',
      productId: 'shopify-002',
      sku: 'PROD-002',
      name: 'Smart Watch',
      costPerItem: 75,
      stockLevel: 8,
      lastUpdated: new Date(),
    },
    {
      id: 'prod-003',
      productId: 'shopify-003',
      sku: 'PROD-003',
      name: 'Phone Case',
      costPerItem: 14,
      stockLevel: 120,
      lastUpdated: new Date(),
    },
    {
      id: 'prod-004',
      productId: 'shopify-004',
      sku: 'PROD-004',
      name: 'Bluetooth Speaker',
      costPerItem: 36,
      stockLevel: 0,
      lastUpdated: new Date(),
    },
    {
      id: 'prod-005',
      productId: 'shopify-005',
      sku: 'PROD-005',
      name: 'Charging Cable',
      costPerItem: 10,
      stockLevel: 85,
      lastUpdated: new Date(),
    },
  ];

  // Generate sample campaigns
  const campaigns = [];
  const campaignNames = [
    'Holiday Sale - Electronics',
    'Smart Watch Retargeting',
    'Accessories Bundle',
    'New Customer Acquisition',
    'Black Friday Prep',
    'Brand Awareness Campaign',
    'Lookalike Audience Test',
  ];

  campaignNames.forEach((name, index) => {
    for (let i = 0; i < pastDays; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      const baseSpend = [80, 60, 40, 100, 53, 30, 25][index] || 50;
      const dailySpend = baseSpend + (Math.random() * 20 - 10); // ±10 variation
      
      const clicks = Math.floor(dailySpend * (8 + Math.random() * 4)); // 8-12 clicks per dollar
      const impressions = clicks * (15 + Math.random() * 10); // 15-25 impressions per click
      const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.03)); // 2-5% conversion rate
      
      // Calculate revenue based on conversions and average order value
      const avgOrderValue = 120 + Math.random() * 80; // $120-200 AOV
      const revenue = conversions * avgOrderValue;
      const roas = dailySpend > 0 ? revenue / dailySpend : 0;

      campaigns.push({
        id: `camp-${index}-${i}`,
        campaignId: `meta-${index}`,
        name,
        spend: dailySpend,
        clicks,
        impressions,
        conversions,
        roas,
        revenue,
        date,
      });
    }
  });

  return { orders, products, campaigns };
};

export const getSampleDashboardData = () => {
  const { orders, products, campaigns } = generateSampleData();
  
  // Calculate last 7 days vs previous 7 days
  const currentDate = new Date();
  const last7Days = orders.filter(order => {
    const daysDiff = Math.floor((currentDate.getTime() - order.dateCreated.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  });
  
  const previous7Days = orders.filter(order => {
    const daysDiff = Math.floor((currentDate.getTime() - order.dateCreated.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7 && daysDiff <= 14;
  });

  const last7DaysCampaigns = campaigns.filter(campaign => {
    const daysDiff = Math.floor((currentDate.getTime() - campaign.date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  });
  
  const previous7DaysCampaigns = campaigns.filter(campaign => {
    const daysDiff = Math.floor((currentDate.getTime() - campaign.date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7 && daysDiff <= 14;
  });

  // Calculate current metrics
  const currentRevenue = last7Days.reduce((sum, order) => sum + order.revenue, 0);
  const currentAdSpend = last7DaysCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const currentCogs = last7Days.reduce((sum, order) => sum + order.cogs, 0) + (currentRevenue * 0.05); // Include shipping
  const currentGrossProfit = currentRevenue - currentAdSpend - currentCogs;
  const currentRoas = currentAdSpend > 0 ? currentRevenue / currentAdSpend : 0;
  const currentMargin = currentRevenue > 0 ? (currentGrossProfit / currentRevenue) * 100 : 0;

  // Calculate previous metrics
  const previousRevenue = previous7Days.reduce((sum, order) => sum + order.revenue, 0);
  const previousAdSpend = previous7DaysCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const previousCogs = previous7Days.reduce((sum, order) => sum + order.cogs, 0) + (previousRevenue * 0.05);
  const previousGrossProfit = previousRevenue - previousAdSpend - previousCogs;
  const previousRoas = previousAdSpend > 0 ? previousRevenue / previousAdSpend : 0;
  const previousMargin = previousRevenue > 0 ? (previousGrossProfit / previousRevenue) * 100 : 0;

  return {
    orders: last7Days,
    products,
    campaigns: last7DaysCampaigns,
    previousMetrics: {
      revenue: previousRevenue,
      adSpend: previousAdSpend,
      cogs: previousCogs,
      grossProfit: previousGrossProfit,
      roas: previousRoas,
      margin: previousMargin,
    }
  };
};