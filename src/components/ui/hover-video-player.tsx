import React, { useRef, useState } from "react"
import { motion } from "framer-motion"

interface HoverVideoPlayerProps {
    videoSrc: string
    thumbnailSrc?: string
    enableControls?: boolean
    style?: React.CSSProperties
    className?: string
}

export function HoverVideoPlayer({
    videoSrc,
    thumbnailSrc,
    enableControls = false,
    style,
    className = "",
}: HoverVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play()
            setIsPlaying(true)
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
            setIsPlaying(false)
        }
    }

    return (
        <div
            className={`relative overflow-hidden w-full h-full ${className}`}
            style={style}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls={enableControls && isPlaying}
                poster={thumbnailSrc}
                loop
                muted
                playsInline
            >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {!isPlaying && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none"
                >
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                        <svg
                            className="w-8 h-8 text-black ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
