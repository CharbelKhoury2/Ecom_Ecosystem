/**
 * Business Intelligence Widgets
 * Cohort Analysis, RFM Analysis, Market Basket Analysis, and Attribution Modeling
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Heatmap
} from 'recharts';
import {
  Users,
  TrendingUp,
  ShoppingCart,
  Target,
  Calendar,
  DollarSign,
  Percent,
  Award,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subMonths, parseISO } from 'date-fns';
import enhancedAIService, {
  CohortAnalysis,
  RFMAnalysis,
  MarketBasketAnalysis
} from '../services/enhancedAIService';

interface CustomerCohortData {
  customerId: string;
  firstOrderDate: string;
  orders: { date: string; amount: number }[];
}

interface AttributionData {
  channel: string;
  touchpoints: number;
  conversions: number;
  revenue: number;
  attributionWeight: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
const RFM_COLORS = {
  'Champions': '#10B981',
  'Loyal Customers': '#059669',
  'Potential Loyalists': '#3B82F6',
  'New Customers': '#6366F1',
  'Promising': '#8B5CF6',
  'Need Attention': '#F59E0B',
  'About to Sleep': '#F97316',
  'At Risk': '#EF4444',
  'Cannot Lose Them': '#DC2626',
  'Hibernating': '#6B7280',
  'Lost': '#374151'
};

const BusinessIntelligenceWidgets: React.FC = () => {
  const [cohortData, setCohortData] = useState<CohortAnalysis[]>([]);
  const [rfmData, setRfmData] = useState<RFMAnalysis[]>([]);
  const [marketBasketData, setMarketBasketData] = useState<MarketBasketAnalysis[]>([]);
  const [attributionData, setAttributionData] = useState<AttributionData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessIntelligenceData();
  }, [selectedTimeRange]);

  const loadBusinessIntelligenceData = async () => {
    setLoading(true);
    try {
      const mockCustomerData = generateMockCustomerData();
      const mockOrderData = generateMockOrderData();
      const mockAttributionData = generateMockAttributionData();
      
      // Perform cohort analysis
      const cohorts = enhancedAIService.performCohortAnalysis(mockCustomerData);
      setCohortData(cohorts);
      
      // Perform RFM analysis
      const rfmAnalysis = enhancedAIService.performRFMAnalysis(
        mockCustomerData.map(c => ({
          customerId: c.customerId,
          orders: c.orders
        }))
      );
      setRfmData(rfmAnalysis);
      
      // Perform market basket analysis
      const basketAnalysis = enhancedAIService.performMarketBasketAnalysis(mockOrderData);
      setMarketBasketData(basketAnalysis);
      
      setAttributionData(mockAttributionData);
    } catch (error) {
      console.error('Error loading business intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCustomerData = (): CustomerCohortData[] => {
    const customers: CustomerCohortData[] = [];
    const months = selectedTimeRange === '3m' ? 3 : selectedTimeRange === '6m' ? 6 : 12;
    
    for (let i = 0; i < 200; i++) {
      const firstOrderDate = subMonths(new Date(), Math.floor(Math.random() * months));
      const orders = [];
      
      // Generate orders for this customer
      const orderCount = Math.floor(Math.random() * 8) + 1;
      for (let j = 0; j < orderCount; j++) {
        const orderDate = new Date(firstOrderDate.getTime() + (j * 30 * 24 * 60 * 60 * 1000) + (Math.random() * 30 * 24 * 60 * 60 * 1000));
        if (orderDate <= new Date()) {
          orders.push({
            date: orderDate.toISOString(),
            amount: Math.floor(Math.random() * 500) + 50
          });
        }
      }
      
      customers.push({
        customerId: `CUST${String(i + 1).padStart(3, '0')}`,
        firstOrderDate: firstOrderDate.toISOString(),
        orders
      });
    }
    
    return customers;
  };

  const generateMockOrderData = () => {
    const products = ['PROD001', 'PROD002', 'PROD003', 'PROD004', 'PROD005', 'PROD006', 'PROD007', 'PROD008'];
    const productNames = ['Widget A', 'Widget B', 'Gadget X', 'Tool Y', 'Device Z', 'Kit Alpha', 'Set Beta', 'Pack Gamma'];
    
    const orders = [];
    for (let i = 0; i < 500; i++) {
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const items = [];
      
      for (let j = 0; j < itemCount; j++) {
        const productIndex = Math.floor(Math.random() * products.length);
        items.push({
          sku: products[productIndex],
          name: productNames[productIndex]
        });
      }
      
      orders.push({
        orderId: `ORD${String(i + 1).padStart(4, '0')}`,
        items
      });
    }
    
    return orders;
  };

  const generateMockAttributionData = (): AttributionData[] => {
    return [
      { channel: 'Google Ads', touchpoints: 1250, conversions: 125, revenue: 37500, attributionWeight: 0.35 },
      { channel: 'Facebook Ads', touchpoints: 980, conversions: 98, revenue: 29400, attributionWeight: 0.25 },
      { channel: 'Email Marketing', touchpoints: 2100, conversions: 210, revenue: 21000, attributionWeight: 0.15 },
      { channel: 'Organic Search', touchpoints: 1800, conversions: 90, revenue: 18000, attributionWeight: 0.12 },
      { channel: 'Direct', touchpoints: 650, conversions: 65, revenue: 19500, attributionWeight: 0.08 },
      { channel: 'Referral', touchpoints: 420, conversions: 21, revenue: 6300, attributionWeight: 0.05 }
    ];
  };

  const prepareCohortHeatmapData = () => {
    if (cohortData.length === 0) return [];
    
    const heatmapData = [];
    cohortData.forEach((cohort, cohortIndex) => {
      cohort.retentionRates.forEach((retention, monthIndex) => {
        if (monthIndex <= 11) { // Show up to 12 months
          heatmapData.push({
            cohort: format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy'),
            month: `Month ${monthIndex}`,
            rate: retention.rate,
            customers: retention.customers
          });
        }
      });
    });
    
    return heatmapData;
  };

  const getRFMSegmentDistribution = () => {
    const distribution: { [key: string]: number } = {};
    rfmData.forEach(customer => {
      distribution[customer.segment] = (distribution[customer.segment] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([segment, count]) => ({
      segment,
      count,
      percentage: (count / rfmData.length) * 100
    }));
  };

  const getTopMarketBasketRules = () => {
    return marketBasketData
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 10)
      .map(rule => ({
        ...rule,
        supportPercent: (rule.support * 100).toFixed(1),
        confidencePercent: (rule.confidence * 100).toFixed(1),
        liftFormatted: rule.lift.toFixed(2)
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cohortHeatmapData = prepareCohortHeatmapData();
  const rfmDistribution = getRFMSegmentDistribution();
  const topBasketRules = getTopMarketBasketRules();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600 mt-1">Advanced customer analytics and behavioral insights</p>
        </div>
        
        <div className="flex space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '3m' | '6m' | '12m')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
          </select>
          
          <button
            onClick={loadBusinessIntelligenceData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-blue-600">
              <Users className="w-8 h-8" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{cohortData.length}</p>
              <p className="text-sm text-gray-600">Customer Cohorts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-green-600">
              <Award className="w-8 h-8" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {rfmDistribution.find(d => d.segment === 'Champions')?.count || 0}
              </p>
              <p className="text-sm text-gray-600">Champion Customers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-purple-600">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{topBasketRules.length}</p>
              <p className="text-sm text-gray-600">Product Associations</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-orange-600">
              <Target className="w-8 h-8" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {attributionData.reduce((sum, d) => sum + d.conversions, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Conversions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cohort Retention Analysis</h3>
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cohort Retention Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Retention Rates by Cohort</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="cohortMonth" 
                  tickFormatter={(value) => format(parseISO(value + '-01'), 'MMM yy')}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Avg Retention']}
                  labelFormatter={(label) => `Cohort: ${format(parseISO(label + '-01'), 'MMM yyyy')}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={(data: CohortAnalysis) => {
                    const avgRetention = data.retentionRates.slice(0, 6).reduce((sum, r) => sum + r.rate, 0) / 6;
                    return avgRetention;
                  }}
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="6-Month Avg Retention"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Cohort LTV */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Customer Lifetime Value by Cohort</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="cohortMonth" 
                  tickFormatter={(value) => format(parseISO(value + '-01'), 'MMM yy')}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Lifetime Value']}
                  labelFormatter={(label) => `Cohort: ${format(parseISO(label + '-01'), 'MMM yyyy')}`}
                />
                <Bar dataKey="lifetimeValue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RFM Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFM Segment Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">RFM Customer Segments</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={rfmDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ segment, percentage }) => `${segment}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {rfmDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RFM_COLORS[entry.segment as keyof typeof RFM_COLORS] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, 'Customers']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* RFM Scatter Plot */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">RFM Score Distribution</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={rfmData.slice(0, 100)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recency" name="Recency (days)" />
              <YAxis dataKey="monetary" name="Monetary ($)" />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'monetary' ? `$${value}` : `${value} days`,
                  name === 'monetary' ? 'Total Spent' : 'Days Since Last Order'
                ]}
                labelFormatter={(label) => `Customer: ${label}`}
              />
              <Scatter 
                dataKey="monetary" 
                fill={(entry: any) => RFM_COLORS[entry.segment as keyof typeof RFM_COLORS] || '#8884d8'}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Basket Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Market Basket Analysis</h3>
          <ShoppingCart className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product A
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product B
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Support
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strength
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topBasketRules.map((rule, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rule.itemA}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.itemB}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.supportPercent}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.confidencePercent}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.liftFormatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(rule.liftFormatted) > 2 ? 'bg-green-100 text-green-800' :
                      parseFloat(rule.liftFormatted) > 1.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {parseFloat(rule.liftFormatted) > 2 ? 'Strong' :
                       parseFloat(rule.liftFormatted) > 1.5 ? 'Moderate' : 'Weak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attribution Modeling */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Marketing Attribution Analysis</h3>
          <Target className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attribution by Channel */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Revenue Attribution by Channel</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Attributed Revenue']}
                />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Attribution Weights */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Attribution Weight Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, attributionWeight }) => `${channel}: ${(attributionWeight * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="attributionWeight"
                >
                  {attributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Attribution Weight']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligenceWidgets;