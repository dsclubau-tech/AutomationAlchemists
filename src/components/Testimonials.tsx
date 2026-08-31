import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  location?: string;
  tag?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "CEO",
    company: "TechFlow Solutions",
    location: "Sydney, NSW",
    tag: "Workflow Automation",
    content: "Automation Alchemists transformed our operations. The virtual assistant they provided handles tasks that used to take our team hours. We've seen a 40% increase in productivity across our Sydney operations.",
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    role: "Founder",
    company: "E-Commerce Empire",
    location: "Melbourne, VIC",
    tag: "Dropshipping Ops",
    content: "The workflow automation they built for our eBay AU & Amazon AU business is incredible. Orders, inventory, and customer support all run on autopilot now. Best investment we've made.",
  },
  {
    id: "3",
    name: "Emily Thompson",
    role: "Operations Director",
    company: "Growth Ventures",
    location: "Brisbane, QLD",
    tag: "Vibe-to-App",
    content: "From concept to launch in 3 weeks. Their Vibe-to-App service turned our idea into a fully functional web app. The team's expertise and communication were exceptional throughout.",
  },
  {
    id: "4",
    name: "David Miller",
    role: "Co-Founder",
    company: "Apex Retail AU",
    location: "Melbourne, VIC",
    tag: "Returns Automation",
    content: "We were drowning in manual return label generation on Amazon and eBay AU. Their custom integration cut our returns processing time from 4 hours a day down to zero manual touches.",
  },
  {
    id: "5",
    name: "Aisha Al-Mansoor",
    role: "Head of Logistics",
    company: "Horizon Trade Co.",
    location: "Perth, WA",
    tag: "Inventory Sync",
    content: "The multi-channel inventory webhook they set up prevents overselling across Shopify and our Perth warehouse ERP. We've had zero inventory discrepancies since deployment.",
  },
  {
    id: "6",
    name: "Liam Gallagher",
    role: "Managing Director",
    company: "SwiftDrops AU",
    location: "Gold Coast, QLD",
    tag: "Real-Time Bots",
    content: "The order notification bot sending instantaneous Discord and WhatsApp alerts for high-value Australian orders changed how our fulfillment staff reacts. Response times dropped by 85%.",
  },
  {
    id: "7",
    name: "Priya Sharma",
    role: "VP of Product",
    company: "CloudNest SaaS",
    location: "Sydney, NSW",
    tag: "Custom SaaS",
    content: "Finding developers who understand backend architecture, Supabase security, and sleek frontend UX in one package is rare. The Automation Alchemists team delivered beyond expectations.",
  },
  {
    id: "8",
    name: "Thomas Wright",
    role: "Founder",
    company: "Melbourne Digital Goods",
    location: "Melbourne, VIC",
    tag: "Tax & Invoicing",
    content: "Their automated PDF invoice generator handles all our compliant GST tax receipts automatically on eBay Australia checkout. Has saved us thousands in outsourced bookkeeping hours.",
  },
  {
    id: "9",
    name: "Chloe Dupont",
    role: "E-Commerce Lead",
    company: "Lumière Brands",
    location: "Adelaide, SA",
    tag: "High-Volume Scaling",
    content: "We went from a scrappy spreadsheet workflow to an automated dropshipping pipeline that processes 600+ orders daily across Australia without crashing or skipping line items.",
  },
  {
    id: "10",
    name: "James Kowalski",
    role: "CTO",
    company: "ScaleWave Media",
    location: "Brisbane, QLD",
    tag: "Database Migration",
    content: "They migrated our messy legacy Firebase auth and storage over to a hardened PostgreSQL architecture with zero user downtime. Impeccable technical rigor.",
  },
  {
    id: "11",
    name: "Natasha Volkova",
    role: "Operations Manager",
    company: "AusExpress Logistics",
    location: "Newcastle, NSW",
    tag: "24/7 Virtual Assistants",
    content: "The 24/7 dedicated virtual assistants they trained for our customer support queue took our average first-reply time from 3 hours to under 4 minutes.",
  },
  {
    id: "12",
    name: "Brendan Hayes",
    role: "Director",
    company: "Sydney Supply Hub",
    location: "Sydney, NSW",
    tag: "Price Repricing Bot",
    content: "Automating our supplier price monitoring protected our margins during sudden wholesale hikes. The scraper flags margin drops immediately and auto-updates our eBay AU listings.",
  },
  {
    id: "13",
    name: "Hannah Kim",
    role: "Founder",
    company: "K-Beauty Australia",
    location: "Melbourne, VIC",
    tag: "Bulk Listing Engine",
    content: "Our product upload bottleneck disappeared after they built our custom bulk-listing tool. We listed 1,200 curated SKUs in an afternoon instead of three weeks.",
  },
  {
    id: "14",
    name: "Carlos Mendez",
    role: "General Manager",
    company: "AutoParts Direct AU",
    location: "Geelong, VIC",
    tag: "Browser Automation",
    content: "The Chrome Extension they engineered for our warehouse pickers eliminated address copy-paste errors completely across Australia Post labels. Delivery success rate jumped to 99.8%.",
  },
  {
    id: "15",
    name: "Zoe Jenkins",
    role: "Head of Growth",
    company: "Pulse Digital",
    location: "Canberra, ACT",
    tag: "Client Portals",
    content: "Their vibe-to-app sprint delivered our client portal on time and on budget. Clean code, responsive design, and lightning-fast API responses.",
  },
  {
    id: "16",
    name: "Ryan O'Connor",
    role: "Principal",
    company: "Horizon Arbitrage",
    location: "Brisbane, QLD",
    tag: "Fulfillment Tooling",
    content: "The instant address auto-fill and label formatting tool they built is bulletproof. Runs seamlessly in our daily Australian fulfillment operations without a single glitch in six months.",
  },
  {
    id: "17",
    name: "Fiona MacLeod",
    role: "COO",
    company: "Highland Commerce AU",
    location: "Hobart, TAS",
    tag: "Catalog Automation",
    content: "We scaled our catalog from 200 to 15,000 active SKUs across Australia. Without Automation Alchemists' database pipelines and automated sync, that growth would have been impossible.",
  },
  {
    id: "18",
    name: "Tariq Benali",
    role: "Co-Founder",
    company: "Nexus E-Com Solutions",
    location: "Sunshine Coast, QLD",
    tag: "Revenue Engines",
    content: "Honest, communicative, and exceptionally sharp engineers. They don't just write code; they solve deep Australian e-commerce bottlenecks and build tools that print revenue.",
  },
];

