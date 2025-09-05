import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { KPIMetric } from '../types';

interface KPICardProps {
  title: string;
  metric: KPIMetric;
  icon?: React.ComponentType<{ className?: string }>;
}

const KPICard: React.FC<KPICardProps> = ({ title, metric, icon: Icon }) => {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const isPositive = metric.changeType === 'increase';
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {Icon && <Icon className="h-5 w-5 text-gray-400 mr-2" />}
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            {formatValue(metric.value, metric.format)}
          </p>
        </div>
        
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${changeBgColor} ${changeColor}`}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {Math.abs(metric.change).toFixed(1)}%
          <span className="ml-1 text-gray-500">vs prev</span>
        </div>
      </div>
    </div>
  );
};

export default KPICard;