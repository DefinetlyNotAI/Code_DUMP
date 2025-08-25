import React, { useState } from 'react';
import { Clock, HardDrive, FileText, Cookie } from 'lucide-react';
import { PerformanceData, PageData } from '../../types/performance.ts';
import DataTable from '../common/DataTable.tsx';
import { calculateMemoryEfficiency, getMemoryStatus, getLoadTimeStatus, formatMemory } from '../../utils/analysisHelpers.ts';

interface PageAnalysisSectionProps {
  data: PerformanceData;
}

const PageAnalysisSection: React.FC<PageAnalysisSectionProps> = ({ data }) => {
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);

  const columns = [
    {
      key: 'route',
      label: 'Route',
      sortable: true,
      render: (value: string, item: PageData) => (
        <button
          onClick={() => setSelectedPage(item)}
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          {value}
        </button>
      )
    },
    {
      key: 'load_time_ms',
      label: 'Load Time',
      sortable: true,
      render: (value: number) => {
        const status = getLoadTimeStatus(value);
        return (
          <div className="flex items-center space-x-2">
            <span>{value}ms</span>
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${status.color}`}>
              {status.status}
            </span>
          </div>
        );
      }
    },
    {
      key: 'memory_efficiency',
      label: 'Memory Usage',
      sortable: true,
      render: (_value: any, item: PageData) => {
        const efficiency = calculateMemoryEfficiency(item);
        const status = getMemoryStatus(efficiency);
        return (
          <div className="flex items-center space-x-2">
            <span>{formatMemory(item.memory.usedJSHeapSize)}</span>
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${status.color}`}>
              {efficiency}%
            </span>
          </div>
        );
      }
    },
    {
      key: 'cookies',
      label: 'Cookies',
      sortable: true,
      render: (value: string[]) => (
        <span className="text-sm">{value.length}</span>
      )
    },
    {
      key: 'dom_nodes',
      label: 'DOM Nodes',
      sortable: true
    },
    {
      key: 'text_words',
      label: 'Text Words',
      sortable: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Detailed performance metrics for each route in your ARG
        </p>
      </div>

      <DataTable
        data={data.pages}
        columns={columns}
        className="mb-6"
        maxHeight="max-h-[500px]"
      />

      {selectedPage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedPage.route}
            </h3>
            <button
              onClick={() => setSelectedPage(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Load Time</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedPage.load_time_ms}ms
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <HardDrive className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Memory Used</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatMemory(selectedPage.memory.usedJSHeapSize)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <FileText className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">DOM Nodes</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedPage.dom_nodes}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Cookie className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Cookies</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedPage.cookies.length}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lighthouse Scores</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(selectedPage.lighthouse).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {value !== null ? Math.round(value * 100) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Active Cookies</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPage.cookies.map((cookie, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                  >
                    {cookie}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageAnalysisSection;