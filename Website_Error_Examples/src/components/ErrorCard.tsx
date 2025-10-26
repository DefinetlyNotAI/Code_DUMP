import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import React from 'react'

interface ErrorCardProps {
  code: string;
  title: string;
  path: string;
  icon: React.ReactNode;
}

const ErrorCard = ({ code, title, path, icon }: ErrorCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden flex flex-col"
    >
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 px-2.5 py-0.5 rounded-full">
            {code}
          </span>
          <div className="text-primary-500 dark:text-primary-400">
            {icon}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
      </div>
      
      <Link
        to={path}
        className="mt-auto group border-t border-neutral-100 dark:border-neutral-800 p-4 flex items-center justify-between text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <span>View example</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
};

export default ErrorCard;