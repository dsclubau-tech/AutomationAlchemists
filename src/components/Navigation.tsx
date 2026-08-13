import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, User, ArrowRight, Shield, Mail, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { toolsData } from "@/data/tools";
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
    const [profileName, setProfileName] = useState<string | null>(null);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
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

    // Fetch user profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setProfileName(null);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();
            if (data?.full_name) {
                setProfileName(data.full_name);
            } else {
                setProfileName(null);
            }
        };
        fetchProfile();
    }, [user]);

    // Fetch unread notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) {
                setHasUnreadNotifications(false);
                return;
            }
            const { count } = await supabase
                .from('tool_notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('notified', true)
                .is('seen_at', null);
            
            setHasUnreadNotifications((count || 0) > 0);
        };
        fetchNotifications();
    }, [user, location.pathname]); // Re-check when path changes (like visiting the page)

    const userInitial = profileName
        ? profileName.charAt(0).toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || 'U';
    const displayFullName = profileName || user?.user_metadata?.full_name || 'User';

    const AvatarCircle = () => (
        <div className="relative">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#6B6DFF] text-white font-bold text-sm">
                {userInitial}
            </div>
            {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#6B6DFF] rounded-full border-2 border-[#1C2128]" />
            )}
        </div>
    );

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
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "bg-[#0F1219]/95 backdrop-blur-md shadow-sm border-b border-[#303645]" : "bg-[#0F1219]/80 backdrop-blur-md border-b border-transparent shadow-sm"
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-4 max-w-7xl">
                <div className="flex items-center justify-between h-12 sm:h-14">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <img src={logo} alt="Automation Alchemists Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-500 group-hover:rotate-[360deg] mix-blend-multiply" />
                        <span className="hidden sm:block text-lg sm:text-xl md:text-2xl font-bold text-white font-display">Automation Alchemists</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6 xl:gap-8">
                        <button onClick={() => scrollToSection("home")} className="text-[#A1A1AA] hover:text-white transition-all duration-300 font-display text-sm font-semibold">
                            Home
                        </button>
                        <Link to="/company" onClick={(e) => handleNavClick(e, '/company')} className={`transition-all duration-300 font-display text-sm font-semibold ${location.pathname === '/company' ? 'text-white border-b-2 border-[#6B6DFF] pb-1' : 'text-[#A1A1AA] hover:text-white'}`}>
                            Company
                        </Link>
                        <Link to="/services" onClick={(e) => handleNavClick(e, '/services')} className={`transition-all duration-300 font-display text-sm font-semibold ${location.pathname === '/services' ? 'text-white border-b-2 border-[#6B6DFF] pb-1' : 'text-[#A1A1AA] hover:text-white'}`}>
                            Services
                        </Link>
                        
                        <div className="relative group">
                            <Link to="/tools" onClick={(e) => handleNavClick(e, '/tools')} className={`transition-all duration-300 font-display text-sm font-semibold flex items-center gap-1 py-4 ${location.pathname.startsWith('/tools') ? 'text-white border-b-2 border-[#6B6DFF]' : 'text-[#A1A1AA] hover:text-white'}`}>
                                Tools
                            </Link>
                            <div className="absolute top-full left-0 w-[320px] bg-[#1C2128] border border-[#303645] text-white rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[200] overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#303645]">
                                    <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-display">
                                        Our Tools
                                    </p>
                                </div>
                                <div className="p-2">
                                    {toolsData.map(tool => {
                                        const Icon = tool.icon;
                                        return (
                                            <Link key={tool.id} to={`/tools/${tool.slug}`} className="cursor-pointer font-display rounded-lg px-3 py-3 hover:bg-[#303645]/50 focus:bg-[#303645]/50 flex items-start gap-3 w-full transition-colors">
                                                <div className="mt-0.5 bg-[#303645] p-1.5 rounded-md text-[#6B6DFF] shrink-0">
                                                    {Icon ? <Icon className="w-4 h-4" /> : <img src="/images/rccp-logo.png" alt={tool.name} className="w-4 h-4 object-contain" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">{tool.name}</p>
                                                    <p className="text-xs text-[#A1A1AA] line-clamp-1">{tool.shortDescription}</p>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <Link to="/contact" onClick={(e) => handleNavClick(e, '/contact')} className={`transition-all duration-300 font-display text-sm font-semibold ${location.pathname === '/contact' ? 'text-white border-b-2 border-[#6B6DFF] pb-1' : 'text-[#A1A1AA] hover:text-white'}`}>
                            Contact
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" onClick={(e) => handleNavClick(e, '/admin')} className="text-[#A1A1AA] hover:text-[#6B6DFF] transition-colors font-display text-sm font-bold flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Auth Section - Desktop */}
                    {!hideAuthButton && (
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-[#303645] transition-colors p-0 flex items-center justify-center text-white">
                                            <AvatarCircle />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 bg-[#1C2128] border-[#303645] text-white rounded-xl shadow-lg p-0 z-[200]" align="end" sideOffset={8} forceMount>
                                        {/* Header with greeting */}
                                        <div className="px-4 py-3 border-b border-[#303645] bg-[#303645]/30 rounded-t-xl">
                                            <p className="text-sm font-bold text-white font-display">
                                                Hello, {displayFullName.split(' ')[0]}
                                            </p>
                                            <p className="text-xs text-[#A1A1AA] font-display truncate">
                                                {user.email}
                                            </p>
                                        </div>

                                        <div className="p-2">
                                            <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                                <Link to="/dashboard" className="block w-full">
                                                    <span>Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                                <Link to="/account/notifications" className="block w-full flex items-center justify-between">
                                                    <span>Notifications</span>
                                                    {hasUnreadNotifications && (
                                                        <span className="w-2 h-2 rounded-full bg-[#6B6DFF]"></span>
                                                    )}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                                <Link to="/account" className="block w-full">
                                                    <span>Account settings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                                <Link to="/billing" className="block w-full">
                                                    <span>Billing</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </div>
                                        <DropdownMenuSeparator className="bg-[#303645]" />

                                        {/* Admin Section - Only for admins */}
                                        {isAdmin && (
                                            <div className="p-2">
                                                <p className="px-2 py-1.5 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
                                                    Admin
                                                </p>
                                                <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                                    <Link to="/admin" onClick={() => { }} className="block w-full flex items-center">
                                                        <Shield className="mr-2 h-4 w-4 text-[#A1A1AA]" />
                                                        <span>Admin Dashboard</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </div>
                                        )}

                                        {isAdmin && <DropdownMenuSeparator className="bg-[#303645]" />}

                                        {/* Sign Out */}
                                        <div className="p-2">
                                            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer font-display rounded-lg px-3 py-2">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Sign out</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={() => navigate('/auth')}
                                    className="bg-[#6B6DFF] text-white font-display text-sm font-semibold px-6 py-5 rounded hover:bg-[#5a5ce6] hover:shadow-lg transition-all duration-300 active:scale-95 border-none"
                                >
                                    Login or Register
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Mobile User Icon - only when signed in */}
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:bg-[#303645] rounded-full transition-colors flex items-center justify-center text-white">
                                        <AvatarCircle />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 bg-[#1C2128] border-[#303645] text-white rounded-xl shadow-lg p-0 z-[200]" align="end" sideOffset={8} forceMount>
                                    {/* Header with greeting */}
                                    <div className="px-4 py-3 border-b border-[#303645] bg-[#303645]/30 rounded-t-xl">
                                        <p className="text-sm font-bold text-white font-display">
                                            Hello, {displayFullName.split(' ')[0]}
                                        </p>
                                        <p className="text-xs text-[#A1A1AA] font-display truncate">
                                            {user.email}
                                        </p>
                                    </div>

                                    <div className="p-2">
                                        <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block w-full">
                                                <span>Dashboard</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                            <Link to="/account/notifications" onClick={() => setIsMobileMenuOpen(false)} className="block w-full flex items-center justify-between">
                                                <span>Notifications</span>
                                                {hasUnreadNotifications && (
                                                    <span className="w-2 h-2 rounded-full bg-[#6B6DFF]"></span>
                                                )}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                            <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="block w-full">
                                                <span>Account settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                            <Link to="/billing" onClick={() => setIsMobileMenuOpen(false)} className="block w-full">
                                                <span>Billing</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </div>
                                    <DropdownMenuSeparator className="bg-[#303645]" />

                                    {/* Admin Section - Only for admins */}
                                    {isAdmin && (
                                        <div className="p-2">
                                            <p className="px-2 py-1.5 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
                                                Admin
                                            </p>
                                            <DropdownMenuItem asChild className="cursor-pointer font-display rounded-lg px-3 py-2 hover:bg-[#303645]/50 focus:bg-[#303645]/50 text-white">
                                                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block w-full flex items-center">
                                                    <Shield className="mr-2 h-4 w-4 text-[#A1A1AA]" />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </div>
                                    )}

                                    {isAdmin && <DropdownMenuSeparator className="bg-[#303645]" />}

                                    {/* Sign Out */}
                                    <div className="p-2">
                                        <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer font-display rounded-lg px-3 py-2">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Sign out</span>
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <button
                            className="text-white p-2 hover:bg-[#303645] rounded-full transition-colors"
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
                            className="md:hidden overflow-hidden"
                        >
                            <div className="mt-4 pb-4 flex flex-col gap-4">
                                <button onClick={() => scrollToSection("home")} className="text-left text-white hover:text-[#6B6DFF] font-semibold transition-colors py-2 font-display">
                                    Home
                                </button>
                                <Link to="/company" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#6B6DFF] font-semibold transition-colors py-2 font-display">
                                    Company
                                </Link>
                                <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#6B6DFF] font-semibold transition-colors py-2 font-display">
                                    Services
                                </Link>
                                
                                <div className="py-2">
                                    <Link to="/tools" onClick={() => setIsMobileMenuOpen(false)} className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3 font-display">
                                        Our Tools
                                    </Link>
                                    <div className="pl-4 border-l-2 border-[#303645] space-y-4">
                                        {toolsData.map(tool => (
                                            <Link key={tool.id} to={`/tools/${tool.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="block text-[#A1A1AA] hover:text-white transition-colors font-display text-sm font-medium">
                                                {tool.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#6B6DFF] font-semibold transition-colors py-2 font-display">
                                    Contact
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[#A1A1AA] hover:text-[#6B6DFF] font-semibold transition-colors py-2 font-display flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Admin Dashboard
                                    </Link>
                                )}

                                {/* Auth Section - Mobile */}
                                {!hideAuthButton && (
                                    <div className="pt-4 border-t border-[#303645] space-y-4">
                                        {user ? (
                                            <>
                                                <div className="text-sm text-[#A1A1AA] px-4 font-display font-medium">
                                                    <User className="w-4 h-4 inline mr-2 text-[#6B6DFF]" />
                                                    {user.email}
                                                </div>
                                                <Button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full font-display border-[#303645] text-white bg-transparent hover:bg-[#303645]">
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Sign Out
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                                                className="w-full rounded px-6 py-5 bg-[#6B6DFF] hover:bg-[#5a5ce6] hover:shadow-lg text-white font-semibold font-display shadow-sm transition-all duration-300"
                                            >
                                                Login or Register
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
