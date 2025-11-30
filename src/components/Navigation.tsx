import { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = ({ hideAuthButton = false }: { hideAuthButton?: boolean }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        if (location.pathname !== "/") {
            window.location.href = `/#${sectionId}`;
            return;
        }
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            setIsMobileMenuOpen(false);
        }
    };

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to sign out. Please try again.',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Signed out',
                description: 'You have been signed out successfully.',
            });
            navigate('/');
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-sm shadow-card" : "bg-background/80 backdrop-blur-sm"
                }`}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-all"></div>
                            <img src={logo} alt="AAlchemists Logo" className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain -my-2 transition-all duration-500 group-hover:rotate-[360deg] group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] brightness-110" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-primary font-display group-hover:text-primary-light transition-colors">AAlchemists</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-4 xl:gap-8">
                        <button onClick={() => scrollToSection("home")} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Home
                        </button>
                        <button onClick={() => scrollToSection("about")} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            About
                        </button>
                        <Link to="/services" className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Services
                        </Link>
                        <Link to="/learn" className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Learn
                        </Link>
                        <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Contact
                        </Link>

                    </div>

                    {/* Auth Section - Desktop */}
                    {!hideAuthButton && (
                        <div className="hidden lg:flex items-center gap-4">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-primary/10 transition-colors">
                                            <User className="h-8 w-8 text-primary" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-surface-dark border-primary/20 text-text-main rounded-2xl shadow-singularity" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none font-display text-white">{user.user_metadata.full_name || 'User'}</p>
                                                <p className="text-xs leading-none text-muted-foreground font-display">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-primary/20" />
                                        <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer font-display rounded-xl">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Sign out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button onClick={() => navigate('/auth')} variant="default" size="sm" className="gold-foil-outline font-display">
                                    Sign In
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-2">

                        <button
                            className="text-foreground"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="lg:hidden overflow-hidden"
                        >
                            <div className="mt-4 pb-4 flex flex-col gap-4">
                                <button onClick={() => scrollToSection("home")} className="text-left text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Home
                                </button>
                                <button onClick={() => scrollToSection("about")} className="text-left text-foreground hover:text-primary transition-colors py-2 font-display">
                                    About
                                </button>
                                <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Services
                                </Link>
                                <Link to="/learn" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Learn
                                </Link>
                                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Contact
                                </Link>

                                {/* Auth Section - Mobile */}
                                {!hideAuthButton && (
                                    <div className="pt-4 border-t border-border space-y-4">
                                        {user ? (
                                            <>
                                                <div className="text-sm text-muted-foreground px-4 font-display">
                                                    <User className="w-4 h-4 inline mr-2" />
                                                    {user.email}
                                                </div>
                                                <Button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full font-display">
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Sign Out
                                                </Button>
                                            </>
                                        ) : (
                                            <Button onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }} className="w-full font-display">
                                                Sign In
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navigation;
