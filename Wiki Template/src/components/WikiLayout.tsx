import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Menu } from 'lucide-react';
import { getCategories } from '../utils/pageUtils';
import { WikiCategory } from '../types/WikiTypes';
import SearchBar from './SearchBar';

interface WikiLayoutProps {
  children: React.ReactNode;
}

export const WikiLayout: React.FC<WikiLayoutProps> = ({ children }) => {
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    
    loadCategories();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-purple-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">GameLore Wiki</h1>
          </div>
          
          <div className="hidden md:block flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>
          
          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10 transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="mb-4">
              <SearchBar />
            </div>
            
            <nav>
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category}>
                    <a
                      href={`/${category}/home`}
                      className="block py-2 px-3 rounded-md hover:bg-gray-700 capitalize"
                    >
                      {category.replace('_', ' ')}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-gray-800 shadow-md">
          <div className="p-4">
            <nav className="space-y-1">
              {categories.map(category => (
                <div key={category} className="mb-4">
                  <h3 className="text-lg font-medium capitalize mb-2 text-blue-400">
                    {category.replace('_', ' ')}
                  </h3>
                  <ul className="space-y-1 pl-2">
                    <li>
                      <a
                        href={`/${category}/home`}
                        className="block py-1.5 px-3 rounded-md hover:bg-gray-700 text-sm"
                      >
                        Overview
                      </a>
                    </li>
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>GameLore Wiki - A dynamic fandom content system - {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default WikiLayout;