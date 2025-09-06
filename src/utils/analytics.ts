export interface PnLCalculation {
  revenue: number;
  adSpend: number;
  cogs: number;
  grossProfit: number;
  blendedRoas: number;
  contributionMargin: number;
}

interface OrderData {
  total: number;
  refunds?: number;
  sku: string;
  quantity: number;
}

interface CampaignData {
  spend: number;
  name: string;
  roas: number;
}

interface ProductData {
  sku: string;
  costPerItem: number;
  name: string;
  stockLevel: number;
}

export const calculateTruePnL = (
  orderData: OrderData[],
  campaignData: CampaignData[],
  productData: ProductData[]
): PnLCalculation => {
  // Calculate Revenue (sum of order totals minus refunds)
  const revenue = orderData.reduce((sum, order) => {
    return sum + (order.total - (order.refunds || 0));
  }, 0);

  // Calculate Ad Spend (sum of campaign spend)
  const adSpend = campaignData.reduce((sum, campaign) => {
    return sum + campaign.spend;
  }, 0);

  // Calculate COGS (sum of quantity × cost_per_item)
  const cogs = orderData.reduce((sum, order) => {
    const product = productData.find(p => p.sku === order.sku);
    if (product) {
      return sum + (order.quantity * product.costPerItem);
    }
    return sum;
  }, 0);

  // Calculate shipping costs (assuming 5% of revenue as average)
  const shippingCosts = revenue * 0.05;

  // Calculate Gross Profit
  const grossProfit = revenue - (adSpend + cogs + shippingCosts);

  // Calculate Blended ROAS
  const blendedRoas = adSpend > 0 ? revenue / adSpend : 0;

  // Calculate Contribution Margin
  const contributionMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    revenue,
    adSpend,
    cogs: cogs + shippingCosts,
    grossProfit,
    blendedRoas,
    contributionMargin,
  };
};

export const generateAlerts = (
  currentMetrics: PnLCalculation,
  previousMetrics: PnLCalculation,
  productData: ProductData[],
  campaignData: CampaignData[]
) => {
  const alerts = [];

  // ROAS Drop Alert
  if (previousMetrics.blendedRoas > 0) {
    const roasChange = ((currentMetrics.blendedRoas - previousMetrics.blendedRoas) / previousMetrics.blendedRoas) * 100;
    if (roasChange < -20) {
      alerts.push({
        type: 'roas-drop',
        title: 'ROAS Drop Alert',
        message: `Overall ROAS dropped ${Math.abs(roasChange).toFixed(1)}% to ${currentMetrics.blendedRoas.toFixed(2)}x`,
        severity: 'high',
      });
    }
  }

  // Low Stock Alerts
  productData.forEach(product => {
    if (product.stockLevel < 10 && product.stockLevel > 0) {
      alerts.push({
        type: 'low-stock',
        title: 'Low Stock Alert',
        message: `${product.name} (${product.sku}) has only ${product.stockLevel} units left`,
        severity: product.stockLevel < 5 ? 'high' : 'medium',
      });
    } else if (product.stockLevel === 0) {
      alerts.push({
        type: 'low-stock',
        title: 'Out of Stock Alert',
        message: `${product.name} (${product.sku}) is completely out of stock`,
        severity: 'high',
      });
    }
  });

  // Campaign Performance Alerts
  campaignData.forEach(campaign => {
    if (campaign.roas < 2.0) {
      alerts.push({
        type: 'campaign-performance',
        title: 'Poor Campaign Performance',
        message: `${campaign.name} has ROAS of ${campaign.roas.toFixed(2)}x, below profitable threshold`,
        severity: campaign.roas < 1.5 ? 'high' : 'medium',
      });
    }
  });

  return alerts;
};