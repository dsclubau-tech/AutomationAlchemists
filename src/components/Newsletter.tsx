import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Newsletter = () => {
    const [email, setEmail] = useState("");
    const [isSubscribing, setIsSubscribing] = useState(false);
    const { toast } = useToast();

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubscribing(true);
        try {
            const { error } = await supabase
                .from('newsletter_subscribers')
                .insert([{ email: email.trim() }]);

            if (error) {
                if (error.code === '23505') {
                    toast({
                        title: 'Already Subscribed',
                        description: 'This email is already on our list!',
                    });
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: 'Subscribed!',
                    description: 'Welcome to the newsletter. Check your inbox soon!',
                });
                setEmail('');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to subscribe. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubscribing(false);
        }
    };

    return (
        <section className="py-16 md:py-20">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-br from-surface-dark/80 to-background-dark border border-primary/20 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto text-center"
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    {/* Heading */}
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 font-display">
                        Stay Ahead of the Curve
                    </h3>
                    <p className="text-text-muted text-sm md:text-base font-display mb-8 max-w-lg mx-auto">
                        Get exclusive automation tips, workflow templates, and industry insights delivered to your inbox.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="flex-1 bg-background-dark border-primary/30 text-text-main placeholder:text-text-muted focus:border-primary h-12"
                        />
                        <Button
                            type="submit"
                            disabled={isSubscribing}
                            className="bg-primary text-black hover:bg-primary/90 font-semibold h-12 px-6 min-w-[130px]"
                        >
                            {isSubscribing ? (
                                "Subscribing..."
                            ) : (
                                <>
                                    Subscribe
                                    <Send className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Trust text */}
                    <p className="text-xs text-text-muted mt-4 font-display">
                        Join 1,000+ professionals. No spam, unsubscribe anytime.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default Newsletter;
