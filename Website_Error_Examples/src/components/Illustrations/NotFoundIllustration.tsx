import { motion } from 'framer-motion';

const NotFoundIllustration = () => {
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
          className="absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900 opacity-30"
        />
        
        {/* 404 Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative flex items-center justify-center h-48 w-48"
        >
          <span className="text-8xl font-bold text-primary-600 dark:text-primary-400">
            404
          </span>
          
          {/* Floating elements */}
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="absolute top-0 right-0 h-6 w-6 rounded-full bg-accent-400 dark:bg-accent-600"
          />
          
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="absolute bottom-4 left-0 h-4 w-4 rounded-full bg-primary-300 dark:bg-primary-700"
          />
          
          <motion.div 
            animate={{ y: [0, -12, 0] }} 
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 1 
            }}
            className="absolute top-10 left-6 h-8 w-8 rounded-md rotate-45 bg-neutral-200 dark:bg-neutral-700"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundIllustration;