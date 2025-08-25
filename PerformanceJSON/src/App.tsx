import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { usePerformanceData } from './hooks/usePerformanceData.ts';
import Header from './components/layout/Header.tsx';
import Navigation from './components/layout/Navigation.tsx';
import OverviewSection from './components/sections/OverviewSection.tsx';
import PageAnalysisSection from './components/sections/PageAnalysisSection.tsx';
import MemorySection from './components/sections/MemorySection.tsx';
import CookiesSection from './components/sections/CookiesSection.tsx';
import AssetsSection from './components/sections/AssetsSection.tsx';
import IssuesSection from './components/sections/IssuesSection.tsx';
import { Loader2 } from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const { data, loading, error } = usePerformanceData();

  const renderSection = () => {
    if (!data) return null;

    switch (activeSection) {
      case 'overview':
        return <OverviewSection data={data} />;
      case 'pages':
        return <PageAnalysisSection data={data} />;
      case 'memory':
        return <MemorySection data={data} />;
      case 'cookies':
        return <CookiesSection data={data} />;
      case 'assets':
        return <AssetsSection data={data} />;
      case 'issues':
        return <IssuesSection data={data} />;
      default:
        return <OverviewSection data={data} />;
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-gray-600 dark:text-gray-300">Loading performance data...</span>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-xl mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300">{error}</div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex">
          <Navigation 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
          <main className="flex-1 p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