const variants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const Testimonials = () => {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const activeIndex = ((page % testimonials.length) + testimonials.length) % testimonials.length;
  const currentTestimonial = testimonials[activeIndex];

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      paginate(1);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused, paginate]);

  return (
    <section className="pt-16 md:pt-20 pb-0">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-600/10 text-teal-800 border border-teal-600/20 text-xs font-semibold uppercase tracking-wider mb-4 font-display">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Verified Australian Client Outcomes
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-teal-600 mb-3 font-display">
            What Our Clients Say
          </h2>
          <p className="text-teal-900/80 text-base md:text-lg max-w-2xl mx-auto font-display">
            Real operational results from Australian businesses & e-commerce brands built on our automated engines.
          </p>
        </motion.div>

        {/* Featured Testimonial Card */}
        <div
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative">
            {/* Ambient gold glow accent behind card */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-accent/20 via-teal-600/15 to-yellow-accent/20 rounded-[2rem] blur-xl opacity-70 pointer-events-none" />

            <div className="relative min-h-[340px] sm:min-h-[300px] md:min-h-[280px] bg-white border border-teal-600/20 rounded-3xl p-7 sm:p-10 md:p-12 shadow-xl overflow-hidden flex flex-col justify-between">
              {/* Background watermark quote */}
              <div className="absolute right-6 top-6 text-teal-600/[0.07] pointer-events-none">
                <Quote className="w-28 h-28 stroke-[1.2]" />
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentTestimonial.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col justify-between h-full"
                >
                  {/* Top Category Badge & Quote */}
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Quote className="w-8 h-8 text-yellow-accent fill-yellow-accent/30" />
                        {currentTestimonial.tag && (
                          <span className="px-3 py-0.5 rounded-full bg-mint-50 border border-teal-600/20 text-teal-800 text-xs font-semibold font-display">
                            {currentTestimonial.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900/60 font-mono tracking-widest bg-mint-50/80 px-2.5 py-1 rounded-lg border border-teal-600/10">
                        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
                        <span className="text-teal-600/40">/</span>
                        <span>{String(testimonials.length).padStart(2, "0")}</span>
                      </div>
                    </div>

                    {/* Testimonial Quote Text */}
                    <p className="text-lg sm:text-xl md:text-2xl text-teal-900 font-display font-medium leading-relaxed tracking-tight mb-8">
                      "{currentTestimonial.content}"
                    </p>
                  </div>

                  {/* Client Metadata Footnote */}
                  <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-teal-600/10">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Stylized Monogram Avatar */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-900 text-yellow-accent font-display font-bold text-lg sm:text-xl flex items-center justify-center shadow-md ring-2 ring-yellow-accent/40 flex-shrink-0">
                        {currentTestimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-teal-900 font-bold font-display text-base sm:text-lg">
                            {currentTestimonial.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-600/10 text-teal-800 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            Verified
                          </span>
                        </div>
                        <p className="text-teal-600 font-medium text-xs sm:text-sm font-display">
                          {currentTestimonial.role} · <span className="text-teal-900/80">{currentTestimonial.company}</span>
                          {currentTestimonial.location && (
                            <span className="text-teal-900/50 ml-1">({currentTestimonial.location})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => paginate(-1)}
                        className="w-10 h-10 rounded-full border border-teal-600/20 bg-white hover:bg-yellow-accent hover:text-teal-900 hover:border-yellow-accent text-teal-900 transition-all shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                        aria-label="Previous testimonial"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => paginate(1)}
                        className="w-10 h-10 rounded-full border border-teal-600/20 bg-white hover:bg-yellow-accent hover:text-teal-900 hover:border-yellow-accent text-teal-900 transition-all shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                        aria-label="Next testimonial"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
