import React from 'react';

interface WikiMarkdownProps {
  content: string;
}

// This is a simplified markdown renderer for demonstration
// In a real app, you'd use a library like react-markdown
const WikiMarkdown: React.FC<WikiMarkdownProps> = ({ content }) => {
  // Simple markdown processing
  const processMarkdown = (text: string): string => {
    // Bold
    let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headers
    processed = processed.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-semibold my-3">$1</h3>');
    processed = processed.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-semibold my-4">$1</h2>');
    processed = processed.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold my-4">$1</h1>');
    
    // Links
    processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');
    
    // Blockquotes
    processed = processed.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">$1</blockquote>');
    
    // Lists
    processed = processed.replace(/^- (.*?)$/gm, '<li class="ml-6 list-disc">$1</li>');
    processed = processed.replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-6 list-decimal">$2</li>');
    
    // Code
    processed = processed.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Paragraphs
    processed = processed.replace(/^(?!<[hlia]|<blockquote|<code)(.*?)$/gm, '<p class="my-2">$1</p>');
    
    return processed;
  };

  return (
    <div 
      className="wiki-markdown"
      dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
    />
  );
};

export default WikiMarkdown;