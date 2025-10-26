import {motion} from "framer-motion";
import {Server} from "lucide-react";

const ServiceUnavailableIllustration = () => {
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
                    {/* Server under maintenance */}
                    <motion.div className="relative">
                        <motion.div
                            animate={{
                                rotate: [0, 2, 0, -2, 0],
                                scale: [1, 0.98, 1, 1.02, 1]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity
                            }}
                            className="bg-error-200 dark:bg-error-800 rounded-md w-28 h-20 flex flex-col items-center justify-center p-2 border-t-4 border-error-500 dark:border-error-500"
                        >
                            <Server className="h-8 w-8 text-error-600 dark:text-error-500 mb-1" />

                            {/* Status indicators */}
                            <div className="flex space-x-2 mt-1">
                                <motion.div
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="h-2 w-2 rounded-full bg-error-500"
                                ></motion.div>
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                                    className="h-2 w-2 rounded-full bg-error-500"
                                ></motion.div>
                                <motion.div
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                                    className="h-2 w-2 rounded-full bg-error-500"
                                ></motion.div>
                            </div>
                        </motion.div>

                        {/* Tools/maintenance symbols */}
                        <motion.div
                            animate={{
                                rotate: [0, 25, 0, -25, 0]
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                            className="absolute -top-6 -left-6 h-10 w-4 bg-neutral-300 dark:bg-neutral-600 rounded-sm rotate-45"
                        ></motion.div>

                        <motion.div
                            animate={{
                                rotate: [0, -15, 0, 15, 0]
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: 0.5
                            }}
                            className="absolute -top-3 -right-8 h-4 w-10 bg-neutral-300 dark:bg-neutral-600 rounded-sm -rotate-12"
                        ></motion.div>

                        {/* Error code */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="absolute -bottom-8 text-2xl font-bold text-error-600 dark:text-error-500"
                        >
                            503
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ServiceUnavailableIllustration;