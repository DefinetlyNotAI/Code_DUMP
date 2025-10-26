import React from 'react';

interface StatusBadgeProps {
  status: 'draft' | 'incomplete' | 'wip';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClasses = '';
  let label = status.charAt(0).toUpperCase() + status.slice(1);
  
  switch (status) {
    case 'draft':
      colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      break;
    case 'incomplete':
      colorClasses = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      break;
    case 'wip':
      colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
      {label}
    </span>
  );
};

export default StatusBadge;