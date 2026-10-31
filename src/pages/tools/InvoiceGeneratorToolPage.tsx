import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import SchemaMarkup from '@/components/SchemaMarkup';
import { RevealText } from '@/components/RevealText';
import { RevealBlock } from '@/components/RevealBlock';
import {
  APP_SIGNUP_URL,
  APP_PRIVACY_URL,
  invoiceGeneratorPageContent,
  InvoiceGeneratorFeatureCard,
} from '@/data/invoiceGeneratorPage';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Copy,
  Download,
  Mail,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const featureIconMap: Record<InvoiceGeneratorFeatureCard['icon'], React.ComponentType<{ className?: string }>> = {
  FileText,
  Search,
  Copy,
  Download,
};

const InvoiceGeneratorToolPage: React.FC = () => {
  const content = invoiceGeneratorPageContent;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-mint-50 text-teal-900 selection:bg-teal-600 selection:text-white flex flex-col justify-between overflow-x-hidden">
      <SEOHead
        title="Invoice Generator by Automation Alchemists - Simple Invoices for Marketplace Sellers"
        description="Create custom invoices for your customers. Add your business details, download a PDF or send it through Gmail. Free to get started."
        url="https://www.automationalchemists.com/tools/invoice-generator"
      />
      <SchemaMarkup
        type="SoftwareApplication"
        data={{
          name: content.productName,
          description: content.supportingText,
          url: 'https://www.automationalchemists.com/tools/invoice-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'AUD',
          },
        }}
      />
      <Navigation />

      <main className="flex-grow pt-28 md:pt-32 pb-24">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-24">
          {/* Breadcrumb Row */}
          <RevealBlock animateOnLoad delay={0}>
            <nav aria-label="Breadcrumb" className="text-sm font-medium">
              <ol className="flex items-center gap-2 text-teal-600 flex-wrap">
                <li>
                  <Link
                    to={content.breadcrumb.parentHref}
                    className="hover:underline flex items-center gap-1.5 transition-colors font-display"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {content.breadcrumb.parent}
                  </Link>
                </li>
                <li className="text-teal-900/40" aria-hidden="true">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="text-teal-900 font-semibold truncate font-display" aria-current="page">
                  {content.breadcrumb.current}
                </li>
              </ol>
            </nav>
          </RevealBlock>

          {/* Hero Section */}
          <section>
            <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 md:p-12 shadow-sm">
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                {/* Left: Product Logo */}
                <RevealBlock animateOnLoad delay={0.08} className="shrink-0 w-full md:w-auto flex justify-start">
                  <img
                    src="/invoice-generator-logo.png"
                    alt="Invoice Generator"
                    width="425"
                    height="512"
                    className="w-[80px] lg:w-[110px] h-auto object-contain"
                  />
                </RevealBlock>

                {/* Right: Hero Content */}
                <div className="flex-grow min-w-0">
                  {/* Parent Brand line */}
                  <RevealBlock animateOnLoad delay={0.16}>
                    <div className="flex items-center gap-2 mb-3">
                      <img src="/logo.png" alt="Automation Alchemists" className="w-4 h-4 object-contain" />
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-600 font-display">
                        {content.parentBrand}
                      </p>
                    </div>
                  </RevealBlock>

                  {/* Headline */}
                  <RevealBlock animateOnLoad delay={0.24}>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-teal-900 tracking-tight leading-tight mb-4">
                      {content.headline}
                    </h1>
                  </RevealBlock>

                  {/* Supporting Text */}
                  <RevealBlock animateOnLoad delay={0.32}>
                    <p className="text-base sm:text-lg text-teal-900/80 font-display leading-relaxed mb-6">
                      {content.supportingText}
                    </p>
                  </RevealBlock>

                  {/* Audience & Availability Details */}
                  <RevealBlock animateOnLoad delay={0.38}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-8 text-sm text-teal-900/70 font-display">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        {content.audienceLine}
                      </span>
                      <span className="hidden sm:inline text-teal-900/30">•</span>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        {content.availabilityLine}
                      </span>
                    </div>
                  </RevealBlock>

                  {/* CTA & Note */}
                  <div className="pt-6 border-t border-teal-600/15 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <RevealBlock animateOnLoad delay={0.46} className="w-full sm:w-auto">
                      <a
                        href={APP_SIGNUP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center py-3 px-6 rounded-lg border border-transparent bg-yellow-accent text-teal-900 font-semibold text-base transition-colors shadow-sm [@media(hover:hover)]:hover:bg-yellow-accent/90 active:bg-yellow-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 font-display w-full sm:w-auto text-center"
                      >
                        {content.mainButtonText}
                        <ExternalLink className="w-4 h-4 ml-2 shrink-0" />
                      </a>
                    </RevealBlock>
                    <RevealBlock animateOnLoad delay={0.52}>
                      <span className="text-xs text-teal-900/70 font-display">
                        {content.separateAccountNote}
                      </span>
                    </RevealBlock>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Feature Cards (Four features) */}
          <section className="space-y-6">
            <RevealText
              text="Features"
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {content.features.map((feature, i) => {
                const IconComponent = featureIconMap[feature.icon];
                return (
                  <RevealBlock key={i} delay={i * 0.08}>
                    <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 h-full shadow-sm flex flex-col">
                      <div className="w-12 h-12 rounded-xl bg-mint-100 flex items-center justify-center text-teal-600 mb-4 shrink-0">
                        {IconComponent && <IconComponent className="w-6 h-6" />}
                      </div>
                      <h3 className="font-bold text-teal-900 font-display text-lg sm:text-xl mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-base text-teal-900/80 font-display leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </RevealBlock>
                );
              })}
            </div>
          </section>

          {/* Section: Three Steps */}
          <section className="space-y-6">
            <RevealText
              text="How it works"
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {content.steps.map((step, i) => (
                <RevealBlock key={i} delay={i * 0.1}>
                  <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 flex flex-col h-full shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm mb-4 shrink-0 font-display">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-bold text-teal-900 font-display mb-2">
                      {step.title}
                    </h3>
                    <p className="text-base text-teal-900/80 font-display leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </section>

          {/* Section: Free Allowance ("What's included for free") */}
          <section className="space-y-6">
            <RevealText
              text={content.freeAllowance.title}
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            <RevealBlock delay={0.15}>
              <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm space-y-6">
                <ul className="space-y-4">
                  {content.freeAllowance.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3.5">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-base text-teal-900/90 font-display leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6 border-t border-teal-600/15">
                  <p className="text-base font-semibold text-teal-600 font-display">
                    {content.freeAllowance.growthSentence}
                  </p>
                </div>
              </div>
            </RevealBlock>
          </section>

          {/* Section: Screenshots (Rendered ONLY when array has items) */}
          {content.screenshots && content.screenshots.length > 0 && (
            <section className="space-y-6">
              <RevealText
                text="Screenshots"
                className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
                delay={0.1}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.screenshots.map((s, idx) => (
                  <div key={idx} className="bg-white border border-teal-600/20 rounded-2xl p-4 shadow-sm">
                    <img src={s.src} alt={s.alt} className="w-full h-auto rounded-lg" />
                    {s.caption && (
                      <p className="text-xs text-teal-900/70 font-display mt-2 text-center">
                        {s.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Frequently Asked Questions */}
          <section className="space-y-6">
            <RevealText
              text="Frequently asked questions"
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            <div className="space-y-4 pt-2">
              {content.faqs.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <RevealBlock key={i} delay={i * 0.05}>
                    <div className="bg-white border border-teal-600/20 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                      <button
                        type="button"
                        onClick={() => toggleFaq(i)}
                        className="w-full p-6 text-left flex items-center justify-between gap-4 font-display font-bold text-lg text-teal-900 hover:text-teal-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-teal-600 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 pt-0 border-t border-teal-600/10 text-base text-teal-900/80 font-display leading-relaxed">
                          <p className="mt-4">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  </RevealBlock>
                );
              })}
            </div>

            {/* Links to Privacy Policy and Contact */}
            <RevealBlock delay={0.35}>
              <div className="bg-mint-100/60 border border-teal-600/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-teal-600 shrink-0" />
                  <span className="text-sm sm:text-base text-teal-900 font-display">
                    Have questions about Invoice Generator? Reach out to our team.
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold font-display">
                  <a
                    href="mailto:contact@automationalchemists.com"
                    className="text-teal-600 hover:text-teal-800 hover:underline"
                  >
                    contact@automationalchemists.com
                  </a>
                  <span className="text-teal-900/30">|</span>
                  <a
                    href={APP_PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-1"
                  >
                    Privacy Policy
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </RevealBlock>
          </section>

          {/* Section: Closing CTA Card */}
          <section className="pt-4">
            <RevealBlock delay={0.1}>
              <div className="bg-white border border-teal-600/20 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-sm">
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-teal-900 mb-4">
                  {content.closingCard.heading}
                </h2>
                <p className="text-base sm:text-lg text-teal-900/80 font-display mb-8 max-w-xl mx-auto leading-relaxed">
                  {content.closingCard.text}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={APP_SIGNUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center py-3.5 px-8 rounded-lg border border-transparent bg-yellow-accent text-teal-900 font-semibold text-base transition-colors shadow-sm [@media(hover:hover)]:hover:bg-yellow-accent/90 active:bg-yellow-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 font-display w-full sm:w-auto"
                  >
                    {content.closingCard.buttonText}
                    <ExternalLink className="w-4 h-4 ml-2 shrink-0" />
                  </a>
                  <span className="text-xs text-teal-900/70 font-display">
                    {content.closingCard.note}
                  </span>
                </div>
              </div>
            </RevealBlock>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InvoiceGeneratorToolPage;
