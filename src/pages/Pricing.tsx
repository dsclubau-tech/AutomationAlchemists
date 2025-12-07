import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import FAQ from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Zap, Shield, Rocket, Crown, Gem, Target, Award, Loader2, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Expandable,
    ExpandableCard,
    ExpandableCardContent,
    ExpandableCardHeader,
    ExpandableCardFooter,
    ExpandableContent,
    ExpandableTrigger,
} from "@/components/ui/expandable";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Star,
    Zap,
    Shield,
    Rocket,
    Crown,
    Gem,
    Target,
    Award,
};

interface PricingPackage {
    id: string;
    name: string;
    price: string;
    description: string;
    short_description: string | null;
    features: string[] | null;
    icon: string;
    badge: string | null;
    badge_color: string | null;
    cta_text: string | null;
    is_popular: boolean | null;
    discount_percent: number | null;
    display_order: number | null;
}

// Fallback packages for when database is empty
const defaultPlans: PricingPackage[] = [
    {
        id: "1",
        icon: "Star",
        name: "Starter",
        price: "Custom",
        description: "Perfect for MVPs and proof of concepts. Get your idea off the ground quickly.",
        short_description: "Perfect for MVPs and proof of concepts.",
        features: [
            "Single app development",
            "Basic automation setup",
            "2 weeks delivery",
            "1 month support",
            "Source code included"
        ],
        cta_text: "Get Started",
        is_popular: false,
        badge: "Entry Level",
        badge_color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        discount_percent: 0,
        display_order: 1,
    },
    {
        id: "2",
        icon: "Zap",
        name: "Professional",
        price: "Custom",
        description: "For businesses ready to scale. Comprehensive solutions for growing needs.",
        short_description: "For businesses ready to scale.",
        features: [
            "Full-stack application",
            "Advanced automation",
            "Virtual assistant integration",
            "4 weeks delivery",
            "3 months support",
            "Priority updates",
            "Analytics dashboard"
        ],
        cta_text: "Most Popular",
        is_popular: true,
        badge: "Most Popular",
        badge_color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
        discount_percent: 0,
        display_order: 2,
    },
    {
        id: "3",
        icon: "Shield",
        name: "Enterprise",
        price: "Custom",
        description: "Complete digital transformation. Tailored for large-scale operations.",
        short_description: "Complete digital transformation.",
        features: [
            "Multiple applications",
            "Custom workflow automation",
            "24/7 virtual assistants",
            "Flexible timeline",
            "12 months support",
            "Dedicated team",
            "White-label options",
            "API integrations"
        ],
        cta_text: "Contact Sales",
        is_popular: false,
        badge: "Enterprise",
        badge_color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        discount_percent: 0,
        display_order: 3,
    }
];

