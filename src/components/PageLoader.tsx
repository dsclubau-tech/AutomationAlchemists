import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

interface PageLoaderProps {
    pageName?: string;
    minDisplayTime?: number;
}

const PageLoader = ({ pageName = '', minDisplayTime = 500 }: PageLoaderProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, minDisplayTime);

        return () => clearTimeout(timer);
    }, [minDisplayTime]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[9999] bg-background-dark flex flex-col items-center justify-center"
                >
                    {/* Logo */}
                    <motion.img
                        src={logo}
                        alt="AAlchemists Logo"
                        className="w-24 h-24 mb-4"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Brand Text */}
                    <h1 className="text-primary text-2xl font-bold font-display tracking-tight mb-6">
                        AAlchemists
                    </h1>

                    {/* Animated Gears */}
                    <div className="relative w-20 h-12 mb-4">
                        {/* Large Gear */}
                        <motion.svg
                            className="absolute left-0 w-11 h-11"
                            viewBox="0 0 100 100"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <path
                                d="M50 15 L53 15 L55 5 L60 5 L62 15 L65 16 L72 8 L77 12 L71 20 L73 23 L83 20 L86 25 L77 30 L78 33 L88 35 L88 40 L78 42 L77 45 L86 52 L82 57 L73 52 L70 55 L75 65 L70 68 L63 60 L60 61 L60 72 L55 72 L53 62 L50 62 L47 72 L42 72 L42 61 L39 60 L32 68 L27 65 L32 55 L29 52 L20 57 L16 52 L25 45 L24 42 L14 40 L14 35 L24 33 L25 30 L16 25 L19 20 L29 23 L31 20 L25 12 L30 8 L37 16 L40 15 L42 5 L47 5 L49 15 Z"
                                stroke="#d4af37"
                                strokeWidth="2"
                                fill="none"
                            />
                            <circle cx="50" cy="38" r="12" stroke="#d4af37" strokeWidth="2" fill="none" />
                        </motion.svg>

                        {/* Small Gear */}
                        <motion.svg
                            className="absolute right-1 top-0.5 w-8 h-8"
                            viewBox="0 0 100 100"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                            <path
                                d="M50 20 L54 20 L56 10 L62 10 L64 20 L68 22 L76 14 L82 20 L74 28 L76 32 L86 34 L86 40 L76 42 L74 46 L82 54 L76 60 L68 52 L64 54 L62 64 L56 64 L54 54 L50 54 L46 64 L40 64 L38 54 L34 52 L26 60 L20 54 L28 46 L26 42 L16 40 L16 34 L26 32 L28 28 L20 20 L26 14 L34 22 L38 20 L40 10 L46 10 L48 20 Z"
                                stroke="#d4af37"
                                strokeWidth="2"
                                fill="none"
                            />
                            <circle cx="50" cy="37" r="10" stroke="#d4af37" strokeWidth="2" fill="none" />
                        </motion.svg>
                    </div>

                    {/* Page Name */}
                    {pageName && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-text-muted text-sm font-display"
                        >
                            Loading {pageName}...
                        </motion.p>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PageLoader;
