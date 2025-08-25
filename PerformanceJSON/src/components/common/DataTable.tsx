import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  maxHeight?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  maxHeight = 'max-h-96'
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getValue = (item: T, key: string) => {
    return key.includes('.') 
      ? key.split('.').reduce((obj, k) => obj?.[k], item)
      : item[key];
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortConfig?.key === String(column.key) && (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {sortedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(getValue(item, String(column.key)), item)
                      : getValue(item, String(column.key))
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;