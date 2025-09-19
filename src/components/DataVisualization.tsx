/**
 * Data Visualization Component - Charts and graphs for reports
 */

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DataVisualizationProps {
  data: any[];
  type: 'bar' | 'line' | 'pie' | 'area' | 'table';
  title?: string;
  xKey: string;
  yKey: string;
  height?: number;
  colors?: string[];
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  type,
  title,
  xKey,
  yKey,
  height = 400,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
}) => {
  // Process data for charts
  const processedData = data.slice(0, 20).map((item, index) => ({
    ...item,
    name: item[xKey] || `Item ${index + 1}`,
    value: typeof item[yKey] === 'number' ? item[yKey] : parseFloat(item[yKey]) || 0,
    originalData: item
  }));

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {`${yKey}: ${typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}`}
          </p>
          {data.originalData && Object.keys(data.originalData).slice(0, 3).map(key => (
            key !== xKey && key !== yKey && (
              <p key={key} className="text-xs text-gray-600 dark:text-gray-400">
                {`${key}: ${data.originalData[key]}`}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  // Format label for display
  const formatLabel = (value: any) => {
    if (typeof value === 'string' && value.length > 15) {
      return value.substring(0, 15) + '...';
    }
    return value;
  };

  // Format tick values
  const formatTick = (value: any) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available for visualization</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatLabel}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={colors[0]} 
                name={yKey}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatLabel}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
                name={yKey}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatLabel}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.3}
                strokeWidth={2}
                name={yKey}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        // Aggregate data for pie chart (top 8 items)
        const pieData = processedData
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
          .map((item, index) => ({
            ...item,
            fill: colors[index % colors.length]
          }));

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${formatLabel(name)} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={Math.min(height * 0.3, 120)}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [formatTick(value), yKey]}
                labelFormatter={(label) => `${xKey}: ${label}`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => formatLabel(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        {renderChart()}
      </div>
      {processedData.length >= 20 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
          Showing top 20 items. Export report to see all data.
        </p>
      )}
    </div>
  );
};

export default DataVisualization;