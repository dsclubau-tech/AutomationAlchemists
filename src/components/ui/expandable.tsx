import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

const ExpandableContext = React.createContext<{
    isExpanded: boolean
    setIsExpanded: (expanded: boolean) => void
    expandDirection: "vertical" | "horizontal" | "both"
    expandBehavior: "replace" | "overlay"
    onExpandStart?: () => void
    onExpandEnd?: () => void
    initialDelay?: number
} | null>(null)

function useExpandable() {
    const context = React.useContext(ExpandableContext)
    if (!context) {
        throw new Error("useExpandable must be used within Expandable")
    }
    return context
}

interface ExpandableProps {
    children: React.ReactNode | ((props: { isExpanded: boolean }) => React.ReactNode)
    expandDirection?: "vertical" | "horizontal" | "both"
    expandBehavior?: "replace" | "overlay"
    onExpandStart?: () => void
    onExpandEnd?: () => void
    initialDelay?: number
}

export function Expandable({
    children,
    expandDirection = "vertical",
    expandBehavior = "replace",
    onExpandStart,
    onExpandEnd,
    initialDelay = 0,
}: ExpandableProps) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    const handleExpand = (expanded: boolean) => {
        if (expanded && onExpandStart) onExpandStart()
        setIsExpanded(expanded)
        if (expanded && onExpandEnd) {
            setTimeout(() => onExpandEnd(), initialDelay * 1000)
        }
    }

    return (
        <ExpandableContext.Provider
            value={{
                isExpanded,
                setIsExpanded: handleExpand,
                expandDirection,
                expandBehavior,
                onExpandStart,
                onExpandEnd,
                initialDelay,
            }}
        >
            {typeof children === "function" ? children({ isExpanded }) : children}
        </ExpandableContext.Provider>
    )
}

interface ExpandableTriggerProps {
    children: React.ReactNode
    className?: string
}

export function ExpandableTrigger({ children, className }: ExpandableTriggerProps) {
    return <div className={className}>{children}</div>
}

interface ExpandableCardProps {
    children: React.ReactNode
    className?: string
    collapsedSize?: { width: number; height: number }
    expandedSize?: { width: number; height: number }
    hoverToExpand?: boolean
    expandDelay?: number
    collapseDelay?: number
}

export function ExpandableCard({
    children,
    className = "",
    collapsedSize = { width: 300, height: 200 },
    expandedSize = { width: 400, height: 400 },
    hoverToExpand = false,
    expandDelay = 0,
    collapseDelay = 0,
}: ExpandableCardProps) {
    const { isExpanded, setIsExpanded } = useExpandable()

    const handleClick = () => {
        if (!hoverToExpand) {
            setTimeout(() => setIsExpanded(!isExpanded), expandDelay)
        }
    }

    const handleMouseEnter = () => {
        if (hoverToExpand) {
            setTimeout(() => setIsExpanded(true), expandDelay)
        }
    }

    const handleMouseLeave = () => {
        if (hoverToExpand) {
            setTimeout(() => setIsExpanded(false), collapseDelay)
        }
    }

    return (
        <motion.div
            className={`cursor-pointer overflow-hidden rounded-xl border bg-card text-card-foreground shadow ${className}`}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={false}
            animate={{
                width: isExpanded ? expandedSize.width : collapsedSize.width,
                height: isExpanded ? expandedSize.height : collapsedSize.height,
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
        >
            {children}
        </motion.div>
    )
}

export function ExpandableCardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-6 ${className}`}>{children}</div>
}

export function ExpandableCardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}

export function ExpandableCardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`px-6 pb-6 pt-0 ${className}`}>{children}</div>
}

interface ExpandableContentProps {
    children: React.ReactNode
    preset?: "fade" | "slide-up" | "blur-sm" | "blur-md"
    keepMounted?: boolean
    stagger?: boolean
    staggerChildren?: number
    animateIn?: {
        initial: any
        animate: any
        transition?: any
    }
}

export function ExpandableContent({
    children,
    preset = "fade",
    keepMounted = false,
    stagger = false,
    staggerChildren = 0.1,
    animateIn,
}: ExpandableContentProps) {
    const { isExpanded } = useExpandable()

    const presets = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        },
        "slide-up": {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 20 },
        },
        "blur-sm": {
            initial: { opacity: 0, filter: "blur(4px)" },
            animate: { opacity: 1, filter: "blur(0px)" },
            exit: { opacity: 0, filter: "blur(4px)" },
        },
        "blur-md": {
            initial: { opacity: 0, filter: "blur(8px)" },
            animate: { opacity: 1, filter: "blur(0px)" },
            exit: { opacity: 0, filter: "blur(8px)" },
        },
    }

    const animation = animateIn || presets[preset]

    if (!isExpanded && !keepMounted) {
        return null
    }

    return (
        <AnimatePresence mode="wait">
            {(isExpanded || keepMounted) && (
                <motion.div
                    {...animation}
                    transition={animation.transition || { duration: 0.3 }}
                    style={{ opacity: keepMounted && !isExpanded ? 0 : undefined }}
                >
                    {stagger ? (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren,
                                    },
                                },
                            }}
                        >
                            {children}
                        </motion.div>
                    ) : (
                        children
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
