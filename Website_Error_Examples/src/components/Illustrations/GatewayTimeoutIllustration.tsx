import {motion} from "framer-motion";
import {Clock} from "lucide-react";

const GatewayTimeoutIllustration = () => {
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
                    className="absolute inset-0 rounded-full bg-neutral-100 dark:bg-neutral-800 opacity-30"
                />

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative flex items-center justify-center h-48 w-48"
                >
                    {/* Clock with animation */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 60,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="relative"
                    >
                        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-full h-28 w-28 flex items-center justify-center border-4 border-neutral-300 dark:border-neutral-600">
                            <Clock className="h-16 w-16 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </motion.div>

                    {/* Hourglass sand particles */}
                    <motion.div className="absolute inset-0">
                        <motion.div
                            animate={{
                                y: [0, 60],
                                opacity: [1, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 0.2
                            }}
                            className="absolute top-0 left-1/2 h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
                            style={{ transform: 'translateX(-50%)' }}
                        ></motion.div>

                        <motion.div
                            animate={{
                                y: [0, 50],
                                opacity: [1, 0]
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: 0.3,
                                repeatDelay: 0.5
                            }}
                            className="absolute top-5 left-[45%] h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500"
                        ></motion.div>

                        <motion.div
                            animate={{
                                y: [0, 45],
                                opacity: [1, 0]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.6,
                                repeatDelay: 0.7
                            }}
                            className="absolute top-8 left-[55%] h-1 w-1 rounded-full bg-neutral-400 dark:bg-neutral-500"
                        ></motion.div>
                    </motion.div>

                    {/* Error text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="absolute -bottom-8 text-2xl font-bold text-neutral-600 dark:text-neutral-400"
                    >
                        504
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default GatewayTimeoutIllustration;
