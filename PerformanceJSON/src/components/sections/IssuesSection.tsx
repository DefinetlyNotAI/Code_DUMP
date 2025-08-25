import React from 'react';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { PerformanceData } from '../../types/performance.ts';
import { findPerformanceOutliers, formatMemory } from '../../utils/analysisHelpers.ts';

interface IssuesSectionProps {
  data: PerformanceData;
}

const IssuesSection: React.FC<IssuesSectionProps> = ({ data }) => {
  const outliers = findPerformanceOutliers(data);
  const avgLoadTime = data.global.average_load_time_ms;
  
  const issues = [
    {
      type: 'warning',
      title: 'Slow Loading Pages',
      description: `${outliers.slowestPages.length} pages load significantly slower than average (${avgLoadTime}ms)`,
      pages: outliers.slowestPages,
      icon: TrendingDown,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    {
      type: 'info',
      title: 'Memory Heavy Pages',
      description: `${outliers.memoryHeavyPages.length} pages use above-average memory`,
      pages: outliers.memoryHeavyPages,
      icon: AlertTriangle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      type: 'success',
      title: 'Optimized Pages',
      description: `${outliers.lightweightPages.length} pages perform exceptionally well`,
      pages: outliers.lightweightPages,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    }
  ];

  const recommendations = [
    {
      title: 'Asset Optimization',
      description: 'Consider compressing large audio files or implementing lazy loading for non-critical assets',
      priority: 'Medium',
      impact: 'Load Time Reduction'
    },
    {
      title: 'Memory Management',
      description: 'Monitor pages with high DOM node counts and consider component virtualization',
      priority: 'Low',
      impact: 'Memory Efficiency'
    },
    {
      title: 'Cookie Strategy',
      description: 'Current cookie usage is optimal for ARG state management - maintain this approach',
      priority: 'Maintain',
      impact: 'User Experience'
    },
    {
      title: 'SEO Considerations',
      description: 'Low SEO scores are acceptable for ARG content - focus on user experience over search visibility',
      priority: 'Low',
      impact: 'Discovery'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Issues & Insights
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Performance analysis and optimization recommendations for your ARG
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {issues.map((issue, index) => (
          <div
            key={index}
            className={`rounded-lg p-6 border ${issue.bgColor} ${issue.borderColor}`}
          >
            <div className="flex items-start space-x-3">
              <issue.icon className={`w-5 h-5 ${issue.color} mt-0.5`} />
              <div className="flex-1">
                <h3 className={`font-semibold ${issue.color}`}>{issue.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {issue.description}
                </p>
                
                {issue.pages.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Affected Pages
                    </h4>
                    <div className="space-y-1">
                      {issue.pages.slice(0, 3).map((page, pageIndex) => (
                        <div key={pageIndex} className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">{page.route}</span>
                          <span className="ml-2 text-gray-500">
                            {issue.type === 'warning' ? `${page.load_time_ms}ms` : 
                             issue.type === 'info' ? formatMemory(page.memory.usedJSHeapSize) :
                             `${page.load_time_ms}ms`}
                          </span>
                        </div>
                      ))}
                      {issue.pages.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{issue.pages.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Optimization Recommendations
        </h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                rec.priority === 'High' ? 'bg-red-500' :
                rec.priority === 'Medium' ? 'bg-yellow-500' :
                rec.priority === 'Maintain' ? 'bg-green-500' :
                'bg-gray-400'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.priority === 'High' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      rec.priority === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      rec.priority === 'Maintain' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{rec.impact}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 dark:text-green-100">Overall Assessment</h4>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              Your ARG demonstrates excellent performance characteristics for its genre. The focus on memory efficiency 
              over SEO metrics is appropriate, and the comprehensive cookie usage supports the immersive narrative experience. 
              Minor optimizations could improve load times, but the current performance supports smooth gameplay across devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesSection;