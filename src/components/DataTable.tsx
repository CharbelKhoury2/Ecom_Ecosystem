import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonTable } from './LoadingSpinner';

interface Column {
  key: string;
  label: string;
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: Record<string, any>[];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  columns, 
  data, 
  className = '', 
  loading = false,
  emptyMessage = 'No data available'
}) => {
  const formatValue = (value: any, format?: string) => {
    if (typeof value !== 'number') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'low-stock': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'out-of-stock': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      paused: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    return (
      <motion.span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.05 }}
      >
        {status}
      </motion.span>
    );
  };

  // Show loading skeleton
  if (loading) {
    return <SkeletonTable rows={5} className={className} />;
  }

  return (
    <motion.div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      </motion.div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <motion.thead 
            className="bg-gray-50 dark:bg-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <tr>
              {columns.map((column, index) => (
                <motion.th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                >
                  {column.label}
                </motion.th>
              ))}
            </tr>
          </motion.thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence mode="popLayout">
              {data.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <td 
                    colSpan={columns.length} 
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                data.map((row, index) => (
                  <motion.tr 
                    key={index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    layout
                  >
                    {columns.map((column) => (
                      <motion.td 
                        key={column.key} 
                        className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.1, duration: 0.2 }}
                      >
                        {column.key === 'status' 
                          ? getStatusBadge(row[column.key])
                          : <span className="text-gray-900 dark:text-gray-100">{formatValue(row[column.key], column.format)}</span>
                        }
                      </motion.td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default DataTable;