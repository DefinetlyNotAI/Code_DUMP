import React, { useState, useEffect } from 'react';
import WikiLayout from './components/WikiLayout';
import WikiPageRenderer from './components/WikiPageRenderer';
import CategoryHome from './components/CategoryHome';
import { WikiPage, WikiCategory } from './types/WikiTypes';
import { loadPage, getCategoryHome } from './utils/pageUtils';

function App() {
  // In a real app, these would come from router
  const [currentCategory, setCurrentCategory] = useState<WikiCategory>('characters');
  const [currentSlug, setCurrentSlug] = useState<string>('home');
  const [currentPage, setCurrentPage] = useState<WikiPage | null>(null);
  const [isHome, setIsHome] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse URL on mount and changes
  useEffect(() => {
    const parsePath = () => {
      // This would normally use a router, but for simplicity:
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      
      if (parts.length >= 2) {
        setCurrentCategory(parts[0] as WikiCategory);
        setCurrentSlug(parts[1]);
        setIsHome(parts[1] === 'home');
      } else {
        // Default route
        setCurrentCategory('characters');
        setCurrentSlug('home');
        setIsHome(true);
      }
    };
    
    parsePath();
    
    // Set up listener for navigation
    window.addEventListener('popstate', parsePath);
    return () => window.removeEventListener('popstate', parsePath);
  }, []);

  // Load page data when category/slug changes
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const page = await loadPage(currentCategory, currentSlug);
        
        if (page) {
          setCurrentPage(page);
          // Update document title
          document.title = `${page.title} | GameLore Wiki`;
        } else {
          setError(`Page not found: ${currentCategory}/${currentSlug}`);
          document.title = 'Page Not Found | GameLore Wiki';
        }
      } catch (err) {
        setError(`Error loading page: ${err instanceof Error ? err.message : String(err)}`);
        document.title = 'Error | GameLore Wiki';
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [currentCategory, currentSlug]);

  // Set up navigation
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    // Parse the new path
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      setCurrentCategory(parts[0] as WikiCategory);
      setCurrentSlug(parts[1]);
      setIsHome(parts[1] === 'home');
    }
  };

  // Override all link clicks for SPA navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        navigate(anchor.getAttribute('href') || '/');
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <WikiLayout>
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Loading wiki content...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => navigate('/characters/home')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      ) : currentPage ? (
        isHome ? (
          <CategoryHome category={currentCategory} homePage={currentPage} />
        ) : (
          <WikiPageRenderer page={currentPage} category={currentCategory} />
        )
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-300">No content found</p>
        </div>
      )}
    </WikiLayout>
  );
}

export default App;