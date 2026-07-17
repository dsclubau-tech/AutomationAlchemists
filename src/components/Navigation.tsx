import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, User, ArrowRight, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { toast } = useToast();

    // Easter egg: track rapid clicks on current page links
    const clickCountRef = useRef<{ [key: string]: { count: number; lastClick: number } }>({});

    // Check if user is admin
    useEffect(() => {
        const checkAdminRole = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            }
            const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .maybeSingle();
            setIsAdmin(!!data);
        };
        checkAdminRole();
    }, [user]);

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

    // Easter egg: detect rapid clicks on same page
    const handleNavClick = (e: React.MouseEvent, path: string) => {
        const isOnPage = location.pathname === path;

        if (isOnPage) {
            const now = Date.now();
            const pageData = clickCountRef.current[path] || { count: 0, lastClick: 0 };

            // Reset if more than 1.5 seconds since last click
            if (now - pageData.lastClick > 1500) {
                pageData.count = 0;
            }

            pageData.count++;
            pageData.lastClick = now;
            clickCountRef.current[path] = pageData;

            // Show easter egg on 4th rapid click
            if (pageData.count >= 4) {
                e.preventDefault();
                const pageName = path.replace('/', '') || 'home';
                toast({
                    title: "🤦 Really?",
                    description: `You're already on the ${pageName} page, idiot!`,
                });
                pageData.count = 0; // Reset so they can trigger it again
            }
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
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-sm shadow-card" : "bg-background/80 backdrop-blur-sm"
                }`}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-all"></div>
                            <img src={logo} alt="AAlchemists Logo" className="relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 object-contain -my-2 transition-all duration-500 group-hover:rotate-[360deg] group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] brightness-110" />
                        </div>
                        <span className="text-xl sm:text-2xl md:text-2xl font-bold text-primary font-display group-hover:text-primary-light transition-colors">AAlchemists</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-4 xl:gap-8">
                        <button onClick={() => scrollToSection("home")} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Home
                        </button>
                        <Link to="/company" onClick={(e) => handleNavClick(e, '/company')} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Company
                        </Link>
                        <Link to="/services" onClick={(e) => handleNavClick(e, '/services')} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Services
                        </Link>
                        <Link to="/tools" onClick={(e) => handleNavClick(e, '/tools')} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Tools
                        </Link>
                        <Link to="/pricing" onClick={(e) => handleNavClick(e, '/pricing')} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Pricing
                        </Link>
                        <Link to="/learn" onClick={(e) => handleNavClick(e, '/learn')} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Learn
                        </Link>
                        <Link to="/contact" onClick={(e) => handleNavClick(e, '/contact')} className="text-foreground hover:text-primary transition-colors font-display text-sm font-medium">
                            Contact
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" onClick={(e) => handleNavClick(e, '/admin')} className="text-primary hover:text-primary-light transition-colors font-display text-sm font-medium flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                Admin
                            </Link>
                        )}

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
                                    <DropdownMenuContent className="w-64 bg-surface-dark border-primary/20 text-text-main rounded-xl shadow-singularity p-0 z-[200]" align="end" sideOffset={8} forceMount>
                                        {/* Header with greeting */}
                                        <div className="px-4 py-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
                                            <p className="text-sm font-semibold text-primary font-display">
                                                Hello, {user.user_metadata.full_name?.split(' ')[0] || 'User'}
                                            </p>
                                            <p className="text-xs text-text-muted font-display truncate">
                                                {user.email}
                                            </p>
                                        </div>

                                        {/* Admin Section - Only for admins */}
                                        {isAdmin && (
                                            <div className="p-2">
                                                <p className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Admin
                                                </p>
                                                <Link to="/admin" onClick={() => { }} className="block">
                                                    <DropdownMenuItem className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-primary/10 focus:bg-primary/10">
                                                        <Shield className="mr-2 h-4 w-4 text-primary" />
                                                        <span>Admin Dashboard</span>
                                                    </DropdownMenuItem>
                                                </Link>
                                            </div>
                                        )}

                                        {isAdmin && <DropdownMenuSeparator className="bg-primary/20" />}

                                        {/* Sign Out */}
                                        <div className="p-2">
                                            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer font-display rounded-lg px-3 py-2">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Sign out</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={() => navigate('/auth')}
                                    className="relative rounded-full px-8 py-6 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-black font-bold font-display shadow-lg hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 overflow-hidden group hover:scale-105"
                                >
                                    {/* Animated background shimmer */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                    <span className="relative z-10">Book a Free Roadmap Call</span>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-2">
                        {/* Mobile User Icon - only when signed in */}
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                                        <User className="h-6 w-6" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 bg-surface-dark border-primary/20 text-text-main rounded-xl shadow-singularity p-0 z-[200]" align="end" sideOffset={8} forceMount>
                                    {/* Header with greeting */}
                                    <div className="px-4 py-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
                                        <p className="text-sm font-semibold text-primary font-display">
                                            Hello, {user.user_metadata.full_name?.split(' ')[0] || 'User'}
                                        </p>
                                        <p className="text-xs text-text-muted font-display truncate">
                                            {user.email}
                                        </p>
                                    </div>

                                    {/* Admin Section - Only for admins */}
                                    {isAdmin && (
                                        <div className="p-2">
                                            <p className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                Admin
                                            </p>
                                            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block">
                                                <DropdownMenuItem className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-primary/10 focus:bg-primary/10">
                                                    <Shield className="mr-2 h-4 w-4 text-primary" />
                                                    <span>Admin Dashboard</span>
                                                </DropdownMenuItem>
                                            </Link>
                                        </div>
                                    )}

                                    {isAdmin && <DropdownMenuSeparator className="bg-primary/20" />}

                                    {/* Sign Out */}
                                    <div className="p-2">
                                        <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer font-display rounded-lg px-3 py-2">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Sign out</span>
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <button
                            className="text-foreground p-2"
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
                                <Link to="/company" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Company
                                </Link>
                                <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Services
                                </Link>
                                <Link to="/tools" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Tools
                                </Link>
                                <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Pricing
                                </Link>
                                <Link to="/learn" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Learn
                                </Link>
                                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-display">
                                    Contact
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:text-primary-light transition-colors py-2 font-display flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Admin Dashboard
                                    </Link>
                                )}

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
                                            <Button
                                                onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                                                className="w-full rounded-full py-6 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-black font-bold font-display shadow-lg hover:shadow-xl transition-all duration-300"
                                            >
                                                Book a Free Roadmap Call
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
