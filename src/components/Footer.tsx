import { motion } from "framer-motion";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-[#1c1b1b] w-full py-16 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        {/* Brand & Info */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold text-white">
            <img src={logo} alt="Automation Alchemists Logo" className="h-10 w-10 object-contain filter brightness-0 invert" />
            <span>Automation Alchemists</span>
          </Link>
          <p className="font-display text-sm sm:text-base text-[#e5e2e1]/70 max-w-sm">
            Alchemy for the automation era: ideas → apps → passive cashflow
          </p>
          <div className="flex gap-4 mt-4">
            <a href="https://x.com/AAlchemists" target="_blank" rel="noopener noreferrer" className="text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/aalchemists" target="_blank" rel="noopener noreferrer" className="text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://github.com/dsclubau-tech" target="_blank" rel="noopener noreferrer" className="text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="mailto:dsclub.au@outlook.com" className="text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        {/* Links Column 1 */}
        <div className="flex flex-col gap-4">
          <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider mb-2">Pages</h4>
          <Link to="/services" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Our Services</Link>
          <Link to="/services/vibe-to-app" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Vibe-to-App Execution</Link>
          <Link to="/services/virtual-assistants" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">24/7 Virtual Assistants</Link>
          <Link to="/services/workflow-automation" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Workflow Automation</Link>
          <Link to="/tools" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">SaaS Tools</Link>
          <Link to="/mission" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">The Mission</Link>
          <Link to="/pricing" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Pricing</Link>
          <Link to="/contact" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Contact</Link>
          <Link to="/learn" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Learn</Link>
        </div>
        
        {/* Links Column 2 */}
        <div className="flex flex-col gap-4">
          <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider mb-2">Legal</h4>
          <Link to="/privacy" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="font-display text-sm text-[#e5e2e1]/70 hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center md:text-left">
        <p className="font-display text-sm text-[#e5e2e1]/70">
          &copy; {new Date().getFullYear()} Automation Alchemists. All rights reserved. Transforming complexity into golden efficiency.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
