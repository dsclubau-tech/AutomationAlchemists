import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { RevealText } from '@/components/RevealText';
import { RevealBlock } from '@/components/RevealBlock';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleGetAccessLogic } from '@/lib/checkout';
import { supabase } from '@/integrations/supabase/client';
import { rccpPageContent, RccpIncludedCard } from '@/data/rccpPage';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Download,
  MousePointerClick,
  MapPinCheck,
  AlertCircle,
  Cloud,
  Gift,
  History,
} from 'lucide-react';

interface DbTool {
  slug: string;
  status: 'coming_soon' | 'available' | 'maintenance' | 'hidden';
  price_monthly: number;
  maintenance_message: string | null;
}

const includedIconMap: Record<RccpIncludedCard['icon'], React.ComponentType<{ className?: string }>> = {
  FileCheck,
  ShieldCheck,
  Download,
  MousePointerClick,
  MapPinCheck,
  AlertCircle,
  Cloud,
  Gift,
  History,
};

const RccpToolPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const content = rccpPageContent;

  const [dbTool, setDbTool] = useState<DbTool>({
    slug: 'rccp',
    status: 'available',
    price_monthly: 9,
    maintenance_message: null,
  });

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('slug, status, price_monthly, maintenance_message')
          .eq('slug', 'rccp')
          .maybeSingle();

        if (!error && data) {
          setDbTool(data as DbTool);
        }
      } catch (err) {
        console.error('Error fetching rccp tool data:', err);
      }
    };
    fetchTool();
  }, []);

  const handleGetAccess = () => {
    handleGetAccessLogic('rccp', user, toast);
  };

  const renderAccessButton = (buttonText: string, extraClassName = '') => {
    if (dbTool.status === 'maintenance') {
      return (
        <button
          type="button"
          disabled
          className={`inline-flex items-center justify-center py-3 px-6 rounded-lg bg-teal-600/10 text-teal-900/60 font-semibold text-base cursor-not-allowed border border-teal-600/20 font-display ${extraClassName}`}
        >
          {dbTool.maintenance_message || 'Under maintenance'}
        </button>
      );
    }
    if (dbTool.status === 'coming_soon') {
      return (
        <button
          type="button"
          disabled
          className={`inline-flex items-center justify-center py-3 px-6 rounded-lg bg-teal-600/10 text-teal-900/60 font-semibold text-base cursor-not-allowed border border-teal-600/20 font-display ${extraClassName}`}
        >
          Coming Soon
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleGetAccess}
        className={`inline-flex items-center justify-center py-3 px-6 rounded-lg border border-transparent bg-yellow-accent text-teal-900 font-semibold text-base transition-colors shadow-sm [@media(hover:hover)]:hover:bg-yellow-accent/90 active:bg-yellow-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 font-display ${extraClassName}`}
      >
        {buttonText}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-mint-50 text-teal-900 selection:bg-teal-600 selection:text-white flex flex-col justify-between overflow-x-hidden">
      <SEOHead
        title="Return Converter x CopyPaste Bot - eBay to Amazon AU Tools"
        description="Turn Amazon AU return codes into clean eBay return labels for free, and copy buyer addresses from eBay into Amazon checkout in one click."
        url="https://www.automationalchemists.com/tools/rccp"
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
                {/* Left: Logo without tile */}
                <RevealBlock animateOnLoad delay={0.08} className="shrink-0 w-full md:w-auto flex justify-start">
                  <img
                    src="/images/rccp-logo.png"
                    alt="Return Converter × CopyPaste Bot"
                    width="949"
                    height="650"
                    className="w-[80px] lg:w-[110px] h-auto object-contain"
                  />
                </RevealBlock>

                {/* Right: Content */}
                <div className="flex-grow min-w-0">
                  <RevealBlock animateOnLoad delay={0.16}>
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-600 font-display mb-2">
                      {content.eyebrow}
                    </p>
                  </RevealBlock>

                  <RevealBlock animateOnLoad delay={0.24}>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-teal-900 tracking-tight leading-tight mb-4">
                      {content.hero.title.tool1}{' '}
                      <span className="text-teal-900/40 font-normal">{content.hero.title.separator}</span>{' '}
                      <span className="text-teal-600">{content.hero.title.tool2}</span>
                    </h1>
                  </RevealBlock>

                  <RevealBlock animateOnLoad delay={0.32}>
                    <p className="text-base sm:text-lg text-teal-900/80 font-display leading-relaxed mb-8">
                      {content.hero.intro}
                    </p>
                  </RevealBlock>

                  <div className="pt-6 border-t border-teal-600/15 flex flex-wrap items-center gap-x-8 gap-y-5">
                    <RevealBlock animateOnLoad delay={0.4} className="flex flex-col gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-teal-900/70 font-display whitespace-nowrap min-w-[140px]">
                          {content.hero.pricing.converterLabel}:
                        </span>
                        <span className="text-base font-bold text-teal-900 font-display whitespace-nowrap">
                          {content.hero.pricing.converterPrice}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-teal-900/70 font-display whitespace-nowrap min-w-[140px]">
                          {content.hero.pricing.botLabel}:
                        </span>
                        <span className="text-base font-bold text-teal-900 font-display whitespace-nowrap">
                          {content.hero.pricing.botPriceFormat(dbTool.price_monthly)}
                        </span>
                      </div>
                    </RevealBlock>

                    <RevealBlock animateOnLoad delay={0.48} className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto shrink-0">
                      {renderAccessButton(content.hero.buttons.getAccess, 'w-full sm:w-auto whitespace-nowrap shrink-0')}
                      <a
                        href={content.hero.buttons.freeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center py-3 px-6 rounded-lg border border-teal-600 text-teal-600 font-semibold text-base transition-colors bg-transparent [@media(hover:hover)]:hover:bg-teal-600/10 active:bg-teal-600/15 w-full sm:w-auto text-center font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 whitespace-nowrap shrink-0"
                      >
                        {content.hero.buttons.useFree}
                      </a>
                    </RevealBlock>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Return Converter */}
          <section className="space-y-6">
            <RevealText
              text={content.returnConverter.heading}
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            <RevealBlock delay={0.18}>
              <p className="text-lg sm:text-xl font-semibold text-teal-600 font-display">
                {content.returnConverter.subline}
              </p>
            </RevealBlock>

            <RevealBlock delay={0.24}>
              <p className="text-base sm:text-lg text-teal-900/80 font-display leading-relaxed max-w-3xl">
                {content.returnConverter.paragraph}
              </p>
            </RevealBlock>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
              {content.returnConverter.steps.map((step, i) => (
                <RevealBlock key={i} delay={i * 0.1}>
                  <div className="bg-white border border-teal-600/20 rounded-2xl p-6 flex flex-col h-full shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm mb-4 shrink-0 font-display">
                      {i + 1}
                    </div>
                    <p className="text-base text-teal-900/90 font-display leading-relaxed">
                      {step}
                    </p>
                  </div>
                </RevealBlock>
              ))}
            </div>

            {/* Closing note & CTA */}
            <RevealBlock delay={0.4} className="pt-2 space-y-6">
              <p className="text-base text-teal-900/80 font-display leading-relaxed max-w-3xl">
                {content.returnConverter.closingNote}
              </p>
              <div>
                <a
                  href={content.hero.buttons.freeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center py-3 px-6 rounded-lg border border-teal-600 text-teal-600 font-semibold text-base transition-colors bg-transparent [@media(hover:hover)]:hover:bg-teal-600/10 active:bg-teal-600/15 w-full sm:w-auto text-center font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  {content.returnConverter.cta}
                </a>
              </div>
            </RevealBlock>
          </section>

          {/* Section: CopyPaste Bot */}
          <section className="space-y-6">
            <RevealText
              text={content.copyPasteBot.heading}
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            <RevealBlock delay={0.18}>
              <p className="text-lg sm:text-xl font-semibold text-teal-600 font-display">
                {content.copyPasteBot.subline}
              </p>
            </RevealBlock>

            {/* 2x2 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {content.copyPasteBot.cards.map((card, i) => (
                <RevealBlock key={i} delay={Math.min(i * 0.08, 0.4)}>
                  <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 h-full shadow-sm flex flex-col">
                    <div className="flex items-start gap-3.5 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-1" />
                      <h3 className="font-bold text-teal-900 font-display text-lg sm:text-xl">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-base text-teal-900/80 font-display leading-relaxed pl-8">
                      {card.body}
                    </p>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </section>

          {/* Two Columns: Quick start & For eBay AU sellers */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Quick start */}
            <RevealBlock delay={0.1} className="h-full">
              <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 h-full shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-teal-900 font-display mb-1">
                    {content.copyPasteBot.quickStart.heading}
                  </h3>
                  <p className="text-sm sm:text-base font-semibold text-teal-600 font-display mb-6">
                    {content.copyPasteBot.quickStart.subline}
                  </p>
                  <ol className="space-y-4">
                    {content.copyPasteBot.quickStart.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3.5">
                        <span className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-display mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-base text-teal-900/90 font-display leading-relaxed">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </RevealBlock>

            {/* For eBay AU sellers */}
            <RevealBlock delay={0.2} className="h-full">
              <div className="bg-white border border-teal-600/20 rounded-2xl p-6 sm:p-8 h-full shadow-sm flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-teal-900 font-display mb-4">
                  {content.copyPasteBot.forSellers.heading}
                </h3>
                <p className="text-base sm:text-lg text-teal-900/80 font-display leading-relaxed">
                  {content.copyPasteBot.forSellers.body}
                </p>
              </div>
            </RevealBlock>
          </section>

          {/* Section: What's included */}
          <section className="space-y-12">
            <RevealText
              text={content.whatsIncluded.heading}
              className="text-3xl sm:text-4xl font-bold font-display text-teal-900"
              delay={0.1}
            />

            {/* Return Converter Group */}
            <div className="space-y-6">
              <RevealBlock delay={0.15}>
                <h3 className="text-xs font-bold tracking-widest uppercase text-teal-600 font-display">
                  {content.whatsIncluded.returnConverter.groupLabel}
                </h3>
              </RevealBlock>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.whatsIncluded.returnConverter.cards.map((card, i) => {
                  const IconComponent = includedIconMap[card.icon];
                  return (
                    <RevealBlock key={i} delay={Math.min(i * 0.08, 0.4)}>
                      <div className="bg-white border border-teal-600/20 rounded-2xl p-6 shadow-sm h-full flex flex-col">
                        <div className="w-12 h-12 rounded-xl bg-mint-100 flex items-center justify-center text-teal-600 mb-4 shrink-0">
                          {IconComponent && <IconComponent className="w-6 h-6" />}
                        </div>
                        <h4 className="text-lg font-bold text-teal-900 font-display mb-2">
                          {card.title}
                        </h4>
                        <p className="text-base text-teal-900/80 font-display leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </RevealBlock>
                  );
                })}
              </div>
            </div>

            {/* CopyPaste Bot Group */}
            <div className="space-y-6">
              <RevealBlock delay={0.15}>
                <h3 className="text-xs font-bold tracking-widest uppercase text-teal-600 font-display">
                  {content.whatsIncluded.copyPasteBot.groupLabel}
                </h3>
              </RevealBlock>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.whatsIncluded.copyPasteBot.cards.map((card, i) => {
                  const IconComponent = includedIconMap[card.icon];
                  return (
                    <RevealBlock key={i} delay={Math.min(i * 0.08, 0.4)}>
                      <div className="bg-white border border-teal-600/20 rounded-2xl p-6 shadow-sm h-full flex flex-col">
                        <div className="w-12 h-12 rounded-xl bg-mint-100 flex items-center justify-center text-teal-600 mb-4 shrink-0">
                          {IconComponent && <IconComponent className="w-6 h-6" />}
                        </div>
                        <h4 className="text-lg font-bold text-teal-900 font-display mb-2">
                          {card.title}
                        </h4>
                        <p className="text-base text-teal-900/80 font-display leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </RevealBlock>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Closing Card */}
          <section className="pt-4">
            <RevealBlock delay={0.1}>
              <div className="bg-white border border-teal-600/20 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-sm">
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-teal-900 mb-4">
                  {content.closingCard.heading}
                </h2>
                <p className="text-base sm:text-lg text-teal-900/80 font-display mb-8 max-w-xl mx-auto leading-relaxed">
                  {content.closingCard.text}
                </p>
                <div className="flex justify-center">
                  {renderAccessButton(content.closingCard.button, 'w-full sm:w-auto px-8 py-3.5 text-base')}
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

export default RccpToolPage;
