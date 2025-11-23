import { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo21.png";

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
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="AAlchemists Logo" className="w-16 h-16 object-contain -my-2" />
            <span className="text-xl font-bold text-necro-green font-determination">AAlchemists</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8">
            <button onClick={() => scrollToSection("home")} className="text-foreground hover:text-primary transition-colors font-determination">
              Home
            </button>
            <button onClick={() => scrollToSection("about")} className="text-foreground hover:text-primary transition-colors font-determination">
              About
            </button>
            <Link to="/services" className="text-foreground hover:text-primary transition-colors font-determination">
              Services
            </Link>
            <Link to="/learn" className="text-foreground hover:text-primary transition-colors font-determination">
              Learn
            </Link>
            <button onClick={() => scrollToSection("contact")} className="text-foreground hover:text-primary transition-colors font-determination">
              Contact
            </button>
            <ThemeToggle />
          </div>

          {/* Auth Section - Desktop */}
          {!hideAuthButton && (
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-determination">
                    <User className="w-4 h-4" />
                    {user.email}
                  </span>
                  <Button onClick={handleSignOut} variant="outline" size="sm" className="font-determination">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/auth')} variant="default" size="sm" className="font-determination">
                  Sign In
                </Button>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
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
                <button onClick={() => scrollToSection("home")} className="text-left text-foreground hover:text-primary transition-colors py-2 font-determination">
                  Home
                </button>
                <button onClick={() => scrollToSection("about")} className="text-left text-foreground hover:text-primary transition-colors py-2 font-determination">
                  About
                </button>
                <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-determination">
                  Services
                </Link>
                <Link to="/learn" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-2 font-determination">
                  Learn
                </Link>
                <button onClick={() => scrollToSection("contact")} className="text-left text-foreground hover:text-primary transition-colors py-2 font-determination">
                  Contact
                </button>

                {/* Auth Section - Mobile */}
                {!hideAuthButton && (
                  <div className="pt-4 border-t border-border space-y-4">
                    {user ? (
                      <>
                        <div className="text-sm text-muted-foreground px-4 font-determination">
                          <User className="w-4 h-4 inline mr-2" />
                          {user.email}
                        </div>
                        <Button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full font-determination">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }} className="w-full font-determination">
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
