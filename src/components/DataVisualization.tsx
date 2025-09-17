/**
 * Data Visualization Components for Neo AI Copilot
 * Provides chart and table rendering capabilities for AI responses
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Download, Eye, Filter } from 'lucide-react';
import { useState } from 'react';

interface ChartData {
  [key: string]: any;
}

interface TableData {
  headers: string[];
  rows: any[][];
}

interface DataVisualizationProps {
  type: 'bar' | 'line' | 'pie' | 'table';
  data: ChartData[] | TableData;
  title?: string;
  description?: string;
  xKey?: string;
  yKey?: string;
  colors?: string[];
  className?: string;
}

const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

const DataVisualization: React.FC<DataVisualizationProps> = ({
  type,
  data,
  title,
  description,
  xKey = 'name',
  yKey = 'value',
  colors = CHART_COLORS,
  className = ''
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const exportData = () => {
    const exportContent = type === 'table' 
      ? generateCSV(data as TableData)
      : JSON.stringify(data, null, 2);
    
    const blob = new Blob([exportContent], { 
      type: type === 'table' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.${type === 'table' ? 'csv' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (tableData: TableData): string => {
    const { headers, rows } = tableData;
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    return csvContent;
  };

  const sortTableData = (tableData: TableData, column: string, direction: 'asc' | 'desc'): TableData => {
    const columnIndex = tableData.headers.indexOf(column);
    if (columnIndex === -1) return tableData;

    const sortedRows = [...tableData.rows].sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return direction === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return { ...tableData, rows: sortedRows };
  };

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
  };

  const renderChart = () => {
    const chartData = data as ChartData[];
    const containerHeight = showFullscreen ? 500 : 300;

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xKey} 
                className="text-xs fill-gray-600 dark:fill-gray-400"
              />
              <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend />
              <Bar 
                dataKey={yKey} 
                fill={colors[0]} 
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xKey} 
                className="text-xs fill-gray-600 dark:fill-gray-400"
              />
              <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={colors[0]} 
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={showFullscreen ? 150 : 100}
                fill="#8884d8"
                dataKey={yKey}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderTable = () => {
    const tableData = data as TableData;
    const sortedData = sortColumn 
      ? sortTableData(tableData, sortColumn, sortDirection)
      : tableData;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {sortedData.headers.map((header, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(header)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    {sortColumn === header && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFullscreen(!showFullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={showFullscreen ? 'Minimize' : 'Expand'}
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={exportData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Export data"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={showFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-8' : ''}>
        {showFullscreen && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title || 'Data Visualization'}
            </h2>
            <button
              onClick={() => setShowFullscreen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}
        
        {type === 'table' ? renderTable() : renderChart()}
      </div>
    </div>
  );
};

export default DataVisualization;