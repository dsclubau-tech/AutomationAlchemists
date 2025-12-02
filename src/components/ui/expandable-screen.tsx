import * as React from "react"
import { cn } from "@/lib/utils"

const ExpandableScreenContext = React.createContext<{
    isExpanded: boolean
    setIsExpanded: (expanded: boolean) => void
    layoutId: string
    triggerRadius: string
    contentRadius: string
} | null>(null)

function useExpandableScreen() {
    const context = React.useContext(ExpandableScreenContext)
    if (!context) {
        throw new Error("useExpandableScreen must be used within ExpandableScreen")
    }
    return context
}

interface ExpandableScreenProps {
    children: React.ReactNode
    layoutId: string
    triggerRadius?: string
    contentRadius?: string
}

export function ExpandableScreen({
    children,
    layoutId,
    triggerRadius = "12px",
    contentRadius = "24px",
}: ExpandableScreenProps) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <ExpandableScreenContext.Provider
            value={{ isExpanded, setIsExpanded, layoutId, triggerRadius, contentRadius }}
        >
            {children}
        </ExpandableScreenContext.Provider>
    )
}

interface ExpandableScreenTriggerProps {
    children: React.ReactNode
    className?: string
}

export function ExpandableScreenTrigger({
    children,
    className,
}: ExpandableScreenTriggerProps) {
    const { setIsExpanded, triggerRadius } = useExpandableScreen()

    return (
        <button
            onClick={() => setIsExpanded(true)}
            className={cn("cursor-pointer transition-all", className)}
            style={{ borderRadius: triggerRadius }}
        >
            {children}
        </button>
    )
}

interface ExpandableScreenContentProps {
    children: React.ReactNode
    className?: string
}

export function ExpandableScreenContent({
    children,
    className,
}: ExpandableScreenContentProps) {
    const { isExpanded, setIsExpanded, contentRadius } = useExpandableScreen()

    if (!isExpanded) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
        >
            <div
                className={cn(
                    "relative w-full max-w-7xl max-h-[90vh] overflow-y-auto",
                    className
                )}
                style={{ borderRadius: contentRadius }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setIsExpanded(false)}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    )
}
