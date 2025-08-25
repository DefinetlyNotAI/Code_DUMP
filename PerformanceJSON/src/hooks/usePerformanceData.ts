import { useState, useEffect } from 'react';
import { PerformanceData } from '../types/performance.ts';
import performanceJson from '../data/ARG_Performance_Results.json';

export const usePerformanceData = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setData(performanceJson as PerformanceData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load performance data');
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
};