import React, { useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Minimize2, Maximize2 } from "lucide-react"

interface HoverVideoPlayerProps {
    videoSrc: string
    thumbnailSrc?: string
    style?: React.CSSProperties
    className?: string
    onMiniPlayer?: () => void
}

export function HoverVideoPlayer({
    videoSrc,
    thumbnailSrc,
    style,
    className = "",
    onMiniPlayer,
}: HoverVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true)
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay failed silently
            })
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        if (videoRef.current) {
            videoRef.current.pause()
        }
    }, [])

    const handleMiniPlayer = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (onMiniPlayer && videoRef.current) {
            // Pass current time to mini player
            onMiniPlayer()
        }
    }, [onMiniPlayer])

    const getCurrentTime = () => {
        return videoRef.current?.currentTime || 0
    }

    // Expose getCurrentTime via ref
    React.useImperativeHandle(
        React.useRef(null),
        () => ({ getCurrentTime }),
        []
    )

    return (
        <div
            className={`relative overflow-hidden w-full h-full cursor-pointer ${className}`}
            style={style}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster={thumbnailSrc}
                loop
                playsInline
                controls={isHovered}
                controlsList="nodownload noplaybackrate nofullscreen"
            >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Mini player button - pops out video to corner */}
            <AnimatePresence>
                {isHovered && onMiniPlayer && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={handleMiniPlayer}
                        className="absolute top-3 right-3 w-10 h-10 rounded-lg bg-black/70 hover:bg-primary hover:text-black flex items-center justify-center text-white transition-all z-10"
                        title="Mini player"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}

// Mini Player Component
interface MiniPlayerProps {
    videoSrc: string
    isOpen: boolean
    onClose: () => void
    onExpand: () => void
    startTime?: number
}

export function MiniPlayer({ videoSrc, isOpen, onClose, onExpand, startTime = 0 }: MiniPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    React.useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = startTime
            videoRef.current.play()
        }
    }, [isOpen, startTime])

    const handleFullscreen = useCallback(() => {
        // Instead of native fullscreen, trigger 75% expand
        onExpand()
    }, [onExpand])

    if (!isOpen) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            className="fixed bottom-6 right-6 z-[150] w-[400px] aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-700"
        >
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls
                controlsList="nodownload noplaybackrate nofullscreen"
                autoPlay
            >
                <source src={videoSrc} type="video/mp4" />
            </video>
            {/* Custom expand button overlay */}
            <button
                onClick={handleFullscreen}
                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 hover:bg-primary hover:text-black flex items-center justify-center text-white transition-all"
                title="Expand to 75%"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
            {/* Close/minimize mini player */}
            <button
                onClick={onClose}
                className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-black/70 hover:bg-red-500 flex items-center justify-center text-white transition-all"
                title="Close"
            >
                <Minimize2 className="w-4 h-4" />
            </button>
        </motion.div>
    )
}

// Expanded Player Component (75%)
interface ExpandedPlayerProps {
    videoSrc: string
    isOpen: boolean
    onClose: () => void
    startTime?: number
}

export function ExpandedPlayer({ videoSrc, isOpen, onClose, startTime = 0 }: ExpandedPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    React.useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = startTime
            videoRef.current.play()
        }
    }, [isOpen, startTime])

    if (!isOpen) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-[75vw] aspect-video rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            </motion.div>
        </motion.div>
    )
}
