import React from 'react';
import { 
  BarChart3, 
  Globe, 
  HardDrive, 
  FileText,
  Cookie,
  AlertTriangle
} from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pages', label: 'Page Analysis', icon: Globe },
  { id: 'memory', label: 'Memory Usage', icon: HardDrive },
  { id: 'assets', label: 'Assets', icon: FileText },
  { id: 'cookies', label: 'Cookies & Storage', icon: Cookie },
  { id: 'issues', label: 'Issues & Insights', icon: AlertTriangle },
];

const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen">
      <div className="p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;