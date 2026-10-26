import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  useTrialStatus,
  getTrialStatus,
  getClaimErrorMessage,
  formatTrialTimeLeft,
} from '@/lib/trial';
import { startTrialCheckout, redirectToBillingPortal } from '@/lib/checkout';
import { useAuth } from '@/hooks/useAuth';

interface DashboardTrialCardProps {
  userId?: string;
  onClaimSuccess: () => Promise<void> | void;
  onSubscribe: () => void;
  priceMonthly?: number;
}

export const DashboardTrialCard: React.FC<DashboardTrialCardProps> = ({
  userId,
  onClaimSuccess,
  onSubscribe,
  priceMonthly = 9,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: trialStatus, loading, refetch } = useTrialStatus('rccp', userId);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Polling state for /dashboard?checkout=success
  const [isPolling, setIsPolling] = useState(false);
  const [successEndsAt, setSuccessEndsAt] = useState<string | null>(null);
  const [deniedReason, setDeniedReason] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Detect ?checkout=success and poll get_trial_status every 2s up to 40s
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;

    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 2s = 40 seconds

    const poll = async () => {
      attempts += 1;
      const res = await getTrialStatus('rccp');
      if (res.ok) {
        if (res.data.has_access) {
          clearInterval(intervalId);
          setIsPolling(false);
          setSuccessEndsAt(res.data.claim?.ends_at || null);
          await refetch();
          await onClaimSuccess();
          return;
        }
        if (res.data.denied_reason) {
          clearInterval(intervalId);
          setIsPolling(false);
          setDeniedReason(res.data.denied_reason);
          return;
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setIsPolling(false);
        setIsTimedOut(true);
      }
    };

    poll();
    const intervalId = setInterval(poll, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refetch, onClaimSuccess]);

  // Smooth scroll and soft highlight if URL hash is #claim-trial
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#claim-trial') {
      const el = document.getElementById('claim-trial');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsHighlighted(true);
        const timer = setTimeout(() => setIsHighlighted(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [trialStatus, successEndsAt]);

  // 1. Checkout success polling active
  if (isPolling) {
    return (
      <div
        id="claim-trial"
        className="mb-8 p-6 rounded-xl bg-teal-800 border border-teal-600/30 flex items-center gap-4"
      >
        <Loader2 className="w-6 h-6 animate-spin text-yellow-accent shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-white font-display">
            Setting up your trial...
          </h3>
          <p className="text-sm text-white/80 font-display">
            Verifying your card details and activating your CP Bot access.
          </p>
        </div>
      </div>
    );
  }

  // 2. Checkout polling succeeded
  if (successEndsAt) {
    const formattedDate = new Date(successEndsAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return (
      <div
        id="claim-trial"
        className="mb-8 p-6 rounded-xl bg-teal-800 border border-green-500/30 transition-all duration-700"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0 border border-green-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Your free trial is active until {formattedDate}
              </h3>
              <p className="text-sm text-white/80 font-display">
                CP Bot is unlocked. Open your tools below or visit the CP Bot dashboard.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors font-display shrink-0 w-full sm:w-auto"
          >
            <a href="https://rccp.automationalchemists.com" target="_blank" rel="noopener noreferrer">
              Open CP Bot
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // 3. Checkout polling returned denial reason
  if (deniedReason) {
    const errorMsg = getClaimErrorMessage(deniedReason, priceMonthly);
    return (
      <div
        id="claim-trial"
        className="mb-8 p-6 rounded-xl bg-teal-800 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 border border-red-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              {errorMsg}
            </h3>
            <p className="text-sm text-white/70 font-display">
              You can still subscribe to CP Bot directly without a trial.
            </p>
          </div>
        </div>
        <Button
          onClick={onSubscribe}
          className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors font-display shrink-0 w-full sm:w-auto"
        >
          Subscribe
        </Button>
      </div>
    );
  }

  // 4. Checkout polling timed out (> 40s)
  if (isTimedOut) {
    return (
      <div
        id="claim-trial"
        className="mb-8 p-6 rounded-xl bg-teal-800 border border-yellow-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              This is taking longer than usual. Refresh in a minute or contact us.
            </h3>
            <p className="text-sm text-white/70 font-display">
              Stripe checkout was completed, but webhook confirmation is still processing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-teal-600 text-mint-50 hover:bg-teal-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors font-display w-full sm:w-auto"
          >
            Refresh
          </Button>
          <Button
            asChild
            className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-4 py-2 rounded-lg text-sm transition-colors font-display w-full sm:w-auto"
          >
            <a href="/contact">Contact us</a>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return null;
  }

  // 5. Active trial state (has_access and claim present, not converted, not revoked)
  if (
    trialStatus?.has_access &&
    trialStatus?.already_claimed &&
    trialStatus?.claim &&
    !trialStatus.claim.converted &&
    !trialStatus.claim.revoked
  ) {
    const { text: timeText, formattedDate } = formatTrialTimeLeft(trialStatus.claim.ends_at);
    return (
      <div
        id="claim-trial"
        className="mb-8 p-4 rounded-xl bg-teal-800 border border-teal-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center text-yellow-accent shrink-0 border border-teal-600/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-display">
              Free trial: {timeText} (ends {formattedDate})
            </p>
          </div>
        </div>
        <Button
          onClick={() => redirectToBillingPortal(toast)}
          className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-5 py-2 rounded-lg text-sm transition-colors font-display shrink-0 w-full sm:w-auto"
        >
          Manage subscription
        </Button>
      </div>
    );
  }

  // 6. Ended trial state (claimed, no access, not converted)
  if (
    trialStatus?.already_claimed &&
    !trialStatus?.has_access &&
    trialStatus?.claim &&
    !trialStatus.claim.converted
  ) {
    return (
      <div
        id="claim-trial"
        className="mb-8 p-4 rounded-xl bg-teal-800 border border-yellow-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/20">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-display">
              Your free trial has ended
            </p>
          </div>
        </div>
        <Button
          onClick={onSubscribe}
          className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-5 py-2 rounded-lg text-sm transition-colors font-display shrink-0 w-full sm:w-auto"
        >
          Subscribe
        </Button>
      </div>
    );
  }

  // 7. Offer enabled, eligible, not claimed -> Show Start Trial card
  if (
    trialStatus?.enabled &&
    trialStatus?.eligible &&
    !trialStatus?.already_claimed &&
    !trialStatus?.has_access &&
    (trialStatus?.slots_left ?? 0) > 0
  ) {
    const trialDays = trialStatus.trial_days || 30;
    const slotsLeft = trialStatus.slots_left ?? 0;
    const slotCap = trialStatus.slot_cap ?? 500;

    const handleStartTrialClick = async () => {
      if (isStartingCheckout) return;
      setIsStartingCheckout(true);
      try {
        await startTrialCheckout({
          returnPath: '/dashboard',
          user,
          toast,
        });
      } finally {
        setIsStartingCheckout(false);
      }
    };

    return (
      <div
        id="claim-trial"
        className={`mb-12 p-6 sm:p-8 rounded-2xl bg-teal-800 border border-teal-600/30 shadow-lg transition-all duration-700 ${
          isHighlighted ? 'ring-2 ring-yellow-accent/60 shadow-[0_0_25px_rgba(255,210,0,0.25)]' : ''
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-accent/15 text-yellow-accent text-xs font-semibold uppercase tracking-wider font-display">
              <Sparkles className="w-3.5 h-3.5" />
              Limited Free Trial
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              Start your {trialDays}-day free trial of CP Bot
            </h2>
            <p className="text-white/80 font-display text-base leading-relaxed">
              Return Converter is always free. Experience full CP Bot automation with zero risk.
            </p>
            <p className="text-xs sm:text-sm text-teal-200/80 font-display pt-1">
              {slotsLeft} of {slotCap} free-trial spots left
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto flex flex-col items-start sm:items-end gap-2">
            <Button
              type="button"
              disabled={isStartingCheckout}
              onClick={handleStartTrialClick}
              className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 disabled:opacity-60 font-bold px-8 py-3.5 rounded-lg text-base transition-colors shadow-md font-display w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isStartingCheckout ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Redirecting to checkout...</span>
                </>
              ) : (
                <span>Start free trial now</span>
              )}
            </Button>
            <p className="text-xs text-teal-200/80 font-display text-left sm:text-right">
              {trialDays} days free, then A${priceMonthly}/month. Card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 8. Offer enabled but slots_left is 0 and user has not claimed
  if (trialStatus?.enabled && !trialStatus?.already_claimed && trialStatus?.slots_left === 0) {
    return (
      <div id="claim-trial" className="mb-8 p-4 rounded-xl bg-teal-800/60 border border-teal-600/20 text-center">
        <p className="text-sm text-white/70 font-display">
          All free-trial spots have been claimed.
        </p>
      </div>
    );
  }

  // 9. Otherwise (offer disabled, not eligible, or user already has paid/manual access) -> render nothing
  return null;
};
