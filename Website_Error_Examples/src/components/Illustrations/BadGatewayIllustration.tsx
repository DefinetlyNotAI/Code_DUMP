import {motion} from "framer-motion";
import {Webhook} from "lucide-react";

const BadGatewayIllustration = () => {
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
                    {/* Server connections */}
                    <motion.div className="relative">
                        {/* First server */}
                        <motion.div
                            animate={{ x: [-30, -30], y: [0, 0] }}
                            className="absolute left-0 top-0 bg-error-200 dark:bg-error-800 rounded-md w-12 h-16 flex items-center justify-center"
                        >
                            <div className="bg-error-300 dark:bg-error-700 h-8 w-1.5 rounded-sm"></div>
                            <div className="bg-error-300 dark:bg-error-700 h-8 w-1.5 rounded-sm ml-1.5"></div>
                            <div className="bg-error-300 dark:bg-error-700 h-8 w-1.5 rounded-sm ml-1.5"></div>
                        </motion.div>

                        {/* Second server */}
                        <motion.div
                            animate={{ x: [30, 30], y: [0, 0] }}
                            className="absolute right-0 top-0 bg-error-200 dark:bg-error-800 rounded-md w-12 h-16 flex items-center justify-center"
                        >
                            <div className="bg-error-300 dark:bg-error-700 h-8 w-1.5 rounded-sm"></div>
                            <div className="bg-error-300 dark:bg-error-700 h-8 w-1.5 rounded-sm ml-1.5"></div>
                            <div className="bg-error-300 dark:bg-error-700 h-8 w-1.5 rounded-sm ml-1.5"></div>
                        </motion.div>

                        {/* Webhook icon in the middle */}
                        <motion.div
                            animate={{
                                rotate: [0, 5, 0, -5, 0],
                                scale: [1, 1.05, 1, 0.95, 1]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity
                            }}
                            className="relative bg-error-500 dark:bg-error-600 rounded-full p-4 z-10"
                        >
                            <Webhook className="h-10 w-10 text-white" />
                        </motion.div>

                        {/* Broken connection lines */}
                        <motion.div className="absolute inset-0 z-0">
                            {/* Left connection - broken */}
                            <motion.div
                                className="absolute top-8 left-12 h-0.5 w-8 bg-error-400"
                                animate={{
                                    opacity: [1, 0.5, 0],
                                    width: [8, 4, 0]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            ></motion.div>

                            {/* Right connection - broken */}
                            <motion.div
                                className="absolute top-8 right-12 h-0.5 w-8 bg-error-400"
                                animate={{
                                    opacity: [1, 0.5, 0],
                                    width: [8, 4, 0]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    delay: 0.75
                                }}
                            ></motion.div>

                            {/* Warning symbols */}
                            <motion.div
                                className="absolute top-5 left-20 text-xs font-bold text-error-600"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            >
                                !
                            </motion.div>

                            <motion.div
                                className="absolute top-5 right-20 text-xs font-bold text-error-600"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    delay: 1
                                }}
                            >
                                !
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Error text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="absolute -bottom-8 text-2xl font-bold text-error-600 dark:text-error-500"
                    >
                        502
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default BadGatewayIllustration;
