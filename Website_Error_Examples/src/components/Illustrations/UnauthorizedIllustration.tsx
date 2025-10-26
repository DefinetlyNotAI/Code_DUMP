import {motion} from "framer-motion";
import {UserX} from "lucide-react";

const UnauthorizedIllustration = () => {
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

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative flex items-center justify-center h-48 w-48"
                >
                    {/* Main shape - User with X */}
                    <motion.div
                        animate={{ y: [-5, 5] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                        className="bg-primary-500 dark:bg-primary-600 rounded-full p-6"
                    >
                        <UserX className="h-16 w-16 text-white" />
                    </motion.div>

                    {/* Floating lock elements */}
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                            scale: { duration: 5, repeat: Infinity, repeatType: "reverse" }
                        }}
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full border-2 border-primary-300 dark:border-primary-700 flex items-center justify-center"
                    >
                        <div className="h-3 w-3 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                    </motion.div>

                    <motion.div
                        animate={{
                            rotate: [360, 0],
                            scale: [1, 0.8, 1]
                        }}
                        transition={{
                            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                            scale: { duration: 6, repeat: Infinity, repeatType: "reverse", delay: 1 }
                        }}
                        className="absolute -bottom-2 -left-2 h-10 w-10 rounded-full border-2 border-primary-300 dark:border-primary-700 flex items-center justify-center"
                    >
                        <div className="h-4 w-4 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default UnauthorizedIllustration;
