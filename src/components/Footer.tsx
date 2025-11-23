import { motion } from "framer-motion";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo21.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description - Takes 2 columns */}
          <div className="flex flex-col items-start md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src={logo} alt="AAlchemists Logo" className="w-16 h-16 object-contain" />
              <span className="text-base font-bold">AAlchemists</span>
            </div>
            <p className="text-primary-foreground/80 text-xs">
              Alchemy for the automation era: ideas → apps → passive cashflow
            </p>
          </div>

          {/* Follow Us - Takes 1 column */}
          <div className="flex flex-col items-start">
            <h3 className="font-semibold mb-4">FOLLOW US</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="hover:text-accent transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:dsclub.au@outlook.com" className="hover:text-accent transition-colors" title="Email us" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Pages - Takes 1 column */}
          <div className="flex flex-col items-start">
            <h3 className="font-semibold mb-4">PAGES</h3>
            <ul className="space-y-2 text-xs text-primary-foreground/80">
              <li><Link to="/services" className="hover:text-accent transition-colors">Our Services</Link></li>
              <li><Link to="/services/vibe-to-app" className="hover:text-accent transition-colors">Vibe-to-App Execution</Link></li>
              <li><Link to="/services/virtual-assistants" className="hover:text-accent transition-colors">24/7 Virtual Assistants</Link></li>
              <li><Link to="/services/workflow-automation" className="hover:text-accent transition-colors">Workflow Automation</Link></li>
              <li><Link to="/mission" className="hover:text-accent transition-colors">The Mission</Link></li>
              <li><Link to="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
              <li><Link to="/learn" className="hover:text-accent transition-colors">Learn</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-primary-foreground/80 text-center md:text-left">
              &copy; {new Date().getFullYear()} AAlchemists. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-primary-foreground/80">
              <Link to="/terms" className="hover:text-accent transition-colors">
                Terms Of Use
              </Link>
              <Link to="/privacy" className="hover:text-accent transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
