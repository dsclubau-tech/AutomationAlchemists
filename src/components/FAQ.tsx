import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: "How does your pricing work?",
        answer: "Our pricing is customized based on your specific needs. We offer three main tiers: Starter for MVPs and proofs of concept, Professional for growing businesses, and Enterprise for large-scale operations. Each package can be tailored to include exactly what you need."
    },
    {
        question: "What's included in the free consultation?",
        answer: "During the free consultation, we'll discuss your business goals, current challenges, and how automation can help. We'll provide a preliminary assessment of what solutions would work best for you and give you a rough timeline and estimate."
    },
    {
        question: "How long does it take to build a custom solution?",
        answer: "Timelines vary based on complexity. Simple automations can be delivered in 1-2 weeks, while full applications typically take 4-8 weeks. We'll provide a detailed timeline during our initial consultation."
    },
    {
        question: "Do you offer ongoing support?",
        answer: "Yes! All our packages include a support period after delivery. Our Professional and Enterprise plans include extended support, priority response times, and dedicated account management."
    },
    {
        question: "Can I upgrade my plan later?",
        answer: "Absolutely. You can upgrade your plan at any time. We'll work with you to smoothly transition your existing solutions and add new capabilities as your business grows."
    },
    {
        question: "What technologies do you work with?",
        answer: "We're technology-agnostic and choose the best tools for each project. Common technologies include React, Node.js, Python, various automation platforms (Make, Zapier, n8n), and AI/ML tools. We'll recommend what works best for your use case."
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-20 bg-background-dark">
            <div className="container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <HelpCircle className="w-8 h-8 text-primary" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white font-display">
                            Frequently Asked Questions
                        </h2>
                    </div>
                    <p className="text-text-muted font-display">
                        Got questions? We've got answers.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="border border-primary/20 rounded-xl overflow-hidden bg-surface-dark/50"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-primary/5 transition-colors"
                            >
                                <span className="text-white font-semibold font-display pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-primary transition-transform duration-300 flex-shrink-0 ${openIndex === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 text-text-muted font-display">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
