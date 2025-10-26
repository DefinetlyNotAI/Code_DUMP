import { motion } from 'framer-motion';
import { FileWarning } from 'lucide-react';

const BadRequestIllustration = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Background pattern */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full bg-warning-100 dark:bg-warning-900 opacity-30"
        />
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative flex flex-col items-center justify-center h-48 w-48"
        >
          {/* Main shape - document with warning */}
          <motion.div 
            initial={{ y: 5 }}
            animate={{ y: [-5, 5] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              className="bg-warning-500 dark:bg-warning-600 rounded-xl p-5"
            >
              <FileWarning className="h-16 w-16 text-white" />
            </motion.div>
            
            {/* Code snippets floating around */}
            <motion.div 
              animate={{ 
                x: [0, 15, 0], 
                y: [0, -10, 0],
                rotate: [0, 15, 0]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
              className="absolute -top-4 -right-6 bg-white dark:bg-neutral-800 h-6 w-12 rounded-md shadow-md flex items-center justify-center"
            >
              <div className="h-1 w-8 bg-warning-300 dark:bg-warning-700 rounded-full"></div>
            </motion.div>
            
            <motion.div 
              animate={{ 
                x: [0, -15, 0], 
                y: [0, 10, 0],
                rotate: [0, -10, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.5
              }}
              className="absolute -bottom-4 -left-6 bg-white dark:bg-neutral-800 h-6 w-14 rounded-md shadow-md flex items-center justify-center"
            >
              <div className="h-1 w-10 bg-warning-300 dark:bg-warning-700 rounded-full"></div>
            </motion.div>
          </motion.div>
          
          {/* Error code */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 text-2xl font-bold text-warning-600 dark:text-warning-500"
          >
            400
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BadRequestIllustration;