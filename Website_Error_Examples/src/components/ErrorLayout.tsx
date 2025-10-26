import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

interface ErrorLayoutProps {
  code: string;
  title: string;
  message: string;
  children: ReactNode;
}

const ErrorLayout = ({
                       code,
                       title,
                       message,
                       children,
                     }: ErrorLayoutProps) => {
  return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-block px-3 py-1 mb-4 text-sm font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100"
                >
                  Error {code}
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-3xl font-bold text-neutral-900 dark:text-white mb-4"
                >
                  {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-neutral-600 dark:text-neutral-300 mb-8"
                >
                  {message}
                </motion.p>
              </div>

              <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-wrap gap-3"
              >
                <Link
                    to="/"
                    className="btn btn-primary group"
                >
                  <Home className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  Back to Home
                </Link>
              </motion.div>
            </div>

            <div className="w-full md:w-1/2 bg-neutral-50 dark:bg-neutral-800 p-6 md:p-8 flex items-center justify-center">
              <div className="error-illustration">
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default ErrorLayout;
