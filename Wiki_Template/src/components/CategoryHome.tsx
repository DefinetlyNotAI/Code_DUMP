import React from 'react';
import { WikiCategory, WikiPage } from '../types/WikiTypes';
import { getCategoryPages } from '../utils/pageUtils';
import TagList from './TagList';

interface CategoryHomeProps {
  category: WikiCategory;
  homePage: WikiPage;
}

const CategoryHome: React.FC<CategoryHomeProps> = ({ category, homePage }) => {
  const [pages, setPages] = React.useState<WikiPage[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [allTags, setAllTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    const loadPages = async () => {
      const allPages = await getCategoryPages(category);
      // Remove the home page from the list
      const contentPages = allPages.filter(page => page.title !== homePage.title);
      setPages(contentPages);
      
      // Collect all unique tags
      const tags = new Set<string>();
      contentPages.forEach(page => {
        page.tags?.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    };
    
    loadPages();
  }, [category, homePage]);

  const filteredPages = pages.filter(page => 
    selectedTags.length === 0 || 
    selectedTags.every(tag => page.tags?.includes(tag))
  );

  // Format category name for display
  const formatCategoryName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Get rarity color class
  const getRarityColorClass = (rating?: number) => {
    switch (rating) {
      case 5: return 'text-yellow-400'; // Legendary
      case 4: return 'text-purple-400'; // Epic
      case 3: return 'text-blue-400';   // Rare
      case 2: return 'text-green-400';  // Uncommon
      case 1: return 'text-gray-400';   // Common
      default: return 'text-white';
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold mb-2">{formatCategoryName(category)}</h1>
        
        {homePage.text.description && (
          <div className="prose prose-sm prose-invert max-w-none">
            <p>{homePage.text.description}</p>
          </div>
        )}
      </div>
      
      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-2">Filter by Tags</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <span
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer
                  ${selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }
                `}
              >
                {tag}
              </span>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      
      {/* Entries list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page, index) => (
          <a 
            key={index}
            href={`/${category}/${page.title.toLowerCase().replace(/\s+/g, '_')}`}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-center mb-2">
                {page.icon && <span className="text-2xl mr-2">{page.icon}</span>}
                <h3 className={`text-xl font-semibold ${getRarityColorClass(page.rating)}`}>
                  {page.title}
                </h3>
              </div>
              
              {page.text.summary && (
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {page.text.summary}
                </p>
              )}
              
              {page.tags && page.tags.length > 0 && (
                <div className="mt-2">
                  <TagList tags={page.tags} />
                </div>
              )}
              
              {page.meta?.status && (
                <div className="mt-3 text-right">
                  <span className={`
                    text-xs px-2 py-1 rounded
                    ${page.meta.status === 'wip' ? 'bg-blue-900 text-blue-200' : 
                      page.meta.status === 'draft' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-orange-900 text-orange-200'}
                  `}>
                    {page.meta.status}
                  </span>
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
      
      {filteredPages.length === 0 && (
        <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-300">
            {selectedTags.length > 0
              ? `No entries found with the selected tags: ${selectedTags.join(', ')}`
              : 'No entries found in this category.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryHome;