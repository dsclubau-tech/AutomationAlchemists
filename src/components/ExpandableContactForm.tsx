import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, CheckCircle2, Sparkles, Zap, MessageSquare, Users } from "lucide-react"
import { z } from "zod"

// Validation schema
const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    use_case: z.string().optional(),
    team_size: z.string().optional(),
    message: z.string().min(10, "Message must be at least 10 characters"),
})

export function ExpandableContactForm() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        use_case: "",
        team_size: "",
        message: "",
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Validate form data
            contactSchema.parse(formData)

            // Insert into Supabase contacts table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from("contacts")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    use_case: formData.use_case || null,
                    team_size: formData.team_size || null,
                    status: "new",
                })

            if (error) throw error

            // Show success state
            setIsSuccess(true)
            toast({
                title: "Message Sent! 🎉",
                description: "We'll get back to you within 24 hours.",
            })

            // Reset form after delay
            setTimeout(() => {
                setFormData({
                    name: "",
                    email: "",
                    use_case: "",
                    team_size: "",
                    message: "",
                })
                setIsSuccess(false)
            }, 3000)

        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    title: "Validation Error",
                    description: error.errors[0]?.message,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Something went wrong",
                    description: "Please try again or email us directly.",
                    variant: "destructive",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ExpandableScreen
            layoutId="contact-card"
            triggerRadius="100px"
            contentRadius="24px"
        >
            {/* Trigger Section - Enhanced Design */}
            <div className="relative flex min-h-[600px] flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
                {/* Decorative elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full"
                    >
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-primary text-sm font-medium">Free Consultation</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white max-w-3xl"
                    >
                        Let's Build Something{" "}
                        <span className="text-primary">Amazing</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base sm:text-lg md:text-xl leading-relaxed text-white/70 max-w-2xl px-4"
                    >
                        Transform your business with intelligent automation.
                        Tell us about your project and we'll respond within 24 hours.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <ExpandableScreenTrigger>
                            <div className="group relative bg-primary rounded-full px-10 sm:px-12 py-5 text-lg sm:text-xl font-bold text-black tracking-tight hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/40 cursor-pointer">
                                <span className="relative z-10 flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5" />
                                    Start Your Journey
                                </span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </ExpandableScreenTrigger>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex items-center gap-6 text-white/50 text-sm"
                    >
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            No spam, ever
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Response in 24h
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Expanded Form Section - Enhanced Design */}
            <ExpandableScreenContent className="bg-gradient-to-br from-primary via-primary to-[#C9A227]">
                <div className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1200px] mx-auto items-stretch p-6 sm:p-10 lg:p-16 gap-8 lg:gap-12">

                    {/* Left side - Benefits */}
                    <div className="flex-1 flex flex-col justify-center space-y-6 w-full">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full text-black/70 text-xs font-medium mb-4">
                                <Zap className="w-3 h-3" />
                                Quick & Easy
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight tracking-tight">
                                Get Your Free
                                <br />
                                <span className="text-black/80">Strategy Session</span>
                            </h2>
                        </div>

                        <div className="space-y-5 pt-2">
                            {[
                                {
                                    icon: <CheckCircle2 className="w-5 h-5" />,
                                    title: "Personalized Consultation",
                                    desc: "We'll analyze your specific needs and goals"
                                },
                                {
                                    icon: <Zap className="w-5 h-5" />,
                                    title: "Custom Solution Design",
                                    desc: "Tailored automation for your workflow"
                                },
                                {
                                    icon: <Users className="w-5 h-5" />,
                                    title: "Expert Team Support",
                                    desc: "Dedicated specialists for your project"
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 items-start"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center text-black">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-black text-base">{item.title}</p>
                                        <p className="text-black/70 text-sm">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Testimonial */}
                        <div className="pt-6 mt-4 border-t border-black/10">
                            <div className="bg-black/5 rounded-2xl p-5">
                                <p className="text-black/90 text-lg leading-relaxed mb-4 italic">
                                    "AAlchemists transformed our operations. We saved 40+ hours per week through their automation solutions."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-black/20 flex items-center justify-center text-black font-bold text-sm">
                                        SC
                                    </div>
                                    <div>
                                        <p className="text-black font-semibold text-sm">Sarah Chen</p>
                                        <p className="text-black/60 text-xs">CEO, TechFlow Solutions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Form */}
                    <div className="flex-1 w-full">
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl">
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex flex-col items-center justify-center py-12 text-center"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                        <p className="text-gray-600">We'll be in touch within 24 hours.</p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        onSubmit={handleSubmit}
                                        className="space-y-5"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                                    Full Name *
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                                    required
                                                    placeholder="John Doe"
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-12"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                                    Email *
                                                </Label>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    required
                                                    placeholder="john@company.com"
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-12"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                                    Use Case
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={formData.use_case}
                                                    onChange={(e) => handleInputChange("use_case", e.target.value)}
                                                    placeholder="Workflow automation"
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-12"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                                    Team Size
                                                </Label>
                                                <Select
                                                    value={formData.team_size}
                                                    onValueChange={(value) => handleInputChange("team_size", value)}
                                                >
                                                    <SelectTrigger className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-12">
                                                        <SelectValue placeholder="Select size" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-xl z-[100]">
                                                        <SelectItem value="solo" className="text-gray-900 focus:bg-gray-100">Solo</SelectItem>
                                                        <SelectItem value="2-5" className="text-gray-900 focus:bg-gray-100">2-5 people</SelectItem>
                                                        <SelectItem value="6-20" className="text-gray-900 focus:bg-gray-100">6-20 people</SelectItem>
                                                        <SelectItem value="21-50" className="text-gray-900 focus:bg-gray-100">21-50 people</SelectItem>
                                                        <SelectItem value="50+" className="text-gray-900 focus:bg-gray-100">50+ people</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                                Tell us about your project *
                                            </Label>
                                            <Textarea
                                                value={formData.message}
                                                onChange={(e) => handleInputChange("message", e.target.value)}
                                                required
                                                rows={4}
                                                placeholder="Describe your automation needs, current challenges, and goals..."
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-14 rounded-xl bg-gradient-to-r from-gray-900 to-black text-white font-semibold text-base hover:from-gray-800 hover:to-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Sending...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    Send Message
                                                </span>
                                            )}
                                        </Button>

                                        <p className="text-center text-xs text-gray-500 pt-2">
                                            By submitting, you agree to our{" "}
                                            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                                        </p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </ExpandableScreenContent>
        </ExpandableScreen>
    )
}
