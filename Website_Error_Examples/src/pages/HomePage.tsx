import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, FileX, Ban, Lock, ServerCrash, Webhook, Server, Clock, AlertTriangle } from 'lucide-react';
import ErrorCard from '../components/ErrorCard';

const ERROR_PAGES = [
  {
    code: '404',
    title: 'Page Not Found',
    path: '/404',
    icon: <FileX className="h-5 w-5" />,
    description: 'The requested page could not be found.'
  },
  {
    code: '403',
    title: 'Forbidden',
    path: '/403',
    icon: <Ban className="h-5 w-5" />,
    description: 'You don\'t have permission to access this resource.'
  },
  {
    code: '401',
    title: 'Unauthorized',
    path: '/401',
    icon: <Lock className="h-5 w-5" />,
    description: 'Authentication is required to access this resource.'
  },
  {
    code: '400',
    title: 'Bad Request',
    path: '/400',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'The server cannot process the request due to a client error.'
  },
  {
    code: '500',
    title: 'Server Error',
    path: '/500',
    icon: <ServerCrash className="h-5 w-5" />,
    description: 'An unexpected condition prevented the server from fulfilling the request.'
  },
  {
    code: '502',
    title: 'Bad Gateway',
    path: '/502',
    icon: <Webhook className="h-5 w-5" />,
    description: 'The server received an invalid response from an upstream server.'
  },
  {
    code: '503',
    title: 'Service Unavailable',
    path: '/503',
    icon: <Server className="h-5 w-5" />,
    description: 'The server is currently unable to handle the request due to temporary overload or maintenance.'
  },
  {
    code: '504',
    title: 'Gateway Timeout',
    path: '/504',
    icon: <Clock className="h-5 w-5" />,
    description: 'The server did not receive a timely response from an upstream server.'
  },
  {
    code: '429',
    title: 'Too Many Requests',
    path: '/429',
    icon: <AlertCircle className="h-5 w-5" />,
    description: 'The user has sent too many requests in a given amount of time.'
  }
];

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filterPages = (pages: typeof ERROR_PAGES) => {
    let filtered = pages;
    
    // Apply search term filtering
    if (searchTerm) {
      filtered = filtered.filter(page => 
        page.code.includes(searchTerm) || 
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filtering
    if (activeFilter === 'client') {
      filtered = filtered.filter(page =>
        ['400', '401', '403', '404', '429'].includes(page.code)
      );
    } else if (activeFilter === 'server') {
      filtered = filtered.filter(page =>
        ['500', '502', '503', '504'].includes(page.code)
      );
    }
    
    return filtered;
  };
  
  const filteredPages = filterPages(ERROR_PAGES);
  
  return (
    <div className="min-h-screen py-12 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            Error Pages Template
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Beautiful, animated error pages for your web applications. Click on any card to preview the error page.
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Search by code or description..."
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('client')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === 'client' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                Client Errors
              </button>
              <button
                onClick={() => setActiveFilter('server')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === 'server' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                Server Errors
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.length > 0 ? (
            filteredPages.map((errorPage) => (
              <ErrorCard
                key={errorPage.code}
                code={errorPage.code}
                title={errorPage.title}
                path={errorPage.path}
                icon={errorPage.icon}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No error pages found</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;