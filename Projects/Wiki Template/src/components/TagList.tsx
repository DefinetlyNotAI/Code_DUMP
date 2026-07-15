import React from 'react';

interface TagListProps {
  tags: string[];
  onClick?: (tag: string) => void;
}

const TagList: React.FC<TagListProps> = ({ tags, onClick }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span
          key={tag}
          onClick={() => onClick && onClick(tag)}
          className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200
            ${onClick ? 'cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors' : ''}
          `}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

export default TagList;