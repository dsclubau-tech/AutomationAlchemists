import { motion } from "framer-motion";
import { Mail, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const SOCIAL_LINKS = {
  email: "mailto:contact@automationalchemists.com",
  facebook: "https://www.facebook.com/profile.php?id=61594891561141",
  whatsapp: "https://wa.me/61404242373", // Australia; Bangladesh number is 8801346831069
  instagram: ""
};

const Footer = () => {
  return (
    <footer className="bg-teal-900 w-full py-16 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        {/* Brand & Info */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold text-white">
            <img src={logo} alt="Automation Alchemists Logo" className="h-10 w-10 object-contain" />
            <span>Automation Alchemists</span>
          </Link>
          <p className="font-display text-sm sm:text-base text-[#e5e2e1]/70 max-w-sm">
            Alchemy for the automation era: ideas → apps → passive cashflow
          </p>
          <div className="flex gap-1 mt-4 -ml-3">
            {SOCIAL_LINKS.email && (
              <a href={SOCIAL_LINKS.email} aria-label="Email us" className="text-[#e5e2e1]/70 hover:text-white transition-colors flex items-center justify-center w-[44px] h-[44px]">
                <Mail className="w-5 h-5" />
              </a>
            )}
            {SOCIAL_LINKS.facebook && (
              <a href={SOCIAL_LINKS.facebook} aria-label="Automation Alchemists on Facebook" target="_blank" rel="noopener noreferrer" className="text-[#e5e2e1]/70 hover:text-white transition-colors flex items-center justify-center w-[44px] h-[44px]">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {SOCIAL_LINKS.instagram && (
              <a href={SOCIAL_LINKS.instagram} aria-label="Automation Alchemists on Instagram" target="_blank" rel="noopener noreferrer" className="text-[#e5e2e1]/70 hover:text-white transition-colors flex items-center justify-center w-[44px] h-[44px]">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {SOCIAL_LINKS.whatsapp && (
              <a href={SOCIAL_LINKS.whatsapp} aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer" className="text-[#e5e2e1]/70 hover:text-white transition-colors flex items-center justify-center w-[44px] h-[44px]">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
        
        {/* Links Column 1 */}
        <div className="flex flex-col gap-4">
          <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider mb-2">Pages</h4>
          <Link to="/services" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">Services</Link>
          <Link to="/virtual-assistance" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">Virtual Assistance</Link>
          <Link to="/tools" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">SaaS Tools</Link>
          <Link to="/mission" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">The Mission</Link>
          <Link to="/contact" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">Contact</Link>
        </div>
        
        {/* Links Column 2 */}
        <div className="flex flex-col gap-4">
          <h4 className="font-display text-xs font-semibold text-white uppercase tracking-wider mb-2">Legal</h4>
          <Link to="/privacy" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="font-display text-sm text-[#e5e2e1]/70 hover:text-white transition-colors">Terms of Service</Link>
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
