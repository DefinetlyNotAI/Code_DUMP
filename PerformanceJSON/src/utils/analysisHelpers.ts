import { PageData, PerformanceData } from '../types/performance.ts';

export const calculateMemoryEfficiency = (page: PageData): number => {
  const efficiency = (page.memory.usedJSHeapSize / page.memory.jsHeapSizeLimit) * 100;
  return Math.round(efficiency * 100) / 100;
};

export const getMemoryStatus = (efficiency: number): { status: string; color: string } => {
  if (efficiency < 1) return { status: 'Excellent', color: 'text-green-500' };
  if (efficiency < 2) return { status: 'Good', color: 'text-blue-500' };
  if (efficiency < 5) return { status: 'Fair', color: 'text-yellow-500' };
  return { status: 'Poor', color: 'text-red-500' };
};

export const getLoadTimeStatus = (loadTime: number): { status: string; color: string } => {
  if (loadTime < 1000) return { status: 'Fast', color: 'text-green-500' };
  if (loadTime < 2000) return { status: 'Good', color: 'text-blue-500' };
  if (loadTime < 3000) return { status: 'Slow', color: 'text-yellow-500' };
  return { status: 'Very Slow', color: 'text-red-500' };
};

export const analyzeCookieUsage = (data: PerformanceData) => {
  const allCookies = new Set<string>();
  data.pages.forEach(page => {
    page.cookies.forEach(cookie => allCookies.add(cookie));
  });
  
  return {
    uniqueCookies: allCookies.size,
    totalCookieInstances: data.pages.reduce((sum, page) => sum + page.cookies.length, 0),
    averageCookiesPerPage: Math.round((data.pages.reduce((sum, page) => sum + page.cookies.length, 0) / data.pages.length) * 100) / 100,
    mostCommonCookies: Array.from(allCookies).map(cookie => ({
      name: cookie,
      frequency: data.pages.filter(page => page.cookies.includes(cookie)).length
    })).sort((a, b) => b.frequency - a.frequency).slice(0, 10)
  };
};

export const analyzeAssetDistribution = (data: PerformanceData) => {
  const extensions = Object.keys(data.public_assets.by_extension);
  return extensions.map(ext => {
    const files = data.public_assets.by_extension[ext];
    const totalSize = files.reduce((sum, file) => sum + parseFloat(file.size_kb), 0);
    return {
      extension: ext,
      fileCount: files.length,
      totalSize: Math.round(totalSize * 100) / 100,
      averageSize: Math.round((totalSize / files.length) * 100) / 100
    };
  }).sort((a, b) => b.totalSize - a.totalSize);
};

export const findPerformanceOutliers = (data: PerformanceData) => {
  const avgLoadTime = data.global.average_load_time_ms;
  const avgMemoryUsage = data.pages.reduce((sum, page) => sum + calculateMemoryEfficiency(page), 0) / data.pages.length;
  
  return {
    slowestPages: data.pages
      .filter(page => page.load_time_ms > avgLoadTime * 1.5)
      .sort((a, b) => b.load_time_ms - a.load_time_ms)
      .slice(0, 5),
    memoryHeavyPages: data.pages
      .filter(page => calculateMemoryEfficiency(page) > avgMemoryUsage * 1.5)
      .sort((a, b) => calculateMemoryEfficiency(b) - calculateMemoryEfficiency(a))
      .slice(0, 5),
    lightweightPages: data.pages
      .filter(page => page.load_time_ms < avgLoadTime * 0.7 && calculateMemoryEfficiency(page) < avgMemoryUsage * 0.7)
      .sort((a, b) => a.load_time_ms - b.load_time_ms)
      .slice(0, 5)
  };
};

export const formatBytes = (kb: number): string => {
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
};

export const formatMemory = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};