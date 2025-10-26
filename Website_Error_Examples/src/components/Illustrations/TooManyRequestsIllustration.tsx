import {motion} from "framer-motion";
import {AlertCircle} from "lucide-react";

const TooManyRequestsIllustration = () => {
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
                    className="absolute inset-0 rounded-full bg-warning-100 dark:bg-warning-900 opacity-30"
                />

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative flex items-center justify-center h-48 w-48"
                >
                    {/* Traffic light */}
                    <motion.div
                        animate={{ y: [-5, 5] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                        className="relative bg-neutral-200 dark:bg-neutral-800 rounded-lg w-16 h-40 flex flex-col items-center justify-evenly p-2"
                    >
                        <motion.div
                            className="h-10 w-10 rounded-full bg-error-500"
                            animate={{
                                opacity: [1, 0.5, 1],
                                scale: [1, 0.9, 1]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                        <motion.div
                            className="h-10 w-10 rounded-full bg-warning-400"
                            animate={{ opacity: 0.4 }}
                        />
                        <motion.div
                            className="h-10 w-10 rounded-full bg-success-500"
                            animate={{ opacity: 0.4 }}
                        />

                        {/* Pole */}
                        <motion.div className="absolute -bottom-10 left-1/2 h-10 w-2 bg-neutral-300 dark:bg-neutral-700" style={{ transform: 'translateX(-50%)' }}></motion.div>
                    </motion.div>

                    {/* Animated traffic/requests */}
                    <motion.div className="absolute inset-0">
                        <motion.div
                            initial={{ x: 100, y: 0, opacity: 0 }}
                            animate={{
                                x: [-100, 100],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 0.5
                            }}
                            className="absolute top-1/4 left-0 h-1.5 w-5 bg-warning-500 rounded-sm"
                        ></motion.div>

                        <motion.div
                            initial={{ x: 100, y: 0, opacity: 0 }}
                            animate={{
                                x: [-100, 100],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                delay: 0.3,
                                repeatDelay: 0.7
                            }}
                            className="absolute top-1/3 left-0 h-1.5 w-7 bg-warning-500 rounded-sm"
                        ></motion.div>

                        <motion.div
                            initial={{ x: 100, y: 0, opacity: 0 }}
                            animate={{
                                x: [-100, 100],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 0.6,
                                repeatDelay: 0.3
                            }}
                            className="absolute top-2/3 left-0 h-1.5 w-6 bg-warning-500 rounded-sm"
                        ></motion.div>
                    </motion.div>

                    {/* Alert Circle */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.5
                        }}
                        className="absolute -bottom-8 -right-8"
                    >
                        <div className="bg-warning-500 dark:bg-warning-600 rounded-full p-2">
                            <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                    </motion.div>

                    {/* Error code */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="absolute -bottom-8 text-2xl font-bold text-warning-600 dark:text-warning-500"
                    >
                        429
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default TooManyRequestsIllustration;
