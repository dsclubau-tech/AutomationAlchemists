import { motion } from "framer-motion";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg" />
              <span className="text-base font-bold">AAlchemists</span>
            </div>
            <p className="text-primary-foreground/80 text-xs">
              Alchemy for the automation era: ideas → apps → passive cashflow goes below AAlchemists
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-xs text-primary-foreground/80">
              <li><Link to="/services/vibe-to-app" className="hover:text-accent transition-colors">Vibe-to-App Execution</Link></li>
              <li><Link to="/services/virtual-assistants" className="hover:text-accent transition-colors">24/7 Virtual Assistants</Link></li>
              <li><Link to="/services/workflow-automation" className="hover:text-accent transition-colors">Workflow Automation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-xs text-primary-foreground/80">
              <li><Link to="/mission" className="hover:text-accent transition-colors">The Mission</Link></li>
              <li><Link to="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact the Alchemists</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-xs text-primary-foreground/80">
          <p>&copy; {new Date().getFullYear()} AAlchemists. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
