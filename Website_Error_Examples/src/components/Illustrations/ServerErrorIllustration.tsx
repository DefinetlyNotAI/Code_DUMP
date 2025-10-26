import { motion } from 'framer-motion';
import { ServerCrash } from 'lucide-react';

const ServerErrorIllustration = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Background Elements */}
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, repeatType: "reverse" }
          }}
          className="absolute inset-0 rounded-full bg-error-100 dark:bg-error-900 opacity-40"
        />
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative flex flex-col items-center justify-center h-48 w-48"
        >
          {/* Server with smoke */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-4"
          >
            <motion.div
              animate={{ 
                y: [0, -2, 0, -4, 0],
                rotate: [0, 1, 0, -1, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <ServerCrash className="h-16 w-16 text-error-600 dark:text-error-500" />
            </motion.div>
            
            {/* Smoke/sparks effect */}
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0],
                y: [-5, -15],
                x: [0, 5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="absolute top-0 right-3 h-3 w-3 rounded-full bg-error-300 dark:bg-error-400 blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0],
                y: [-5, -20],
                x: [0, -7]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.5
              }}
              className="absolute top-0 left-3 h-2 w-2 rounded-full bg-error-300 dark:bg-error-400 blur-sm"
            />
          </motion.div>
          
          {/* 500 Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl font-bold text-error-600 dark:text-error-500"
          >
            500
          </motion.div>
          
          {/* Circuit-like lines */}
          <motion.div className="absolute inset-0 opacity-20">
            <motion.div 
              className="absolute top-1/4 left-0 h-0.5 w-10 bg-error-500"
              animate={{ width: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute bottom-1/4 right-0 h-0.5 w-10 bg-error-500"
              animate={{ width: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
            />
            <motion.div 
              className="absolute top-0 right-1/4 h-10 w-0.5 bg-error-500"
              animate={{ height: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1 }}
            />
            <motion.div 
              className="absolute bottom-0 left-1/4 h-10 w-0.5 bg-error-500"
              animate={{ height: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1.5 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ServerErrorIllustration;