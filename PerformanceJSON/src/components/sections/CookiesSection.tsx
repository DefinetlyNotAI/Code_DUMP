import React from 'react';
import { Cookie, Database, Shield, TrendingUp } from 'lucide-react';
import { PerformanceData } from '../../types/performance.ts';
import MetricCard from '../common/MetricCard.tsx';
import DataTable from '../common/DataTable.tsx';
import { analyzeCookieUsage } from '../../utils/analysisHelpers.ts';

interface CookiesSectionProps {
  data: PerformanceData;
}

const CookiesSection: React.FC<CookiesSectionProps> = ({ data }) => {
  const cookieAnalysis = analyzeCookieUsage(data);
  
  const storageData = data.pages.map(page => ({
    route: page.route,
    cookies: page.cookies.length,
    localStorage: page.local_storage_kb,
    cookieList: page.cookies
  })).sort((a, b) => b.cookies - a.cookies);

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
      key: 'cookies',
      label: 'Cookies',
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${
          value > 20 ? 'text-green-600 dark:text-green-400' : 
          value > 10 ? 'text-blue-600 dark:text-blue-400' : 
          'text-gray-600 dark:text-gray-400'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'localStorage',
      label: 'Local Storage',
      sortable: true,
      render: (value: number) => `${value} KB`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cookies & Storage Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Data persistence and state management across your ARG experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Unique Cookies"
          value={cookieAnalysis.uniqueCookies}
          subtitle="Different cookie types"
          icon={Cookie}
          status={{ label: 'Rich State', color: 'text-green-600 dark:text-green-400' }}
        />
        
        <MetricCard
          title="Total Instances"
          value={cookieAnalysis.totalCookieInstances}
          subtitle="Across all pages"
          icon={Database}
          status={{ label: 'Comprehensive', color: 'text-blue-600 dark:text-blue-400' }}
        />
        
        <MetricCard
          title="Average per Page"
          value={cookieAnalysis.averageCookiesPerPage}
          subtitle="Cookie density"
          icon={TrendingUp}
          status={{ label: 'Optimal', color: 'text-purple-600 dark:text-purple-400' }}
        />
        
        <MetricCard
          title="Data Strategy"
          value="ARG Optimized"
          subtitle="Save state focused"
          icon={Shield}
          status={{ label: 'Excellent', color: 'text-indigo-600 dark:text-indigo-400' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Common Cookies
          </h3>
          <div className="space-y-3">
            {cookieAnalysis.mostCommonCookies.slice(0, 8).map((cookie, index) => (
              <div key={cookie.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {cookie.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {cookie.frequency} pages
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full"
                      style={{ width: `${(cookie.frequency / data.pages.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ARG Cookie Categories
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Game State</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Progress tracking cookies like "terminal_unlocked", "Choice_Unlocked", "File_Unlocked"
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Narrative Flags</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Story progression markers like "cutscene_seen", "moonlight_time_cutscene_played"
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Authentication</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Login states like "tree98_logged_in", "wifi_login", "wifi_passed"
              </p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={storageData}
        columns={columns}
        maxHeight="max-h-[500px]"
      />

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Cookie className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 dark:text-green-100">Excellent Data Strategy</h4>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              Your ARG demonstrates sophisticated state management with {cookieAnalysis.uniqueCookies} unique cookies 
              tracking game progress, narrative flags, and user authentication. This comprehensive approach ensures 
              players can seamlessly continue their journey across sessions while maintaining immersion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesSection;