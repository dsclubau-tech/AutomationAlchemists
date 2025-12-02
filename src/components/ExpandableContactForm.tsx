import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    ExpandableScreen,
    ExpandableScreenContent,
    ExpandableScreenTrigger,
} from "@/components/ui/expandable-screen"

export function ExpandableContactForm() {
    const nameId = useId()
    const emailId = useId()
    const useCaseId = useId()
    const teamSizeId = useId()
    const messageId = useId()

    return (
        <ExpandableScreen
            layoutId="contact-card"
            triggerRadius="100px"
            contentRadius="24px"
        >
            <div className="relative flex min-h-[600px] flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 text-center">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[90%] tracking-[-0.03em] text-white max-w-2xl">
                        Let's Transform Your Business
                    </h2>

                    <p className="text-base sm:text-lg md:text-xl leading-[160%] text-gray-300 max-w-2xl px-4">
                        Ready to revolutionize your workflow with quantum-inspired automation?
                        Get in touch with our team and discover how we can help you achieve unprecedented efficiency.
                    </p>

                    <ExpandableScreenTrigger>
                        <div className="bg-primary rounded-full h-15 px-8 sm:px-10 py-4 text-lg sm:text-xl font-semibold text-black tracking-[-0.01em] hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:shadow-primary/50">
                            Start Your Journey
                        </div>
                    </ExpandableScreenTrigger>
                </div>
            </div>

            <ExpandableScreenContent className="bg-primary">
                <div className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1100px] mx-auto items-center p-6 sm:p-10 lg:p-16 gap-8 lg:gap-16">
                    <div className="flex-1 flex flex-col justify-center space-y-3 w-full">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-black leading-none tracking-[-0.03em]">
                            Get Started Today
                        </h2>

                        <div className="space-y-4 sm:space-y-6 pt-4">
                            <div className="flex gap-3 sm:gap-4">
                                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black/10 flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 sm:w-6 sm:h-6 text-black"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base text-black leading-[150%]">
                                        Get a personalized consultation to understand your automation needs and goals.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 sm:gap-4">
                                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black/10 flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 sm:w-6 sm:h-6 text-black"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base text-black leading-[150%]">
                                        Receive a custom solution tailored to your business processes and workflow.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-black/20">
                            <p className="text-lg sm:text-xl lg:text-2xl text-black leading-[150%] mb-4">
                                "Working with AAlchemists transformed our entire operation. Their automation solutions saved us countless hours."
                            </p>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/10 flex items-center justify-center text-black font-bold text-lg">
                                    JD
                                </div>
                                <div>
                                    <p className="text-base sm:text-lg lg:text-xl text-black font-semibold">
                                        John Doe
                                    </p>
                                    <p className="text-sm sm:text-base text-black/70">
                                        CEO, Tech Innovations
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <form className="space-y-4 sm:space-y-5">
                            <div>
                                <Label
                                    htmlFor={nameId}
                                    className="block text-[10px] font-mono font-normal text-black mb-2 tracking-[0.5px] uppercase"
                                >
                                    FULL NAME *
                                </Label>
                                <Input
                                    type="text"
                                    id={nameId}
                                    name="name"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg bg-white border-0 text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all text-sm h-10"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor={emailId}
                                    className="block text-[10px] font-mono font-normal text-black mb-2 tracking-[0.5px] uppercase"
                                >
                                    EMAIL *
                                </Label>
                                <Input
                                    type="email"
                                    id={emailId}
                                    name="email"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg bg-white border-0 text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all text-sm h-10"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Label
                                        htmlFor={useCaseId}
                                        className="block text-[10px] font-mono font-normal text-black mb-2 tracking-[0.5px] uppercase"
                                    >
                                        USE CASE
                                    </Label>
                                    <Input
                                        type="text"
                                        id={useCaseId}
                                        name="use-case"
                                        placeholder="e.g., Workflow automation, Data processing"
                                        className="w-full px-4 py-2.5 rounded-lg bg-white border-0 text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all text-sm h-10"
                                    />
                                </div>
                                <div className="sm:w-32 w-full">
                                    <Label
                                        htmlFor={teamSizeId}
                                        className="block text-[10px] font-mono font-normal text-black mb-2 tracking-[0.5px] uppercase"
                                    >
                                        TEAM SIZE
                                    </Label>
                                    <Select name="team-size">
                                        <SelectTrigger
                                            id={teamSizeId}
                                            className="w-full px-4 py-2.5 rounded-lg bg-white border-0 text-black focus:outline-none focus:ring-2 focus:ring-black/20 transition-all text-sm h-10"
                                        >
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="solo">Solo</SelectItem>
                                            <SelectItem value="2-5">2-5</SelectItem>
                                            <SelectItem value="6-20">6-20</SelectItem>
                                            <SelectItem value="21-50">21-50</SelectItem>
                                            <SelectItem value="50+">50+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label
                                    htmlFor={messageId}
                                    className="block text-[10px] font-mono font-normal text-black mb-2 tracking-[0.5px] uppercase"
                                >
                                    TELL US ABOUT YOUR PROJECT
                                </Label>
                                <Textarea
                                    id={messageId}
                                    name="message"
                                    rows={3}
                                    placeholder="Describe your automation needs and goals..."
                                    className="w-full px-4 py-3 rounded-lg bg-white border-0 text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all resize-none text-sm"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full px-8 py-2.5 rounded-full bg-black text-primary font-medium hover:bg-black/90 transition-colors tracking-[-0.03em] h-10"
                            >
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </ExpandableScreenContent>
        </ExpandableScreen>
    )
}
