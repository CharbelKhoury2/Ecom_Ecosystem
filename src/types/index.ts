export interface KPIMetric {
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease';
  format: 'currency' | 'percentage' | 'number';
}

export interface SKUData {
  sku: string;
  productName: string;
  revenue: number;
  profit: number;
  stockLevel: number;
  status: 'active' | 'low-stock' | 'out-of-stock';
}

export interface CampaignData {
  id: string;
  name: string;
  spend: number;
  roas: number;
  profit: number;
  status: 'active' | 'paused' | 'warning';
}

export interface Alert {
  id: string;
  type: 'roas-drop' | 'low-stock' | 'refund-spike' | 'campaign-performance';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  status: 'active' | 'dismissed' | 'resolved';
  createdAt: Date;
  actionable: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface Integration {
  platform: 'shopify' | 'meta-ads';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date | null;
}

export interface DashboardData {
  kpis: {
    revenue: KPIMetric;
    adSpend: KPIMetric;
    cogs: KPIMetric;
    grossProfit: KPIMetric;
    blendedRoas: KPIMetric;
    contributionMargin: KPIMetric;
  };
  topSkus: SKUData[];
  topCampaigns: CampaignData[];
}