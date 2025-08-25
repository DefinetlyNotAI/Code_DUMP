import React from 'react';
import {LucideIcon} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: {
    label: string;
    color: string;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          </div>
          
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-3">
            {trend && (
              <div className={`flex items-center text-sm ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <span>{trend.isPositive ? '↗' : '↘'}</span>
                <span className="ml-1">{Math.abs(trend.value)}%</span>
              </div>
            )}
            
            {status && (
              <span className={`text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;