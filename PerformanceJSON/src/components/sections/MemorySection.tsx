import React from 'react';
import { HardDrive, TrendingUp, AlertCircle } from 'lucide-react';
import { PerformanceData } from '../../types/performance.ts';
import MetricCard from '../common/MetricCard.tsx';
import DataTable from '../common/DataTable.tsx';
import { calculateMemoryEfficiency, getMemoryStatus, formatMemory } from '../../utils/analysisHelpers.ts';

interface MemorySectionProps {
  data: PerformanceData;
}

const MemorySection: React.FC<MemorySectionProps> = ({ data }) => {
  const memoryData = data.pages.map(page => ({
    ...page,
    efficiency: calculateMemoryEfficiency(page),
    status: getMemoryStatus(calculateMemoryEfficiency(page))
  })).sort((a, b) => b.memory.usedJSHeapSize - a.memory.usedJSHeapSize);

  const totalMemoryUsed = data.pages.reduce((sum, page) => sum + page.memory.usedJSHeapSize, 0);
  const averageMemoryUsed = totalMemoryUsed / data.pages.length;
  const maxMemoryUsed = Math.max(...data.pages.map(page => page.memory.usedJSHeapSize));
  const minMemoryUsed = Math.min(...data.pages.map(page => page.memory.usedJSHeapSize));

  const columns = [
    {
      key: 'route',
      label: 'Route',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      )
    },
    {
      key: 'memory.usedJSHeapSize',
      label: 'Used Memory',
      sortable: true,
      render: (value: number) => formatMemory(value)
    },
    {
      key: 'memory.totalJSHeapSize',
      label: 'Total Heap',
      sortable: true,
      render: (value: number) => formatMemory(value)
    },
    {
      key: 'efficiency',
      label: 'Efficiency',
      sortable: true,
      render: (value: number, item: any) => (
        <div className="flex items-center space-x-2">
          <span>{value}%</span>
          <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${item.status.color}`}>
            {item.status.status}
          </span>
        </div>
      )
    },
    {
      key: 'dom_nodes',
      label: 'DOM Nodes',
      sortable: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Memory Usage Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          JavaScript heap memory consumption across your ARG pages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Memory"
          value={formatMemory(averageMemoryUsed)}
          subtitle="Per page"
          icon={HardDrive}
          status={{ label: 'Efficient', color: 'text-green-600 dark:text-green-400' }}
        />
        
        <MetricCard
          title="Peak Memory"
          value={formatMemory(maxMemoryUsed)}
          subtitle="Highest usage"
          icon={TrendingUp}
          status={{ label: 'Monitored', color: 'text-yellow-600 dark:text-yellow-400' }}
        />
        
        <MetricCard
          title="Minimum Memory"
          value={formatMemory(minMemoryUsed)}
          subtitle="Lowest usage"
          icon={HardDrive}
          status={{ label: 'Optimized', color: 'text-blue-600 dark:text-blue-400' }}
        />
        
        <MetricCard
          title="Memory Range"
          value={formatMemory(maxMemoryUsed - minMemoryUsed)}
          subtitle="Variation"
          icon={AlertCircle}
          status={{ label: 'Acceptable', color: 'text-gray-600 dark:text-gray-400' }}
        />

          <MetricCard
              title="VESSEL Memory"
              value={"150MB Zipped - 318MB Unzipped"}
              subtitle="Variation"
              icon={AlertCircle}
              status={{ label: 'Acceptable', color: 'text-gray-600 dark:text-gray-400' }}
          />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Memory Efficiency Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {memoryData.filter(page => page.status.status === 'Excellent').length}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Excellent Pages</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">&lt; 1% heap usage</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {memoryData.filter(page => page.status.status === 'Good').length}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Good Pages</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">1-2% heap usage</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {memoryData.filter(page => page.status.status === 'Fair' || page.status.status === 'Poor').length}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Needs Attention</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">&gt; 2% heap usage</div>
          </div>
        </div>
      </div>

      <DataTable
        data={memoryData}
        columns={columns}
        maxHeight="max-h-[600px]"
      />

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">ARG Memory Optimization</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Your ARG shows excellent memory management with most pages using less than 2% of available heap space. 
              This ensures smooth gameplay across devices and maintains immersion without performance hiccups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorySection;