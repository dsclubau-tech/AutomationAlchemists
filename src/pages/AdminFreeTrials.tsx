import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  adminTrialGetOffer,
  adminTrialUpdateOffer,
  adminTrialListClaims,
  adminTrialExtend,
  adminTrialRevoke,
  adminTrialResetClaim,
  adminBlockedDomainsList,
  adminBlockedDomainAdd,
  adminBlockedDomainRemove,
  type TrialOfferAdmin,
  type TrialClaimAdmin,
  type BlockedDomainAdmin,
} from "@/lib/adminTrial";

export default function AdminFreeTrials() {
  const { toast } = useToast();
  const toolSlug = "rccp";

  // General state
  const [missingMigration, setMissingMigration] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(true);
  const [savingOffer, setSavingOffer] = useState(false);

  // Offer form state
  const [offer, setOffer] = useState<TrialOfferAdmin | null>(null);
  const [formEnabled, setFormEnabled] = useState(false);
  const [formTrialDays, setFormTrialDays] = useState(30);
  const [formSlotCap, setFormSlotCap] = useState(500);
  const [formSlotsReserved, setFormSlotsReserved] = useState(0);
  const [formRequireConfirmed, setFormRequireConfirmed] = useState(false);

  // Enable Confirmation Modal state
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);

  // Claims Table state
  const [claims, setClaims] = useState<TrialClaimAdmin[]>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageOffset, setPageOffset] = useState(0);
  const pageSize = 20;

  // Claim Action Modals state
  const [extendClaim, setExtendClaim] = useState<TrialClaimAdmin | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [isExtending, setIsExtending] = useState(false);

  const [revokeClaim, setRevokeClaim] = useState<TrialClaimAdmin | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const [resetClaim, setResetClaim] = useState<TrialClaimAdmin | null>(null);
  const [resetConfirmEmail, setResetConfirmEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Blocked Domains state
  const [domains, setDomains] = useState<BlockedDomainAdmin[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState<string | null>(null);
  const [isRemovingDomain, setIsRemovingDomain] = useState(false);

  // 1. Fetch Offer
  const fetchOffer = useCallback(async () => {
    setLoadingOffer(true);
    const res = await adminTrialGetOffer(toolSlug);
    if (res.isMissingMigration) {
      setMissingMigration(true);
      setLoadingOffer(false);
      return;
    }
    if (res.ok && res.data) {
      setOffer(res.data);
      setFormEnabled(res.data.enabled);
      setFormTrialDays(res.data.trial_days);
      setFormSlotCap(res.data.slot_cap);
      setFormSlotsReserved(res.data.slots_reserved);
      setFormRequireConfirmed(res.data.require_confirmed_email);
    } else {
      toast({
        title: "Error loading trial offer",
        description: res.error || "Could not fetch offer settings",
        variant: "destructive",
      });
    }
    setLoadingOffer(false);
  }, [toolSlug, toast]);

  // 2. Fetch Claims
  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    const res = await adminTrialListClaims({
      toolSlug,
      search: searchQuery,
      limit: pageSize,
      offset: pageOffset,
    });
    if (res.isMissingMigration) {
      setMissingMigration(true);
      setClaimsLoading(false);
      return;
    }
    if (res.ok && res.data) {
      setClaims(res.data.claims);
      setTotalClaims(res.data.total_count);
    } else {
      toast({
        title: "Error loading claims",
        description: res.error || "Could not fetch trial claims",
        variant: "destructive",
      });
    }
    setClaimsLoading(false);
  }, [toolSlug, searchQuery, pageOffset, toast]);

  // 3. Fetch Blocked Domains
  const fetchDomains = useCallback(async () => {
    setDomainsLoading(true);
    const res = await adminBlockedDomainsList();
    if (res.isMissingMigration) {
      setMissingMigration(true);
      setDomainsLoading(false);
      return;
    }
    if (res.ok && res.data) {
      setDomains(res.data);
    } else {
      toast({
        title: "Error loading blocked domains",
        description: res.error || "Could not fetch domain list",
        variant: "destructive",
      });
    }
    setDomainsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchOffer();
    fetchDomains();
  }, [fetchOffer, fetchDomains]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Save Offer Handler
  const executeSaveOffer = async (targetEnabled: boolean) => {
    setSavingOffer(true);
    const res = await adminTrialUpdateOffer({
      toolSlug,
      enabled: targetEnabled,
      trialDays: formTrialDays,
      slotCap: formSlotCap,
      slotsReserved: formSlotsReserved,
      requireConfirmedEmail: formRequireConfirmed,
    });

    if (res.ok && res.data) {
      setOffer(res.data);
      setFormEnabled(res.data.enabled);
      toast({
        title: "Offer updated",
        description: `Trial offer successfully ${res.data.enabled ? "enabled" : "disabled"}.`,
      });
      setShowEnableConfirm(false);
    } else {
      toast({
        title: "Failed to update offer",
        description: res.message || res.error || "Validation error",
        variant: "destructive",
      });
    }
    setSavingOffer(false);
  };

  const handleOfferFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If enabling or already enabled and keeping it enabled, show confirmation dialog
    if (formEnabled) {
      setShowEnableConfirm(true);
    } else {
      // Turning off needs one click
      executeSaveOffer(false);
    }
  };

  // Extend Claim Handler
  const handleExtendSubmit = async () => {
    if (!extendClaim) return;
    setIsExtending(true);
    const res = await adminTrialExtend(extendClaim.id, extendDays);
    if (res.ok) {
      toast({
        title: "Trial Extended",
        description: `Extended ${extendClaim.email} by ${extendDays} days.`,
      });
      setExtendClaim(null);
      fetchClaims();
    } else {
      toast({
        title: "Failed to extend trial",
        description: res.message || res.error,
        variant: "destructive",
      });
    }
    setIsExtending(false);
  };

  // Revoke Claim Handler
  const handleRevokeSubmit = async () => {
    if (!revokeClaim) return;
    setIsRevoking(true);
    const res = await adminTrialRevoke(revokeClaim.id);
    if (res.ok) {
      toast({
        title: "Trial Revoked",
        description: `Revoked claim for ${revokeClaim.email}. Subscription canceled.`,
      });
      setRevokeClaim(null);
      fetchClaims();
    } else {
      toast({
        title: "Failed to revoke trial",
        description: res.message || res.error,
        variant: "destructive",
      });
    }
    setIsRevoking(false);
  };

  // Reset Claim Handler
  const handleResetSubmit = async () => {
    if (!resetClaim) return;
    if (resetConfirmEmail.trim().toLowerCase() !== resetClaim.email.trim().toLowerCase()) {
      toast({
        title: "Email Mismatch",
        description: "Please type the exact email address to confirm reset.",
        variant: "destructive",
      });
      return;
    }
    setIsResetting(true);
    const res = await adminTrialResetClaim(resetClaim.id);
    if (res.ok) {
      toast({
        title: "Claim Reset",
        description: `Deleted claim & trial subscription for ${resetClaim.email}. They can now claim again.`,
      });
      setResetClaim(null);
      setResetConfirmEmail("");
      fetchClaims();
      fetchOffer();
    } else {
      toast({
        title: "Failed to reset claim",
        description: res.message || res.error,
        variant: "destructive",
      });
    }
    setIsResetting(false);
  };

  // Blocked Domains Handlers
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    setIsAddingDomain(true);
    const res = await adminBlockedDomainAdd(domain);
    if (res.ok) {
      toast({
        title: "Domain Blocked",
        description: `Added "${domain}" to blocked email domains.`,
      });
      setNewDomain("");
      fetchDomains();
    } else {
      toast({
        title: "Failed to add domain",
        description: res.message || res.error,
        variant: "destructive",
      });
    }
    setIsAddingDomain(false);
  };

  const handleRemoveDomain = async () => {
    if (!domainToRemove) return;
    setIsRemovingDomain(true);
    const res = await adminBlockedDomainRemove(domainToRemove);
    if (res.ok) {
      toast({
        title: "Domain Unblocked",
        description: `Removed "${domainToRemove}" from blocked domains.`,
      });
      setDomainToRemove(null);
      fetchDomains();
    } else {
      toast({
        title: "Failed to remove domain",
        description: res.message || res.error,
        variant: "destructive",
      });
    }
    setIsRemovingDomain(false);
  };

  const getStatusBadge = (status: TrialClaimAdmin["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300">Active</Badge>;
      case "converted":
        return <Badge className="bg-blue-500/15 text-blue-700 border-blue-300">Converted</Badge>;
      case "expired":
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300">Expired</Badge>;
      case "revoked":
        return <Badge className="bg-rose-500/15 text-rose-700 border-rose-300">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout
      title="Free Trials"
      description="Manage promotional free trial parameters, customer claims, and disposable email restrictions"
    >
      <TooltipProvider>
        <div className="space-y-8">
          {/* Missing Migration Notice */}
          {missingMigration && (
            <Card className="border-amber-300 bg-amber-50 shadow-sm">
              <CardContent className="p-6 flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-amber-900 font-display">Not set up yet: apply migration 033</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Database functions for free trial admin controls are not yet present. Apply{" "}
                    <code className="bg-amber-200/60 px-1 py-0.5 rounded text-amber-900 font-mono text-xs">
                      supabase/migrations/033_admin_trial_controls.sql
                    </code>{" "}
                    to activate.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 1: Trial Offer Configuration */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border border-teal-600/20 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-600/10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    <CardTitle className="text-xl font-bold text-teal-900 font-display">
                      Return Converter x CopyPaste Bot Offer (rccp)
                    </CardTitle>
                  </div>
                  {offer && (
                    <Badge
                      className={
                        offer.enabled
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-300"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }
                    >
                      {offer.enabled ? "Offer Enabled" : "Offer Disabled"}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-teal-900/70">
                  Control trial duration, campaign slot caps, email verification, and public visibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingOffer ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  </div>
                ) : (
                  <form onSubmit={handleOfferFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Trial Days */}
                      <div className="space-y-2">
                        <Label htmlFor="trialDays" className="text-teal-900 font-semibold">
                          Trial Days (1..90)
                        </Label>
                        <Input
                          id="trialDays"
                          type="number"
                          min={1}
                          max={90}
                          value={formTrialDays}
                          onChange={(e) => setFormTrialDays(parseInt(e.target.value) || 1)}
                          className="border-teal-600/20 text-teal-900"
                        />
                      </div>

                      {/* Slot Cap */}
                      <div className="space-y-2">
                        <Label htmlFor="slotCap" className="text-teal-900 font-semibold">
                          Total Slot Cap
                        </Label>
                        <Input
                          id="slotCap"
                          type="number"
                          min={0}
                          value={formSlotCap}
                          onChange={(e) => setFormSlotCap(parseInt(e.target.value) || 0)}
                          className="border-teal-600/20 text-teal-900"
                        />
                      </div>

                      {/* Reserved Slots */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="slotsReserved" className="text-teal-900 font-semibold">
                            Reserved Slots
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-teal-600/70 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              Counted as already taken. Real claims add to this.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="slotsReserved"
                          type="number"
                          min={0}
                          value={formSlotsReserved}
                          onChange={(e) => setFormSlotsReserved(parseInt(e.target.value) || 0)}
                          className="border-teal-600/20 text-teal-900"
                        />
                        <p className="text-[11px] text-teal-900/60">Counted as already taken. Real claims add to this.</p>
                      </div>

                      {/* Live Slot Stats */}
                      <div className="bg-mint-50/60 rounded-xl p-4 border border-teal-600/20 flex flex-col justify-center">
                        <span className="text-xs font-semibold text-teal-900/70 uppercase tracking-wider mb-1">
                          Live Capacity
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-teal-900">
                            {offer ? offer.slots_taken : formSlotsReserved}
                          </span>
                          <span className="text-sm text-teal-900/60">/ {formSlotCap} taken</span>
                        </div>
                        <span className="text-xs text-teal-800 font-medium mt-1">
                          {offer ? offer.slots_left : Math.max(formSlotCap - formSlotsReserved, 0)} slots remaining
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-teal-600/10">
                      {/* Require Confirmed Email Toggle */}
                      <div className="flex items-center justify-between p-4 bg-mint-50/40 rounded-xl border border-teal-600/15">
                        <div className="space-y-0.5 pr-4">
                          <Label htmlFor="requireConfirmed" className="text-teal-900 font-semibold cursor-pointer">
                            Require Confirmed Email
                          </Label>
                          <p className="text-xs text-teal-900/60">
                            Block claims from unverified accounts until their email is confirmed.
                          </p>
                        </div>
                        <Switch
                          id="requireConfirmed"
                          checked={formRequireConfirmed}
                          onCheckedChange={setFormRequireConfirmed}
                        />
                      </div>

                      {/* Enabled Toggle */}
                      <div className="flex items-center justify-between p-4 bg-mint-50/40 rounded-xl border border-teal-600/15">
                        <div className="space-y-0.5 pr-4">
                          <Label htmlFor="enabledToggle" className="text-teal-900 font-semibold cursor-pointer">
                            Offer Status (Enabled)
                          </Label>
                          <p className="text-xs text-teal-900/60">
                            Turning ON exposes the trial claim button to public visitors.
                          </p>
                        </div>
                        <Switch
                          id="enabledToggle"
                          checked={formEnabled}
                          onCheckedChange={(checked) => {
                            setFormEnabled(checked);
                            // Turning OFF needs one click
                            if (!checked) {
                              executeSaveOffer(false);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={savingOffer}
                        className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm px-6"
                      >
                        {savingOffer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Offer Settings
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 2: Claims Management Table */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border border-teal-600/20 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-600/10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-teal-900 font-display flex items-center gap-2">
                      <Layers className="h-5 w-5 text-teal-600" />
                      Free Trial Claims ({totalClaims})
                    </CardTitle>
                    <CardDescription className="text-teal-900/70">
                      View all customer trial grants, extend active periods, or revoke claims.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-900/40" />
                      <Input
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPageOffset(0);
                        }}
                        className="pl-9 border-teal-600/20 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                {claimsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-16 text-teal-900/60">
                    No claims found matching your search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-mint-50/60">
                        <TableRow>
                          <TableHead className="font-semibold text-teal-900">User / Email</TableHead>
                          <TableHead className="font-semibold text-teal-900">Claimed At</TableHead>
                          <TableHead className="font-semibold text-teal-900">Trial Ends</TableHead>
                          <TableHead className="font-semibold text-teal-900">Status</TableHead>
                          <TableHead className="font-semibold text-teal-900 text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claims.map((claim) => {
                          const isConverted = claim.status === "converted";
                          return (
                            <TableRow key={claim.id} className="hover:bg-mint-50/30">
                              <TableCell className="font-medium text-teal-900">
                                <div>{claim.email}</div>
                                {claim.user_id && (
                                  <div className="text-[11px] font-mono text-teal-900/50">{claim.user_id}</div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-teal-900/80">
                                {new Date(claim.claimed_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-sm text-teal-900/80">
                                {new Date(claim.ends_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{getStatusBadge(claim.status)}</TableCell>
                              <TableCell className="text-right pr-6 space-x-2">
                                {/* Extend Action */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={claim.status === "converted" || claim.status === "revoked"}
                                  onClick={() => {
                                    setExtendClaim(claim);
                                    setExtendDays(7);
                                  }}
                                  className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10 h-8 text-xs"
                                >
                                  Extend
                                </Button>

                                {/* Revoke Action (Disabled on converted) */}
                                {isConverted ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled
                                          className="border-rose-200 text-rose-300 h-8 text-xs cursor-not-allowed opacity-50"
                                        >
                                          Revoke
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Converted subscriptions cannot be revoked from trial controls.
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={claim.status === "revoked"}
                                    onClick={() => setRevokeClaim(claim)}
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 h-8 text-xs"
                                  >
                                    Revoke
                                  </Button>
                                )}

                                {/* Reset Action (Testing only, disabled on converted) */}
                                {isConverted ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled
                                          className="text-slate-300 h-8 text-xs cursor-not-allowed opacity-50"
                                        >
                                          Reset
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Converted subscriptions cannot be reset.
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setResetClaim(claim);
                                      setResetConfirmEmail("");
                                    }}
                                    className="text-amber-700 hover:bg-amber-50 h-8 text-xs"
                                    title="Reset claim (testing only)"
                                  >
                                    Reset
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {totalClaims > pageSize && (
                  <div className="flex items-center justify-between p-4 border-t border-teal-600/10">
                    <span className="text-xs text-teal-900/60">
                      Showing {pageOffset + 1} to {Math.min(pageOffset + pageSize, totalClaims)} of {totalClaims}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageOffset === 0}
                        onClick={() => setPageOffset(Math.max(pageOffset - pageSize, 0))}
                        className="border-teal-600/20"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageOffset + pageSize >= totalClaims}
                        onClick={() => setPageOffset(pageOffset + pageSize)}
                        className="border-teal-600/20"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 3: Blocked Email Domains */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border border-teal-600/20 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-600/10 pb-4">
                <CardTitle className="text-xl font-bold text-teal-900 font-display flex items-center gap-2">
                  <Ban className="h-5 w-5 text-teal-600" />
                  Blocked Email Domains ({domains.length})
                </CardTitle>
                <CardDescription className="text-teal-900/70">
                  Prevent temporary or disposable email providers from claiming promotional trials.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Add domain form */}
                <form onSubmit={handleAddDomain} className="flex gap-3 max-w-md">
                  <Input
                    placeholder="e.g. tempmail.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="border-teal-600/20 text-teal-900"
                  />
                  <Button
                    type="submit"
                    disabled={isAddingDomain || !newDomain.trim()}
                    className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm shrink-0"
                  >
                    {isAddingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add Domain
                  </Button>
                </form>

                {/* Domains list */}
                {domainsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  </div>
                ) : domains.length === 0 ? (
                  <p className="text-sm text-teal-900/60">No email domains currently blocked.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {domains.map((item) => (
                      <div
                        key={item.domain}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mint-50 border border-teal-600/20 text-teal-900 text-sm font-medium"
                      >
                        <span>{item.domain}</span>
                        <button
                          type="button"
                          onClick={() => setDomainToRemove(item.domain)}
                          className="text-rose-500 hover:text-rose-700 transition-colors"
                          title={`Unblock ${item.domain}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* MODAL 1: Enable Confirmation Warning */}
        <Dialog open={showEnableConfirm} onOpenChange={setShowEnableConfirm}>
          <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-teal-900 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                Enable Public Free Trial?
              </DialogTitle>
              <DialogDescription className="text-teal-900/80 pt-2 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm font-medium">
                  Visitors will see the free-trial button on the Return Converter x CopyPaste Bot page. Do not enable
                  publicly until the CP Bot Chrome extension v1.0.5.3 is live.
                </div>
                <div className="text-xs text-teal-900/70 space-y-1">
                  <div>
                    • <strong>Trial Duration:</strong> {formTrialDays} days
                  </div>
                  <div>
                    • <strong>Slot Cap:</strong> {formSlotCap} slots (Reserved: {formSlotsReserved})
                  </div>
                  <div>
                    • <strong>Require Confirmed Email:</strong> {formRequireConfirmed ? "Yes" : "No"}
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowEnableConfirm(false)}
                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => executeSaveOffer(true)}
                disabled={savingOffer}
                className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm"
              >
                {savingOffer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Enable Trial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: Extend Claim Modal */}
        <Dialog open={!!extendClaim} onOpenChange={(open) => !open && setExtendClaim(null)}>
          <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-teal-900">Extend Trial Duration</DialogTitle>
              <DialogDescription className="text-teal-900/70">
                Add additional days to the active trial period for <strong className="text-teal-900">{extendClaim?.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <Label htmlFor="extendDays" className="text-teal-900 font-semibold">
                Days to add (1..90)
              </Label>
              <Input
                id="extendDays"
                type="number"
                min={1}
                max={90}
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                className="border-teal-600/20 text-teal-900"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setExtendClaim(null)}
                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtendSubmit}
                disabled={isExtending}
                className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm"
              >
                {isExtending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Extend Trial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: Revoke Claim Modal */}
        <Dialog open={!!revokeClaim} onOpenChange={(open) => !open && setRevokeClaim(null)}>
          <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Revoke Free Trial?
              </DialogTitle>
              <DialogDescription className="text-teal-900/70 pt-2">
                Are you sure you want to revoke the trial for <strong className="text-teal-900">{revokeClaim?.email}</strong>?
                This will mark the claim as revoked and cancel their trial subscription row immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setRevokeClaim(null)}
                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevokeSubmit}
                disabled={isRevoking}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
              >
                {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Revoke
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 4: Reset Claim (Testing only) Modal */}
        <Dialog open={!!resetClaim} onOpenChange={(open) => !open && setResetClaim(null)}>
          <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-amber-700 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                Reset Claim (Testing Only)
              </DialogTitle>
              <DialogDescription className="text-teal-900/80 pt-2 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                  <strong>Warning:</strong> This permanently deletes the claim record and any linked trial subscription row
                  so this user can test claiming again. Converted subscriptions cannot be reset.
                </div>
                <p className="text-sm text-teal-900/80">
                  To confirm, type the user's email: <strong className="text-teal-900">{resetClaim?.email}</strong>
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                placeholder="Type email to confirm"
                value={resetConfirmEmail}
                onChange={(e) => setResetConfirmEmail(e.target.value)}
                className="border-teal-600/20 text-teal-900"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setResetClaim(null);
                  setResetConfirmEmail("");
                }}
                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetSubmit}
                disabled={
                  isResetting ||
                  !resetClaim ||
                  resetConfirmEmail.trim().toLowerCase() !== resetClaim.email.trim().toLowerCase()
                }
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
              >
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 5: Remove Domain Modal */}
        <Dialog open={!!domainToRemove} onOpenChange={(open) => !open && setDomainToRemove(null)}>
          <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-teal-900">Unblock Email Domain</DialogTitle>
              <DialogDescription className="text-teal-900/70">
                Are you sure you want to remove <strong className="text-teal-900">{domainToRemove}</strong> from the blocked
                domains list? Users with emails at this domain will be able to claim trials again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setDomainToRemove(null)}
                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveDomain}
                disabled={isRemovingDomain}
                className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm"
              >
                {isRemovingDomain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Unblock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </AdminLayout>
  );
}
