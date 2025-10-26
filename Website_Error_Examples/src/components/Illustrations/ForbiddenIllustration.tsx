import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const ForbiddenIllustration = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Background Circle */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full bg-error-100 dark:bg-error-900 opacity-30"
        />
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative flex items-center justify-center h-48 w-48"
        >
          {/* Red circle with lock icon */}
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="relative flex items-center justify-center h-32 w-32 bg-error-500 dark:bg-error-600 rounded-full"
          >
            <Lock className="h-12 w-12 text-white" />
          </motion.div>
          
          {/* Floating elements */}
          <motion.div 
            animate={{ 
              rotate: [0, 10, 0, -10, 0],
              x: [0, 5, 0, -5, 0]
            }} 
            transition={{ 
              duration: 5, 
              repeat: Infinity
            }}
            className="absolute top-0 right-4 h-10 w-3 rounded-sm bg-error-300 dark:bg-error-700"
          />
          
          <motion.div 
            animate={{ 
              rotate: [0, -15, 0, 15, 0],
              x: [0, -7, 0, 7, 0]
            }} 
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              delay: 0.5
            }}
            className="absolute bottom-4 left-4 h-10 w-3 rounded-sm bg-error-300 dark:bg-error-700"
          />
          
          <motion.div 
            animate={{ 
              rotate: [0, 20, 0, -20, 0],
              y: [0, 7, 0, -7, 0]
            }} 
            transition={{ 
              duration: 7, 
              repeat: Infinity,
              delay: 1
            }}
            className="absolute top-10 left-0 h-3 w-10 rounded-sm bg-error-300 dark:bg-error-700"
          />
          
          <motion.div 
            animate={{ 
              rotate: [0, -25, 0, 25, 0],
              y: [0, -6, 0, 6, 0]
            }} 
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              delay: 1.5
            }}
            className="absolute bottom-10 right-0 h-3 w-10 rounded-sm bg-error-300 dark:bg-error-700"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForbiddenIllustration;