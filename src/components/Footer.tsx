import { motion } from "framer-motion";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo21.png";

const Footer = () => {
  return (
    <footer className="mt-16 md:mt-24 pb-8 bg-background">
      <div className="container mx-auto px-6">
        {/* Broken Gold Line Divider */}
        <div className="ml-0 w-3/5 mb-8">
          <div className="broken-gold-line h-[1.5px] opacity-40"></div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description - Takes 2 columns */}
          <div className="flex flex-col items-start md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src={logo} alt="AAlchemists Logo" className="w-16 h-16 object-contain" />
              <span className="text-base font-bold text-primary font-display">AAlchemists</span>
            </div>
            <p className="text-white/60 text-xs font-display">
              Alchemy for the automation era: ideas → apps → passive cashflow
            </p>
          </div>

          {/* Follow Us - Takes 1 column */}
          <div className="flex flex-col items-start">
            <h3 className="font-semibold mb-4 text-white font-display">FOLLOW US</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-white/60 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-primary transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:dsclub.au@outlook.com" className="text-white/60 hover:text-primary transition-colors" title="Email us" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Pages - Takes 1 column */}
          <div className="flex flex-col items-start">
            <h3 className="font-semibold mb-4 text-white font-display">PAGES</h3>
            <ul className="space-y-2 text-xs text-white/60 font-display">
              <li><Link to="/services" className="hover:text-primary transition-colors">Our Services</Link></li>
              <li><Link to="/services/vibe-to-app" className="hover:text-primary transition-colors">Vibe-to-App Execution</Link></li>
              <li><Link to="/services/virtual-assistants" className="hover:text-primary transition-colors">24/7 Virtual Assistants</Link></li>
              <li><Link to="/services/workflow-automation" className="hover:text-primary transition-colors">Workflow Automation</Link></li>
              <li><Link to="/mission" className="hover:text-primary transition-colors">The Mission</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/learn" className="hover:text-primary transition-colors">Learn</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/60 font-display">
          <p>&copy; {new Date().getFullYear()} AAlchemists. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
