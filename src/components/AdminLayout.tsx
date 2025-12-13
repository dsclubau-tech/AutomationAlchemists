import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Mail, Users, FileText, DollarSign, LogOut, ChevronLeft, ChevronRight, Home, Briefcase, BookOpen, MessageSquare, Newspaper, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, loading: authLoading, signOut } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: Mail, description: 'Contact submissions' },
        { path: '/admin/contacts', label: 'Contact Settings', icon: MessageSquare, description: 'Contact page info' },
        { path: '/admin/users', label: 'Users', icon: Users, description: 'Manage users' },
        { path: '/admin/content', label: 'Content', icon: FileText, description: 'Educational content' },
        { path: '/admin/pricing', label: 'Pricing', icon: DollarSign, description: 'Pricing packages' },
        { path: '/admin/services', label: 'Services', icon: Briefcase, description: 'Manage services' },
        { path: '/admin/learn', label: 'Learn Content', icon: BookOpen, description: 'Articles & categories' },
        { path: '/admin/newsletter', label: 'Newsletter', icon: Newspaper, description: 'Newsletter subscribers' },
    ];

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const checkAdminStatus = useCallback(async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        try {
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .maybeSingle();

            if (roleError) throw roleError;

            if (!roleData) {
                toast({
                    title: 'Access Denied',
                    description: 'You do not have admin privileges',
                    variant: 'destructive',
                });
                navigate('/');
                return;
            }

            setIsAdmin(true);
        } catch (error) {
            console.error('Error checking admin status:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to verify admin status',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, navigate, toast]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            checkAdminStatus();
        }
    }, [user, checkAdminStatus]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Header */}
            <div className="p-4 border-b border-primary/20">
                <Link to="/" className="flex items-center gap-3" onClick={() => isMobile && setMobileMenuOpen(false)}>
                    <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                    {(!sidebarCollapsed || isMobile) && (
                        <span className="text-lg font-bold text-text-main font-display">Admin Panel</span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => isMobile && setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "text-text-muted hover:bg-primary/10 hover:text-text-main"
                            )}
                            title={sidebarCollapsed && !isMobile ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "")} />
                            {(!sidebarCollapsed || isMobile) && (
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{item.label}</span>
                                    <span className="text-xs text-text-muted/70">{item.description}</span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-primary/20 space-y-1">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-primary/10 hover:text-text-main transition-all"
                    title={sidebarCollapsed && !isMobile ? "Back to Site" : undefined}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                >
                    <Home className="h-5 w-5" />
                    {(!sidebarCollapsed || isMobile) && <span className="text-sm">Back to Site</span>}
                </Link>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-text-muted hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { handleSignOut(); isMobile && setMobileMenuOpen(false); }}
                    title={sidebarCollapsed && !isMobile ? "Sign Out" : undefined}
                >
                    <LogOut className="h-5 w-5" />
                    {(!sidebarCollapsed || isMobile) && <span className="text-sm">Sign Out</span>}
                </Button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-background-dark flex">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-surface-dark border-r border-primary/20 flex flex-col transition-transform duration-300 z-50 w-64 md:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent isMobile={true} />
            </aside>

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-surface-dark border-r border-primary/20 flex-col transition-all duration-300 z-50 hidden md:flex",
                    sidebarCollapsed ? "w-16" : "w-64"
                )}
            >
                <SidebarContent isMobile={false} />

                {/* Collapse Toggle - Desktop Only */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-dark border border-primary/30 rounded-full flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
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
                    "flex-1 transition-all duration-300",
                    "ml-0 md:ml-64",
                    sidebarCollapsed && "md:ml-16"
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md border-b border-primary/20 px-4 md:px-8 py-4 md:py-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-text-muted hover:text-text-main transition-colors"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                        <div>
                            <h1 className="text-xl md:text-3xl font-bold text-text-main font-display">{title}</h1>
                            {description && (
                                <p className="text-text-muted mt-1 text-sm md:text-base">{description}</p>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
