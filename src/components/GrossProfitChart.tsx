import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';

interface GrossProfitData {
  date: string;
  revenue: number;
  adSpend: number;
  cogs: number;
  grossProfit: number;
  margin: number;
}

interface GrossProfitChartProps {
  data: GrossProfitData[];
  loading?: boolean;
}

const GrossProfitChart: React.FC<GrossProfitChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Gross Profit Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'margin') {
      return [`${value.toFixed(1)}%`, 'Profit Margin'];
    }
    return [formatCurrency(value), name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    return format(new Date(tickItem), 'MMM dd');
  };

  // Calculate summary metrics
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalAdSpend = data.reduce((sum, item) => sum + item.adSpend, 0);
  const totalCogs = data.reduce((sum, item) => sum + item.cogs, 0);
  const totalGrossProfit = data.reduce((sum, item) => sum + item.grossProfit, 0);
  const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Daily Gross Profit Trend</h3>
        <div className="text-sm text-gray-500">
          Revenue - Ad Spend - COGS = Gross Profit
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={formatCurrency}
            label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={formatTooltipValue}
            labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke="#3b82f6"
            fill="url(#revenueGradient)"
            name="Revenue"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="grossProfit"
            stroke="#10b981"
            fill="url(#profitGradient)"
            name="Gross Profit"
            strokeWidth={3}
          />
          <Line
            type="monotone"
            dataKey="adSpend"
            stroke="#ef4444"
            strokeWidth={2}
            name="Ad Spend"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2 opacity-70"></div>
            <span className="text-gray-600">Total Revenue</span>
          </div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-600">Total Ad Spend</span>
          </div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(totalAdSpend)}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600">Gross Profit</span>
          </div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(totalGrossProfit)}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-gray-600">Avg Margin</span>
          </div>
          <div className="font-semibold text-gray-900">
            {avgMargin.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrossProfitChart;