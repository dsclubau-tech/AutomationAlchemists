const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'WebDevelopment', title: 'Custom Web Development Services | AAlchemists', desc: 'Expert custom web development services. We build responsive, fast, and scalable web applications tailored to your business needs globally.', keyword: 'web development, custom web app, responsive websites, frontend, backend', route: 'web-development', displayName: 'Web Development' },
  { name: 'AppDevelopment', title: 'Android & Flutter App Development Agency | AAlchemists', desc: 'Top-tier Android and Flutter app development. We create cross-platform mobile apps with native performance to reach your global audience.', keyword: 'app development, flutter development, android development, cross-platform apps', route: 'app-development', displayName: 'App Development' },
  { name: 'SaasDevelopment', title: 'SaaS Development & Consulting Services | AAlchemists', desc: 'End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms.', keyword: 'SaaS development, SaaS consulting, software as a service, scalable architecture', route: 'saas-development', displayName: 'SaaS Development' },
  { name: 'Automation', title: 'Business Workflow Automation Consulting | AAlchemists', desc: 'Streamline your operations with our workflow automation consulting. We integrate AI and automation tools to save time and boost efficiency.', keyword: 'workflow automation, business automation, AI integration, process optimization', route: 'automation', displayName: 'Workflow Automation' }
];

pages.forEach(p => {
  const content = 'import { motion } from "framer-motion";\n' +
'import Navigation from "@/components/Navigation";\n' +
'import Footer from "@/components/Footer";\n' +
'import { Button } from "@/components/ui/button";\n' +
'import { ArrowRight } from "lucide-react";\n' +
'import { Link } from "react-router-dom";\n' +
'import SEOHead from "@/components/SEOHead";\n' +
'import SchemaMarkup from "@/components/SchemaMarkup";\n' +
'\n' +
'const ' + p.name + ' = () => {\n' +
'    return (\n' +
'        <div className="min-h-screen bg-background">\n' +
'            <SEOHead\n' +
'                title="' + p.title + '"\n' +
'                description="' + p.desc + '"\n' +
'                url="https://automationalchemists.com/services/' + p.route + '"\n' +
'                keywords="' + p.keyword + '"\n' +
'            />\n' +
'            <SchemaMarkup\n' +
'                type="ProfessionalService"\n' +
'                data={{\n' +
'                    name: "' + p.displayName + '",\n' +
'                    description: "' + p.desc + '",\n' +
'                    url: "https://automationalchemists.com/services/' + p.route + '",\n' +
'                    provider: {\n' +
'                        "@type": "Organization",\n' +
'                        "name": "AAlchemists"\n' +
'                    }\n' +
'                }}\n' +
'            />\n' +
'            <Navigation />\n' +
'\n' +
'            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">\n' +
'                <div className="container mx-auto px-6 py-32 relative z-10">\n' +
'                    <motion.div\n' +
'                        initial={{ opacity: 0, y: 30 }}\n' +
'                        animate={{ opacity: 1, y: 0 }}\n' +
'                        transition={{ duration: 0.8 }}\n' +
'                        className="max-w-4xl mx-auto text-center"\n' +
'                    >\n' +
'                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-display">\n' +
'                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">\n' +
'                                ' + p.displayName + '\n' +
'                            </span>\n' +
'                        </h1>\n' +
'                        <p className="text-sm sm:text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-display">\n' +
'                            ' + p.desc + '\n' +
'                        </p>\n' +
'                        <Link to="/contact">\n' +
'                            <Button\n' +
'                                size="lg"\n' +
'                                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base group font-display"\n' +
'                            >\n' +
'                                Start Your Project\n' +
'                                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />\n' +
'                            </Button>\n' +
'                        </Link>\n' +
'                    </motion.div>\n' +
'                </div>\n' +
'            </section>\n' +
'            \n' +
'            <Footer />\n' +
'        </div>\n' +
'    );\n' +
'};\n' +
'\n' +
'export default ' + p.name + ';\n';

  fs.writeFileSync(path.join(__dirname, '..', 'src', 'pages', p.name + '.tsx'), content);
});

console.log("Pages generated successfully.");
