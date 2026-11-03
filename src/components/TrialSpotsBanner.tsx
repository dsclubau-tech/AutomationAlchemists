import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TrialTermsLine, PRICING_CONFIG, formatPrice } from '@/config/pricing';
import { startTrialCheckout, handleGetAccessLogic } from '@/lib/checkout';
import { getTrialPublic, type TrialPublicData } from '@/lib/trial';
import { getTrialBannerView, type TrialBannerView } from '@/lib/trialBanner';

export interface TrialSpotsBannerProps {
  toolSlug?: string;
  hide?: boolean;
  className?: string;
  initialTrialDays?: number;
}

export const TrialSpotsBanner: React.FC<TrialSpotsBannerProps> = ({
  toolSlug = 'rccp',
  hide = false,
  className = '',
  initialTrialDays = 30,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  const isPrerender = typeof window !== 'undefined' && Boolean((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__);

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TrialPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  // Fetch live public trial stats
  const fetchData = useCallback(async () => {
    if (isPrerender) {
      setLoading(false);
      return;
    }
    const res = await getTrialPublic(toolSlug);
    if (res.ok) {
      setData(res.data);
      setFetchError(false);
    } else {
      setFetchError(true);
    }
    setLoading(false);
  }, [toolSlug, isPrerender]);

  useEffect(() => {
    setMounted(true);
    fetchData();

    // Live update: refetch every 30 seconds while tab is visible
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    }, 30000);

    // Live update: refetch when tab regains focus
    const handleFocus = () => {
      fetchData();
    };

    // Live update: refetch when tab visibility changes to visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // If page requested to hide (e.g. user already has active trial access), render nothing
  if (hide) {
    return null;
  }

  // Pre-hydration or prerender: render skeleton to prevent stale numbers in HTML and avoid layout shift
  const isPending = !mounted || isPrerender || loading;

  const view: TrialBannerView = getTrialBannerView({
    loading: isPending,
    fetchError,
    enabled: data?.enabled,
    slotCap: data?.slot_cap,
    spotsLeft: data?.slots_left,
    trialDays: data?.trial_days || initialTrialDays,
  });

  // Render nothing if offer is disabled, fetch failed, or cap invalid
  if (!view.shouldRender) {
    return null;
  }

  // Skeleton state
  if (view.state === 'loading') {
    return (
      <div
        className={`w-full bg-white border border-teal-600/20 rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm animate-pulse ${className}`}
        aria-hidden="true"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 w-full max-w-xl">
            <div className="h-6 w-36 bg-teal-900/10 rounded-full" />
            <div className="h-8 w-64 sm:w-80 bg-teal-900/10 rounded-lg" />
            <div className="h-4 w-full max-w-md bg-teal-900/10 rounded" />
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-28 bg-teal-900/10 rounded" />
              <div className="h-2.5 w-full bg-teal-900/10 rounded-full" />
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="h-12 w-full sm:w-48 bg-teal-900/10 rounded-lg" />
            <div className="h-3 w-40 bg-teal-900/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrialSpotsBannerLoaded
      view={view}
      trialDays={data?.trial_days || initialTrialDays}
      className={className}
      isStartingCheckout={isStartingCheckout}
      onStartTrial={async () => {
        if (isStartingCheckout) return;
        setIsStartingCheckout(true);
        try {
          await startTrialCheckout({
            returnPath: '/tools/rccp',
            user,
            toast,
          });
        } finally {
          setIsStartingCheckout(false);
        }
      }}
      onGetAccess={() => {
        handleGetAccessLogic('rccp', user, toast);
      }}
      shouldReduceMotion={Boolean(shouldReduceMotion)}
    />
  );
};

interface TrialSpotsBannerLoadedProps {
  view: TrialBannerView;
  trialDays: number;
  className: string;
  isStartingCheckout: boolean;
  onStartTrial: () => Promise<void>;
  onGetAccess: () => void;
  shouldReduceMotion: boolean;
}

const TrialSpotsBannerLoaded: React.FC<TrialSpotsBannerLoadedProps> = ({
  view,
  trialDays,
  className,
  isStartingCheckout,
  onStartTrial,
  onGetAccess,
  shouldReduceMotion,
}) => {
  // Smooth animated countdown with framer-motion
  const [displaySpots, setDisplaySpots] = useState<number>(view.spotsLeft);
  const prevSpotsRef = useRef<number>(view.spotsLeft);
  const initialMountedRef = useRef(false);

  useEffect(() => {
    const target = view.spotsLeft;

    // Skip animation on initial mount or when reduced motion is preferred
    if (!initialMountedRef.current || shouldReduceMotion) {
      setDisplaySpots(target);
      prevSpotsRef.current = target;
      initialMountedRef.current = true;
      return;
    }

    const start = prevSpotsRef.current;
    if (start === target) return;

    const controls = animate(start, target, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplaySpots(Math.round(latest));
      },
      onComplete: () => {
        setDisplaySpots(target);
        prevSpotsRef.current = target;
      },
    });

    return () => controls.stop();
  }, [view.spotsLeft, shouldReduceMotion]);

  const handleCtaClick = () => {
    if (view.ctaMode === 'start_trial') {
      onStartTrial();
    } else {
      onGetAccess();
    }
  };

  return (
    <div
      className={`w-full bg-white border rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm transition-all duration-300 ${
        view.isUrgent
          ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/20'
          : 'border-teal-600/20'
      } ${className}`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left / Info area */}
        <div className="space-y-3 w-full max-w-xl">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-display border ${
                view.isUrgent
                  ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                  : view.state === 'sold_out'
                  ? 'bg-teal-900/10 text-teal-900/60 border-teal-900/20'
                  : 'bg-teal-600/10 text-teal-700 border-teal-600/20'
              }`}
            >
              {view.isUrgent ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              ) : view.state === 'sold_out' ? null : (
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              )}
              {view.badgeText}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-900 font-display tracking-tight leading-tight">
            {view.state === 'available' && (
              <>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="tabular-nums font-extrabold text-teal-600"
                >
                  {displaySpots}
                </span>{' '}
                of <span className="tabular-nums">{view.slotCap}</span> free-trial spots left
              </>
            )}
            {view.state === 'low' && (
              <>
                Only{' '}
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="tabular-nums font-extrabold text-amber-600"
                >
                  {displaySpots}
                </span>{' '}
                free-trial spot{displaySpots === 1 ? '' : 's'} left
              </>
            )}
            {view.state === 'sold_out' && view.headline}
          </h2>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-teal-900/80 font-display leading-relaxed">
            {view.subtext}
          </p>

          {/* Progress Bar (shrinks as spots are claimed) */}
          <div className="w-full space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs font-semibold font-display text-teal-900/70">
              <span>Capacity remaining</span>
              <span className="tabular-nums">{view.percentageLeft}% remaining</span>
            </div>
            <div
              className="w-full h-2.5 bg-teal-900/10 rounded-full overflow-hidden p-0.5"
              role="progressbar"
              aria-valuenow={displaySpots}
              aria-valuemin={0}
              aria-valuemax={view.slotCap}
              aria-label="Free-trial spots remaining"
            >
              <motion.div
                className={`h-full rounded-full transition-colors duration-500 ${
                  view.isUrgent
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-accent'
                    : 'bg-gradient-to-r from-teal-600 to-teal-500'
                }`}
                initial={false}
                animate={{ width: `${view.percentageLeft}%` }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Right / CTA area */}
        <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-2 shrink-0">
          <button
            type="button"
            disabled={isStartingCheckout}
            onClick={handleCtaClick}
            className="inline-flex items-center justify-center py-3.5 px-6 sm:px-8 rounded-lg border border-transparent bg-yellow-accent text-teal-900 font-bold text-base transition-colors shadow-sm [@media(hover:hover)]:hover:bg-yellow-accent/90 active:bg-yellow-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 font-display w-full sm:w-auto whitespace-nowrap"
          >
            {isStartingCheckout ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to checkout...</span>
              </span>
            ) : (
              view.ctaText
            )}
          </button>

          {view.state === 'sold_out' ? (
            <div className="text-xs text-teal-900/70 font-display text-left sm:text-right">
              Launch price <span className="font-bold text-teal-900">{formatPrice(PRICING_CONFIG.launchPrice)}/month</span> (normally {formatPrice(PRICING_CONFIG.standardPrice)}/mo), incl. GST.
            </div>
          ) : (
            <TrialTermsLine
              trialDays={trialDays}
              className="text-xs text-teal-900/70 font-display text-left sm:text-right max-w-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};

