import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  useTrialStatus,
  claimFreeTrial,
  getClaimErrorMessage,
  formatTrialTimeLeft,
} from '@/lib/trial';

interface DashboardTrialCardProps {
  userId?: string;
  onClaimSuccess: () => Promise<void> | void;
  onSubscribe: () => void;
}

export const DashboardTrialCard: React.FC<DashboardTrialCardProps> = ({
  userId,
  onClaimSuccess,
  onSubscribe,
}) => {
  const { toast } = useToast();
  const { data: trialStatus, loading, refetch } = useTrialStatus('rccp', userId);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<{ ends_at: string; days: number } | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

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
  }, [trialStatus, justClaimed]);

  if (loading) {
    return null;
  }

  // 1. Claim just succeeded in this session
  if (justClaimed) {
    const formattedDate = new Date(justClaimed.ends_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return (
      <div
        id="claim-trial"
        className={`mb-8 p-6 rounded-xl bg-teal-800 border border-green-500/30 transition-all duration-700 ${
          isHighlighted ? 'ring-2 ring-yellow-accent/60 shadow-[0_0_20px_rgba(255,210,0,0.25)]' : ''
        }`}
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

  // 2. Active trial state (has_access and claim present, not converted, not revoked)
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
          onClick={onSubscribe}
          className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-5 py-2 rounded-lg text-sm transition-colors font-display shrink-0 w-full sm:w-auto"
        >
          Subscribe to keep CP Bot
        </Button>
      </div>
    );
  }

  // 3. Ended trial state (claimed, no access, not converted)
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
          Subscribe to keep CP Bot
        </Button>
      </div>
    );
  }

  // 4. Offer enabled, eligible, not claimed -> Show Claim card
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

    const handleClaimClick = async () => {
      if (isClaiming) return;
      setIsClaiming(true);
      setClaimError(null);
      try {
        const res = await claimFreeTrial('rccp');
        if (res.ok) {
          setJustClaimed({ ends_at: res.ends_at, days: res.days });
          await refetch();
          await onClaimSuccess();
          toast({
            title: 'Free trial activated!',
            description: `Your ${res.days}-day CP Bot trial is active.`,
          });
        } else {
          const msg = getClaimErrorMessage(res.reason);
          setClaimError(msg);
          toast({
            title: 'Trial claim notice',
            description: msg,
            variant: 'destructive',
          });
        }
      } catch {
        const msg = 'Something went wrong. Please try again.';
        setClaimError(msg);
        toast({
          title: 'Trial claim notice',
          description: msg,
          variant: 'destructive',
        });
      } finally {
        setIsClaiming(false);
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
              No credit card needed. Return Converter stays free.
            </p>
            <p className="text-xs sm:text-sm text-teal-200/80 font-display pt-1">
              {slotsLeft} of {slotCap} free-trial spots left
            </p>
            {claimError && (
              <p className="text-sm font-medium text-red-400 font-display pt-1">
                {claimError}
              </p>
            )}
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <Button
              type="button"
              disabled={isClaiming}
              onClick={handleClaimClick}
              className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 disabled:opacity-60 font-bold px-8 py-3.5 rounded-lg text-base transition-colors shadow-md font-display w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Activating trial...</span>
                </>
              ) : (
                <span>Claim free trial</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Offer enabled but slots_left is 0 and user has not claimed
  if (trialStatus?.enabled && !trialStatus?.already_claimed && trialStatus?.slots_left === 0) {
    return (
      <div id="claim-trial" className="mb-8 p-4 rounded-xl bg-teal-800/60 border border-teal-600/20 text-center">
        <p className="text-sm text-white/70 font-display">
          All free-trial spots have been claimed.
        </p>
      </div>
    );
  }

  // 6. Otherwise (offer disabled, not eligible, or user already has paid/manual access) -> render nothing
  return null;
};