const Pricing = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [plans, setPlans] = useState<PricingPackage[]>(defaultPlans);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const { data, error } = await supabase
                    .from('pricing_packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    setPlans(data as PricingPackage[]);
                }
            } catch (error) {
                console.error('Error fetching pricing packages:', error);
                // Keep default plans on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const getIcon = (iconName: string) => {
        return iconMap[iconName] || Star;
    };

    return (
        <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
            <SEOHead
                title="Pricing"
                description="Transparent pricing for automation services. Choose from Starter, Professional, or Enterprise plans tailored to your business needs."
                keywords="pricing, automation pricing, service packages, custom solutions"
            />
            <PageLoader pageName="Pricing" />
            <Navigation />

            {/* Fractal Corner Frames */}
            <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.2) 0%, transparent 50%)' }}></div>
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.15) 0%, transparent 50%)' }}></div>

            <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 md:gap-24 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6">

                {/* Hero Section */}
                <section className="flex flex-col items-center text-center gap-4 sm:gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col gap-2 max-w-4xl"
                    >
                        <h1 className="text-text-main text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter spatial-distortion-glow font-display">
                            Transparent Pricing
                        </h1>
                        <p className="text-text-muted text-sm sm:text-base md:text-xl font-normal leading-relaxed font-display">
                            Custom solutions tailored to your needs. No hidden fees, no surprises.
                        </p>
                    </motion.div>
                </section>

                {/* Directional Node Divider */}
                <div className="w-full flex items-center gap-4">
                    <div className="directional-node"></div>
                    <div className="flex-grow h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                </div>

                {/* Pricing Cards */}
                <section ref={ref} className="w-full flex flex-col gap-4 sm:gap-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start justify-items-center w-full">
                            {plans.map((plan, index) => {
                                const IconComponent = getIcon(plan.icon);
                                const features = plan.features || [];
                                const hasDiscount = plan.discount_percent && plan.discount_percent > 0;

                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                        className="w-full max-w-[340px]"
                                    >
                                        <Expandable
                                            expandDirection="both"
                                            expandBehavior="replace"
                                            onExpandStart={() => console.log(`Expanding ${plan.name}...`)}
                                        >
                                            {({ isExpanded }) => (
                                                <ExpandableTrigger>
                                                    <ExpandableCard
                                                        className={`bg-surface-dark/50 border-primary/20 hover:border-primary/40 w-full max-w-[340px] sm:max-w-none ${plan.is_popular ? 'ring-1 ring-primary/50' : ''}`}
                                                        collapsedSize={{ width: 300, height: 320 }}
                                                        expandedSize={{ width: 340, height: "auto" }}
                                                        hoverToExpand={true}
                                                        expandDelay={200}
                                                        collapseDelay={300}
                                                    >
                                                        <ExpandableCardHeader className="p-4 sm:p-6">
                                                            <div className="flex justify-between items-start w-full gap-2 sm:gap-3">
                                                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                                                                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                                                                    </div>
                                                                    <h3 className="text-text-main text-base sm:text-lg font-semibold leading-tight font-display truncate">
                                                                        {plan.name}
                                                                    </h3>
                                                                </div>
                                                                {plan.badge && (
                                                                    <Badge className={`${plan.badge_color} flex-shrink-0 whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold shadow-lg`}>
                                                                        {plan.badge}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="mt-4 flex items-baseline gap-2">
                                                                {hasDiscount ? (
                                                                    <>
                                                                        <span className="text-lg sm:text-xl text-text-muted line-through font-display">{plan.price}</span>
                                                                        <span className="text-2xl sm:text-3xl font-bold text-primary font-display">
                                                                            {(() => {
                                                                                // Calculate discounted price
                                                                                const priceNum = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
                                                                                if (!isNaN(priceNum)) {
                                                                                    const discounted = priceNum * (1 - (plan.discount_percent || 0) / 100);
                                                                                    return `$${discounted.toFixed(2)}`;
                                                                                }
                                                                                return plan.price;
                                                                            })()}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-2xl sm:text-3xl font-bold text-primary font-display">{plan.price}</span>
                                                                )}
                                                            </div>
                                                        </ExpandableCardHeader>

                                                        <ExpandableCardContent className="px-4 sm:px-6 flex-1">
                                                            <p className="text-text-muted text-xs sm:text-sm font-normal leading-normal font-display mb-3 sm:mb-4">
                                                                {isExpanded ? plan.description : (plan.short_description || plan.description)}
                                                            </p>

                                                            <ExpandableContent preset="blur-md" stagger staggerChildren={0.1}>
                                                                <div className="space-y-2 sm:space-y-3 pt-2">
                                                                    <h4 className="font-medium text-xs sm:text-sm text-text-main font-display flex items-center">
                                                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary flex-shrink-0" />
                                                                        What's Included:
                                                                    </h4>
                                                                    {features.map((feature, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className="flex items-start gap-2 text-xs sm:text-sm text-text-muted font-display pl-4 sm:pl-6"
                                                                        >
                                                                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
                                                                            <span className="break-words whitespace-normal overflow-hidden">{feature}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Consistent spacing: mt-6 from last feature to button */}
                                                                <div className="mt-6">
                                                                    <Link to="/contact" className="block">
                                                                        <Button className="w-full bg-primary text-background-dark hover:brightness-110 transition-all font-display text-xs sm:text-sm h-9 sm:h-10">
                                                                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                                            {plan.cta_text || "Get Started"}
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                            </ExpandableContent>
                                                        </ExpandableCardContent>

                                                        {/* Collapsed state hint - always visible when not expanded */}
                                                        {!isExpanded && (
                                                            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 mt-auto">
                                                                <div className="flex items-center justify-between w-full text-[10px] sm:text-xs text-text-muted font-display border-t border-primary/10 pt-3">
                                                                    <span>Hover to expand</span>
                                                                    <span className="text-primary">↓</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Expanded state hint - only shows when expanded */}
                                                        <ExpandableContent preset="slide-up">
                                                            <ExpandableCardFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 mt-auto">
                                                                <div className="flex items-center justify-between w-full text-[10px] sm:text-xs text-text-muted font-display border-t border-primary/10 pt-3">
                                                                    <span>Hover to collapse</span>
                                                                    <span className="text-primary">↑</span>
                                                                </div>
                                                            </ExpandableCardFooter>
                                                        </ExpandableContent>
                                                    </ExpandableCard>
                                                </ExpandableTrigger>
                                            )}
                                        </Expandable>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Directional Node Divider */}
                <div className="w-full flex items-center gap-4">
                    <div className="flex-grow h-px bg-gradient-to-l from-primary/50 to-transparent"></div>
                    <div className="directional-node"></div>
                </div>

                {/* How It Works */}
                <section className="py-12 sm:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-text-main text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl font-display mb-4 sm:mb-6">
                            How Pricing Works
                        </h2>
                        <p className="text-sm text-text-muted max-w-3xl mx-auto font-display">
                            Every project is unique, so we create custom quotes based on your specific needs
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                        {[
                            {
                                step: "01",
                                title: "Discovery Call",
                                desc: "We discuss your vision, requirements, and timeline to understand the full scope"
                            },
                            {
                                step: "02",
                                title: "Custom Proposal",
                                desc: "Receive a detailed proposal with pricing, milestones, and deliverables"
                            },
                            {
                                step: "03",
                                title: "Flexible Payment",
                                desc: "Choose milestone-based payments or monthly retainers that work for your budget"
                            },
                            {
                                step: "04",
                                title: "Transparent Billing",
                                desc: "Track progress and costs in real-time with no hidden fees or surprises"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-start gap-4 sm:gap-6 p-4 sm:p-6 bg-surface-dark/50 border border-primary/20 rounded-xl shadow-singularity"
                            >
                                <div className="text-3xl sm:text-4xl font-bold text-primary/20 font-display">{item.step}</div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-text-main mb-1 sm:mb-2 font-display">{item.title}</h3>
                                    <p className="text-xs text-text-muted font-display">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-12 sm:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-text-main text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl font-display mb-4 sm:mb-6">
                            Common Questions
                        </h2>
                    </motion.div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {[
                            {
                                q: "Why custom pricing?",
                                a: "Every project has unique requirements. Custom pricing ensures you only pay for what you need and get the best value for your investment."
                            },
                            {
                                q: "What's included in support?",
                                a: "Bug fixes, minor updates, performance monitoring, and technical assistance. Extended support packages are available for ongoing development."
                            },
                            {
                                q: "Do you offer payment plans?",
                                a: "Yes! We offer milestone-based payments, monthly retainers, and flexible arrangements to fit your budget and cash flow."
                            },
                            {
                                q: "What if my needs change?",
                                a: "We're flexible. Projects can be adjusted mid-development with transparent pricing for additional features or scope changes."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-4 sm:p-6 bg-surface-dark/50 border border-primary/20 rounded-xl shadow-singularity"
                            >
                                <h3 className="text-sm sm:text-base font-bold text-text-main mb-1 sm:mb-2 font-display">{faq.q}</h3>
                                <p className="text-xs text-text-muted font-display">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="py-12 sm:py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-text-main text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl font-display mb-4 sm:mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-sm text-text-muted mb-8 max-w-2xl mx-auto font-display">
                            Schedule a free consultation to discuss your project and get a custom quote
                        </p>
                        <Link to="/contact">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-background-dark px-8 sm:px-12 py-4 sm:py-6 text-sm font-display font-bold"
                            >
                                Book Free Consultation
                            </Button>
                        </Link>
                    </motion.div>
                </section>

                <FAQ />

                <Footer />
            </div>
        </div>
    );
};

export default Pricing;
