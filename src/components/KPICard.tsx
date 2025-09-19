import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { KPIMetric } from '../types';
import { AnimatedCounter, AnimatedIcon } from './AnimatedComponents';

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

  const getAnimatedValue = () => {
    if (metric.format === 'currency') {
      return (
        <span>
          $<AnimatedCounter to={metric.value} decimals={0} />
        </span>
      );
    } else if (metric.format === 'percentage') {
      return (
        <span>
          <AnimatedCounter to={metric.value} decimals={1} />%
        </span>
      );
    } else {
      return <AnimatedCounter to={metric.value} decimals={0} />;
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 hover:shadow-card-hover hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/10 dark:via-gray-800 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
        <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {Icon && (
              <AnimatedIcon hover scale={1.2} className="">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-5 w-5" />
                </div>
              </AnimatedIcon>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors uppercase tracking-wider">
                {title}
              </h3>
            </div>
          </div>
          
          {/* Trend indicator */}
          <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 ${
            isPositive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            <AnimatedIcon hover rotation={isPositive ? 15 : -15} scale={1.1}>
              <TrendIcon className="h-4 w-4" />
            </AnimatedIcon>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-display">
              {getAnimatedValue()}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:scale-105 ${
              isPositive 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              <span className="text-xs font-medium opacity-75 mr-1">vs prev</span>
              <AnimatedCounter to={Math.abs(metric.change)} decimals={1} />%
            </div>
            
            {/* Progress indicator */}
            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  isPositive ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(Math.abs(metric.change) * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl" />
      </div>
    </div>
  );
};

export default KPICard;