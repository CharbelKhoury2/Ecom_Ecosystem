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
  BarChart,
  Bar,
  ComposedChart
} from 'recharts';
import { format, subDays } from 'date-fns';

interface InventoryVelocityData {
  date: string;
  inventory: number;
  sales: number;
  velocity: number;
}

interface InventoryVelocityChartProps {
  data: InventoryVelocityData[];
  loading?: boolean;
}

const InventoryVelocityChart: React.FC<InventoryVelocityChartProps> = ({ data, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory vs Sales Velocity (14 Days)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'velocity') {
      return [`${value.toFixed(2)} days`, 'Days to Sell Out'];
    }
    return [value.toLocaleString(), name === 'inventory' ? 'Units in Stock' : 'Units Sold'];
  };

  const formatXAxisLabel = (tickItem: string) => {
    return format(new Date(tickItem), 'MMM dd');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Inventory vs Sales Velocity (14 Days)</h3>
        <div className="text-sm text-gray-500">
          Velocity = Days to sell current inventory at current sales rate
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Units', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Days', angle: 90, position: 'insideRight' }}
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
          
          <Bar 
            yAxisId="left"
            dataKey="inventory" 
            fill="#3b82f6" 
            name="Inventory"
            opacity={0.7}
          />
          <Bar 
            yAxisId="left"
            dataKey="sales" 
            fill="#10b981" 
            name="Sales"
            opacity={0.7}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="velocity" 
            stroke="#f59e0b" 
            strokeWidth={3}
            name="Velocity (Days)"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2 opacity-70"></div>
            <span className="text-gray-600">Inventory</span>
          </div>
          <div className="font-semibold text-gray-900">
            {data[data.length - 1]?.inventory?.toLocaleString() || 0} units
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-green-500 rounded mr-2 opacity-70"></div>
            <span className="text-gray-600">Daily Sales</span>
          </div>
          <div className="font-semibold text-gray-900">
            {data[data.length - 1]?.sales?.toLocaleString() || 0} units
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-gray-600">Velocity</span>
          </div>
          <div className="font-semibold text-gray-900">
            {data[data.length - 1]?.velocity?.toFixed(1) || 0} days
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryVelocityChart;