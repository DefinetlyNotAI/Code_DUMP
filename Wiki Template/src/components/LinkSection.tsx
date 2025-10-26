import React from 'react';
import { WikiPage } from '../types/WikiTypes';

interface LinkSectionProps {
  type: string;
  pages: Array<{ page: WikiPage; path: string }>;
}

const LinkSection: React.FC<LinkSectionProps> = ({ type, pages }) => {
  // Format the link type for display
  const formatLinkType = (type: string): string => {
    // Convert from kebab case or snake case to title case
    return type
      .replace(/[-_]/g, ' ')
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  // Get the appropriate icon for the link type
  const getLinkIcon = (type: string): string => {
    switch (type) {
      case 'related-character':
        return '👤';
      case 'related-item':
        return '🔮';
      case 'related-location':
        return '🗺️';
      case 'related-quest':
        return '📜';
      case 'related-ability':
        return '⚔️';
      default:
        return '🔗';
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium mb-2 flex items-center">
        <span className="mr-2">{getLinkIcon(type)}</span>
        {formatLinkType(type)}
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pages.map(({ page, path }, index) => (
          <li key={index}>
            <a
              href={path}
              className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              {page.icon && <span className="mr-2">{page.icon}</span>}
              <span>{page.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinkSection;