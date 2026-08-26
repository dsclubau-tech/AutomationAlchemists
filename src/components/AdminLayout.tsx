import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
    LayoutDashboard, 
    Wrench, 
    Briefcase, 
    CreditCard, 
    Users, 
    GraduationCap, 
    Mail, 
    MessageSquare, 
    FileText, 
    LogOut, 
    Menu, 
    X, 
    ChevronLeft, 
    ChevronRight,
    Shield,
    Home,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
}

const navItems = [
    { path: "/admin", label: "Overview", icon: LayoutDashboard, description: "Dashboard & stats" },
    { path: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, description: "Manage access & plans" },
    { path: "/admin/users", label: "Users", icon: Users, description: "User management" },
    { path: "/admin/tools", label: "Tools", icon: Wrench, description: "Manage tool catalog" },
    { path: "/admin/services", label: "Services", icon: Briefcase, description: "Manage services" },
    { path: "/admin/pricing", label: "Pricing", icon: CreditCard, description: "Pricing & tiers" },
    { path: "/admin/learn", label: "Learn", icon: GraduationCap, description: "Articles & guides" },
    { path: "/admin/contact", label: "Contact", icon: MessageSquare, description: "Manage contact page" },
    { path: "/admin/contact-submissions", label: "Submissions", icon: MessageSquare, description: "Contact form leads" },
    { path: "/admin/newsletter", label: "Newsletter", icon: Mail, description: "Subscribers & campaigns" },
    { path: "/admin/content", label: "Content", icon: FileText, description: "Hero & promo banners" },
    { path: "/admin/audit-log", label: "Audit Log", icon: Shield, description: "Admin activity trail" },
];

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // Check admin status
    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .single();

            if (error || !data?.is_admin) {
                navigate("/");
                return;
            }

            setIsAdmin(true);
        };

        checkAdmin();
    }, [user, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    // Show loading state while checking admin status
    if (isAdmin === null) {
        return (
            <div className="min-h-screen bg-mint-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Header */}
            <div className="p-4 border-b border-teal-600/20 bg-white">
                <Link to="/" className="flex items-center gap-3" onClick={() => isMobile && setMobileMenuOpen(false)}>
                    <Shield className="h-8 w-8 text-teal-600 flex-shrink-0" />
                    {(!sidebarCollapsed || isMobile) && (
                        <span className="text-lg font-bold text-teal-900 font-display">Admin Panel</span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto bg-white">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => isMobile && setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-teal-800 text-white font-semibold shadow-sm"
                                    : "text-teal-900/70 hover:bg-teal-600/10 hover:text-teal-900"
                            )}
                            title={sidebarCollapsed && !isMobile ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-yellow-accent" : "text-teal-600")} />
                            {(!sidebarCollapsed || isMobile) && (
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm leading-snug">{item.label}</span>
                                    <span className={cn("text-[11px]", isActive ? "text-white/70" : "text-teal-900/50")}>{item.description}</span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-teal-600/20 bg-white space-y-1">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-teal-900/70 hover:bg-teal-600/10 hover:text-teal-900 transition-all font-display text-sm font-medium"
                    title={sidebarCollapsed && !isMobile ? "Back to Site" : undefined}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                >
                    <Home className="h-5 w-5 text-teal-600" />
                    {(!sidebarCollapsed || isMobile) && <span>Back to Site</span>}
                </Link>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    onClick={() => { handleSignOut(); if (isMobile) setMobileMenuOpen(false); }}
                    title={sidebarCollapsed && !isMobile ? "Sign Out" : undefined}
                >
                    <LogOut className="h-5 w-5" />
                    {(!sidebarCollapsed || isMobile) && <span className="text-sm font-medium">Sign Out</span>}
                </Button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-mint-50 text-teal-900 flex">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-white border-r border-teal-600/20 shadow-xl flex flex-col transition-transform duration-300 z-50 w-64 md:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent isMobile={true} />
            </aside>

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-white border-r border-teal-600/20 shadow-sm flex-col transition-all duration-300 z-50 hidden md:flex",
                    sidebarCollapsed ? "w-16" : "w-64"
                )}
            >
                <SidebarContent isMobile={false} />

                {/* Collapse Toggle - Desktop Only */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-teal-600/30 rounded-full flex items-center justify-center text-teal-900 shadow-sm hover:text-teal-600 hover:border-teal-600 transition-all"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 bg-mint-50 min-h-screen",
                    "ml-0 md:ml-64",
                    sidebarCollapsed && "md:ml-16"
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-teal-600/20 px-4 md:px-8 py-4 md:py-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-teal-900 hover:bg-teal-600/10 rounded-lg transition-colors"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold text-teal-900 font-display">{title}</h1>
                                {description && (
                                    <p className="text-teal-900/70 mt-1 text-sm md:text-base font-display">{description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-teal-900/70 font-display">
                            <span className="hidden md:inline-block bg-teal-600/10 text-teal-900 px-3 py-1.5 rounded-full font-medium text-xs">{user?.email}</span>
                            <Link to="/" className="text-teal-600 hover:text-teal-800 font-semibold transition-colors flex items-center gap-1">
                                Back to site
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
