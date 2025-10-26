import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { WikiPage } from '../types/WikiTypes';
import { getAllPages } from '../utils/pageUtils';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ item: WikiPage; category: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [fuse, setFuse] = useState<Fuse<{ item: WikiPage; category: string }> | null>(null);

  useEffect(() => {
    const initializeSearch = async () => {
      const pages = await getAllPages();
      const searchIndex = new Fuse(pages, {
        keys: ['item.title', 'item.tags', 'category'],
        threshold: 0.3,
        includeMatches: true
      });
      setFuse(searchIndex);
    };

    initializeSearch();

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!fuse || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults = fuse.search(query).slice(0, 10);
    setResults(searchResults.map(result => result.item));
    setIsLoading(false);
    setShowResults(true);
  }, [query, fuse]);

  const handleResultClick = (category: string, title: string) => {
    const slug = title.toLowerCase().replace(/\s+/g, '_');
    window.location.href = `/${category}/${slug}`;
    setShowResults(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wiki..."
          className="w-full py-2 px-4 pr-10 rounded-full bg-white/20 focus:bg-white/30 focus:outline-none text-white placeholder-white/70"
        />
        <Search className="absolute right-3 top-2.5 h-5 w-5 text-white/70" />
      </div>

      {showResults && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              Searching...
            </div>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li
                  key={`${result.category}-${result.item.title}-${index}`}
                  className="border-b border-gray-700 last:border-none"
                >
                  <button
                    onClick={() => handleResultClick(result.category, result.item.title)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center"
                  >
                    {result.item.icon && (
                      <span className="mr-2">{result.item.icon}</span>
                    )}
                    <div>
                      <div className="font-medium">{result.item.title}</div>
                      <div className="text-sm text-gray-400 capitalize">
                        {result.category.replace('_', ' ')}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;