import React from 'react';
import { FileText, Music, Image, Video, Archive, HardDrive } from 'lucide-react';
import { PerformanceData } from '../../types/performance.ts';
import MetricCard from '../common/MetricCard.tsx';
import DataTable from '../common/DataTable.tsx';
import { analyzeAssetDistribution, formatBytes } from '../../utils/analysisHelpers.ts';

interface AssetsSectionProps {
  data: PerformanceData;
}

const AssetsSection: React.FC<AssetsSectionProps> = ({ data }) => {
  const assetDistribution = analyzeAssetDistribution(data);
  const totalSizeKB = parseFloat(data.public_assets.total_size.replace(' MB', '')) * 1024;

  const getExtensionIcon = (ext: string) => {
    if (['.mp3', '.wav', '.m4a'].includes(ext)) return Music;
    if (['.png', '.jpg', '.jpeg'].includes(ext)) return Image;
    if (['.mp4'].includes(ext)) return Video;
    if (['.zip'].includes(ext)) return Archive;
    return FileText;
  };

  const getExtensionColor = (ext: string) => {
    if (['.mp3', '.wav', '.m4a'].includes(ext)) return 'text-green-600 dark:text-green-400';
    if (['.png', '.jpg', '.jpeg'].includes(ext)) return 'text-blue-600 dark:text-blue-400';
    if (['.mp4'].includes(ext)) return 'text-purple-600 dark:text-purple-400';
    if (['.zip'].includes(ext)) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const columns = [
    {
      key: 'extension',
      label: 'Type',
      render: (value: string) => {
        const Icon = getExtensionIcon(value);
        const color = getExtensionColor(value);
        return (
          <div className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="font-medium">{value}</span>
          </div>
        );
      }
    },
    {
      key: 'fileCount',
      label: 'Files',
      sortable: true
    },
    {
      key: 'totalSize',
      label: 'Total Size',
      sortable: true,
      render: (value: number) => formatBytes(value)
    },
    {
      key: 'averageSize',
      label: 'Avg Size',
      sortable: true,
      render: (value: number) => formatBytes(value)
    },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (_value: any, item: any) => {
        const percentage = (item.totalSize / totalSizeKB) * 100;
        return (
          <div className="flex items-center space-x-2">
            <span>{percentage.toFixed(1)}%</span>
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    }
  ];

  const audioFiles = assetDistribution.filter(item => ['.mp3', '.wav', '.m4a'].includes(item.extension));
  const imageFiles = assetDistribution.filter(item => ['.png', '.jpg', '.jpeg'].includes(item.extension));
  const videoFiles = assetDistribution.filter(item => ['.mp4'].includes(item.extension));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assets Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Comprehensive breakdown of your ARG's media and static assets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Assets"
          value={data.public_assets.breakdown.length}
          subtitle="Files"
          icon={FileText}
          status={{ label: 'Rich Content', color: 'text-blue-600 dark:text-blue-400' }}
        />
        
        <MetricCard
          title="Total Size"
          value={data.public_assets.total_size}
          subtitle="All assets"
          icon={HardDrive}
          status={{ label: 'Immersive', color: 'text-purple-600 dark:text-purple-400' }}
        />
        
        <MetricCard
          title="Audio Files"
          value={audioFiles.reduce((sum, item) => sum + item.fileCount, 0)}
          subtitle={`${formatBytes(audioFiles.reduce((sum, item) => sum + item.totalSize, 0))}`}
          icon={Music}
          status={{ label: 'Rich Audio', color: 'text-green-600 dark:text-green-400' }}
        />
        
        <MetricCard
          title="Visual Assets"
          value={imageFiles.reduce((sum, item) => sum + item.fileCount, 0) + videoFiles.reduce((sum, item) => sum + item.fileCount, 0)}
          subtitle={`${formatBytes(imageFiles.reduce((sum, item) => sum + item.totalSize, 0) + videoFiles.reduce((sum, item) => sum + item.totalSize, 0))}`}
          icon={Image}
          status={{ label: 'Visual Rich', color: 'text-indigo-600 dark:text-indigo-400' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            data={assetDistribution}
            columns={columns}
            maxHeight="max-h-[400px]"
          />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Asset Categories
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h4 className="font-medium text-green-800 dark:text-green-200">Audio</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {audioFiles.reduce((sum, item) => sum + item.fileCount, 0)} files • {formatBytes(audioFiles.reduce((sum, item) => sum + item.totalSize, 0))}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Atmospheric music and sound effects
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Images</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {imageFiles.reduce((sum, item) => sum + item.fileCount, 0)} files • {formatBytes(imageFiles.reduce((sum, item) => sum + item.totalSize, 0))}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Visual elements and graphics
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Video</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {videoFiles.reduce((sum, item) => sum + item.fileCount, 0)} files • {formatBytes(videoFiles.reduce((sum, item) => sum + item.totalSize, 0))}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Cinematic content
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <HardDrive className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Rich Media Experience</h4>
            <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1">
              Your ARG features a comprehensive media library with {data.public_assets.breakdown.length} assets 
              totaling {data.public_assets.total_size}. The heavy emphasis on audio content 
              ({audioFiles.reduce((sum, item) => sum + item.fileCount, 0)} audio files) creates an immersive 
              atmospheric experience essential for effective ARG storytelling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetsSection;