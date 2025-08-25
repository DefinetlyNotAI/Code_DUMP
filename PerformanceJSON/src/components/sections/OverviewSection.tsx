import React from 'react';
import { Clock, Globe, HardDrive, FileText, Cookie, GitCommit } from 'lucide-react';
import { PerformanceData } from '../../types/performance.ts';
import MetricCard from '../common/MetricCard.tsx';
import {analyzeCookieUsage, formatBytes, formatMemory} from '../../utils/analysisHelpers.ts';

interface OverviewSectionProps {
  data: PerformanceData;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ data }) => {
  const totalMemoryUsed = data.pages.reduce((sum, page) => sum + page.memory.usedJSHeapSize, 0);
  const averageMemoryUsed = totalMemoryUsed / data.pages.length;
  const totalAssetSize = parseFloat(data.public_assets.total_size.replace(' MB', '')) * 1024;
  const cookieAnalysis = analyzeCookieUsage(data);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Performance Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Comprehensive analysis of The Hollow Pilgrimage ARG performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Routes"
          value={data.global.total_routes_tested}
          subtitle="Pages analyzed"
          icon={Globe}
          status={{ label: 'Complete', color: 'text-green-600 dark:text-green-400' }}
        />
        
        <MetricCard
          title="Average Load Time"
          value={`${data.global.average_load_time_ms}ms`}
          subtitle="Across all pages"
          icon={Clock}
          status={{ 
            label: data.global.average_load_time_ms < 2000 ? 'Good' : 'Needs Attention', 
            color: data.global.average_load_time_ms < 2000 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
          }}
        />
        
        <MetricCard
          title="Average Memory Usage"
          value={formatMemory(averageMemoryUsed)}
          subtitle="Per page"
          icon={HardDrive}
          status={{ label: 'Efficient', color: 'text-blue-600 dark:text-blue-400' }}
        />
        
        <MetricCard
          title="Total Assets"
          value={formatBytes(totalAssetSize)}
          subtitle={`${data.public_assets.breakdown.length} files`}
          icon={FileText}
          status={{ label: 'Rich Content', color: 'text-purple-600 dark:text-purple-400' }}
        />
        
        <MetricCard
          title="Cookie Usage"
          value={cookieAnalysis.uniqueCookies}
          subtitle="Total instances"
          icon={Cookie}
          status={{ label: 'ARG Optimized', color: 'text-indigo-600 dark:text-indigo-400' }}
        />
        
        <MetricCard
          title="Git Commit"
          value={data.git_commit.substring(0, 8)}
          subtitle="Latest analysis"
          icon={GitCommit}
          status={{ label: 'Current', color: 'text-gray-600 dark:text-gray-400' }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ARG-Specific Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Memory Efficiency</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your ARG maintains excellent memory efficiency with an average usage of {formatMemory(averageMemoryUsed)} per page. 
              This is ideal for immersive experiences that need to run smoothly across different devices.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Save Data Strategy</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              High cookie usage ({cookieAnalysis.totalCookieInstances} instances) is expected and beneficial for ARGs, enabling persistent
              game state and progress tracking across the narrative experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;