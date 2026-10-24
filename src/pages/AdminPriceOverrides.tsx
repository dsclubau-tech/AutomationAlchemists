import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Tag,
  AlertTriangle,
  Plus,
  Loader2,
  Calendar,
  Info,
  DollarSign,
  Percent,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  adminPriceOverridesList,
  adminPriceOverrideCreate,
  adminPriceOverrideRevoke,
  type PriceOverrideAdmin,
} from "@/lib/adminTrial";

interface ToolOption {
  slug: string;
  name: string;
  price_monthly: number;
}

export default function AdminPriceOverrides() {
  const { toast } = useToast();

  const [missingMigration, setMissingMigration] = useState(false);
  const [loadingOverrides, setLoadingOverrides] = useState(true);
  const [overrides, setOverrides] = useState<PriceOverrideAdmin[]>([]);
  const [tools, setTools] = useState<ToolOption[]>([]);

  // Create Form State
  const [targetEmail, setTargetEmail] = useState("");
  const [selectedToolSlug, setSelectedToolSlug] = useState("rccp");
  const [kind, setKind] = useState<"fixed_price" | "percent_off">("fixed_price");
  const [amountDollars, setAmountDollars] = useState<string>("5.00");
  const [percentOff, setPercentOff] = useState<string>("20");
  const [endsAtDate, setEndsAtDate] = useState("");
  const [note, setNote] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Revoke Modal State
  const [overrideToRevoke, setOverrideToRevoke] = useState<PriceOverrideAdmin | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // 1. Fetch available tools for pricing catalog
  const fetchTools = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tools")
        .select("slug, name, price_monthly")
        .order("name", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setTools(data);
        if (!selectedToolSlug && data[0]) {
          setSelectedToolSlug(data[0].slug);
        }
      }
    } catch (err: any) {
      console.error("Error fetching tools:", err);
    }
  }, [selectedToolSlug]);

  // 2. Fetch Overrides
  const fetchOverrides = useCallback(async () => {
    setLoadingOverrides(true);
    const res = await adminPriceOverridesList();
    if (res.isMissingMigration) {
      setMissingMigration(true);
      setLoadingOverrides(false);
      return;
    }
    if (res.ok && res.data) {
      setOverrides(res.data);
    } else {
      toast({
        title: "Error loading price overrides",
        description: res.error || "Could not fetch overrides",
        variant: "destructive",
      });
    }
    setLoadingOverrides(false);
  }, [toast]);

  useEffect(() => {
    fetchTools();
    fetchOverrides();
  }, [fetchTools, fetchOverrides]);

  // Computed selected tool normal price
  const currentTool = tools.find((t) => t.slug === selectedToolSlug) || {
    slug: "rccp",
    name: "Return Converter x CopyPaste Bot",
    price_monthly: 9,
  };
  const normalPrice = currentTool.price_monthly;

  // Compute live preview price
  let previewUserPrice = normalPrice;
  if (kind === "fixed_price") {
    const val = parseFloat(amountDollars);
    previewUserPrice = isNaN(val) ? normalPrice : val;
  } else {
    const pct = parseFloat(percentOff);
    if (!isNaN(pct)) {
      previewUserPrice = Math.max(0, normalPrice * (1 - pct / 100));
    }
  }

  // Create Form Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      toast({ title: "Email required", description: "Please enter a user email address.", variant: "destructive" });
      return;
    }

    let amountCents: number | null = null;
    let numericPercent: number | null = null;

    if (kind === "fixed_price") {
      const val = parseFloat(amountDollars);
      if (isNaN(val) || val < 0.5) {
        toast({
          title: "Invalid Amount",
          description: "Fixed price amount must be at least A$0.50.",
          variant: "destructive",
        });
        return;
      }
      amountCents = Math.round(val * 100);
    } else {
      const pct = parseFloat(percentOff);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        toast({
          title: "Invalid Percentage",
          description: "Percentage off must be between 1% and 100%.",
          variant: "destructive",
        });
        return;
      }
      numericPercent = pct;
    }

    const isoEndsAt = endsAtDate ? new Date(endsAtDate).toISOString() : null;

    setIsCreating(true);
    const res = await adminPriceOverrideCreate({
      userEmail: targetEmail.trim(),
      toolSlug: selectedToolSlug,
      kind,
      amountCents,
      percentOff: numericPercent,
      endsAt: isoEndsAt,
      note: note.trim() || null,
    });

    if (res.ok) {
      toast({
        title: "Price Override Created",
        description: `Successfully granted custom price for ${targetEmail}.`,
      });
      setTargetEmail("");
      setNote("");
      setEndsAtDate("");
      fetchOverrides();
    } else {
      toast({
        title: "Failed to create override",
        description: res.message || res.error || "Validation error",
        variant: "destructive",
      });
    }
    setIsCreating(false);
  };

  // Revoke Handler
  const handleRevokeSubmit = async () => {
    if (!overrideToRevoke) return;
    setIsRevoking(true);
    const res = await adminPriceOverrideRevoke(overrideToRevoke.id);
    if (res.ok) {
      toast({
        title: "Override Revoked",
        description: `Price override for ${overrideToRevoke.email} has been revoked.`,
      });
      setOverrideToRevoke(null);
      fetchOverrides();
    } else {
      toast({
        title: "Failed to revoke override",
        description: res.message || res.error,
        variant: "destructive",
      });
    }
    setIsRevoking(false);
  };

  return (
    <AdminLayout
      title="Price Overrides"
      description="Create and manage customer-specific subscription discounts and fixed-price agreements"
    >
      <div className="space-y-8">
        {/* Missing Migration Notice */}
        {missingMigration && (
          <Card className="border-amber-300 bg-amber-50 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-900 font-display">Not set up yet: apply migration 033</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Database functions for price override controls are not yet present. Apply{" "}
                  <code className="bg-amber-200/60 px-1 py-0.5 rounded text-amber-900 font-mono text-xs">
                    supabase/migrations/033_admin_trial_controls.sql
                  </code>{" "}
                  to activate.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Global Pricing Hint & Inline Policy Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-teal-600/20 shadow-sm text-sm">
          <div className="flex items-center gap-2 text-teal-900">
            <Info className="h-4 w-4 text-teal-600 shrink-0" />
            <span>
              To change the standard price for everyone, edit it in the{" "}
              <Link to="/admin/tools" className="font-semibold text-teal-600 hover:text-teal-800 underline inline-flex items-center gap-0.5">
                Tools catalog <ExternalLink className="h-3 w-3 inline" />
              </Link>
              .
            </span>
          </div>
          <div className="text-xs font-medium text-teal-900/70 bg-mint-50 px-3 py-1.5 rounded-lg border border-teal-600/10">
            Applies to NEW checkouts only; existing subscriptions are not changed.
          </div>
        </div>

        {/* Create Override Form */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border border-teal-600/20 bg-white shadow-sm">
            <CardHeader className="border-b border-teal-600/10 pb-4">
              <CardTitle className="text-xl font-bold text-teal-900 font-display flex items-center gap-2">
                <Tag className="h-5 w-5 text-teal-600" />
                Grant Custom Price Override
              </CardTitle>
              <CardDescription className="text-teal-900/70">
                Specify a customer email and custom pricing rule. When this customer initiates checkout, this price will be billed.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* User Email */}
                  <div className="space-y-2">
                    <Label htmlFor="targetEmail" className="text-teal-900 font-semibold">
                      Customer Email
                    </Label>
                    <Input
                      id="targetEmail"
                      type="email"
                      placeholder="user@example.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      required
                      className="border-teal-600/20 text-teal-900"
                    />
                    <p className="text-[11px] text-teal-900/60">Must match an existing registered account in auth.users.</p>
                  </div>

                  {/* Tool Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="toolSelect" className="text-teal-900 font-semibold">
                      Tool Product
                    </Label>
                    <Select value={selectedToolSlug} onValueChange={setSelectedToolSlug}>
                      <SelectTrigger id="toolSelect" className="border-teal-600/20 text-teal-900 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
                        {tools.map((t) => (
                          <SelectItem key={t.slug} value={t.slug}>
                            {t.name} (A${t.price_monthly.toFixed(2)}/mo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount Kind */}
                  <div className="space-y-2">
                    <Label htmlFor="kindSelect" className="text-teal-900 font-semibold">
                      Discount Type
                    </Label>
                    <Select
                      value={kind}
                      onValueChange={(v: "fixed_price" | "percent_off") => setKind(v)}
                    >
                      <SelectTrigger id="kindSelect" className="border-teal-600/20 text-teal-900 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
                        <SelectItem value="fixed_price">Fixed Price (A$)</SelectItem>
                        <SelectItem value="percent_off">Percentage Off (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value input (Fixed or Percent) */}
                  <div className="space-y-2">
                    <Label htmlFor="valueInput" className="text-teal-900 font-semibold">
                      {kind === "fixed_price" ? "Fixed Price (AUD $)" : "Percentage Off (%)"}
                    </Label>
                    {kind === "fixed_price" ? (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-900/50" />
                        <Input
                          id="valueInput"
                          type="number"
                          step="0.01"
                          min="0.50"
                          value={amountDollars}
                          onChange={(e) => setAmountDollars(e.target.value)}
                          className="pl-9 border-teal-600/20 text-teal-900"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-900/50" />
                        <Input
                          id="valueInput"
                          type="number"
                          min="1"
                          max="100"
                          value={percentOff}
                          onChange={(e) => setPercentOff(e.target.value)}
                          className="pl-9 border-teal-600/20 text-teal-900"
                        />
                      </div>
                    )}
                  </div>

                  {/* Optional End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-teal-900 font-semibold">
                      Expiration Date (Optional)
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endsAtDate}
                      onChange={(e) => setEndsAtDate(e.target.value)}
                      className="border-teal-600/20 text-teal-900"
                    />
                    <p className="text-[11px] text-teal-900/60">Leave empty for an indefinite ongoing override.</p>
                  </div>

                  {/* Live Pricing Preview Box */}
                  <div className="bg-mint-50/80 rounded-xl p-4 border border-teal-600/25 flex flex-col justify-center">
                    <span className="text-xs font-semibold text-teal-900/70 uppercase tracking-wider mb-1">
                      Checkout Price Preview
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs line-through text-teal-900/50">
                        Normal A${normalPrice.toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-teal-900">
                        → This user A${previewUserPrice.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[11px] text-teal-700 font-medium mt-1">
                      {kind === "percent_off" ? `${percentOff}% discount off catalog price` : "Fixed override price"}
                    </span>
                  </div>
                </div>

                {/* Reason / Internal Note */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-teal-900 font-semibold">
                    Internal Note / Reason
                  </Label>
                  <Input
                    id="note"
                    placeholder="e.g. Beta tester partner rate or high-volume enterprise discount"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="border-teal-600/20 text-teal-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm px-6"
                  >
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Create Price Override
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overrides Table */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="border border-teal-600/20 bg-white shadow-sm">
            <CardHeader className="border-b border-teal-600/10 pb-4">
              <CardTitle className="text-xl font-bold text-teal-900 font-display">
                Active & Past Overrides ({overrides.length})
              </CardTitle>
              <CardDescription className="text-teal-900/70">
                All customer price override records across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingOverrides ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : overrides.length === 0 ? (
                <div className="text-center py-16 text-teal-900/60">
                  No price overrides created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-mint-50/60">
                      <TableRow>
                        <TableHead className="font-semibold text-teal-900">Email</TableHead>
                        <TableHead className="font-semibold text-teal-900">Tool</TableHead>
                        <TableHead className="font-semibold text-teal-900">Discount</TableHead>
                        <TableHead className="font-semibold text-teal-900">Starts</TableHead>
                        <TableHead className="font-semibold text-teal-900">Ends</TableHead>
                        <TableHead className="font-semibold text-teal-900">Status</TableHead>
                        <TableHead className="font-semibold text-teal-900">Note</TableHead>
                        <TableHead className="font-semibold text-teal-900 text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overrides.map((item) => {
                        const isRevoked = !!item.revoked_at;
                        const isExpired = !isRevoked && item.ends_at && new Date(item.ends_at) <= new Date();
                        const isActive = item.is_active;

                        return (
                          <TableRow key={item.id} className="hover:bg-mint-50/30">
                            <TableCell className="font-medium text-teal-900">{item.email}</TableCell>
                            <TableCell className="text-sm font-mono text-teal-900/80">{item.tool_slug}</TableCell>
                            <TableCell className="text-sm font-semibold text-teal-900">
                              {item.kind === "fixed_price"
                                ? `A$${((item.amount_cents || 0) / 100).toFixed(2)}`
                                : `${item.percent_off}% off`}
                            </TableCell>
                            <TableCell className="text-xs text-teal-900/70">
                              {new Date(item.starts_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs text-teal-900/70">
                              {item.ends_at ? new Date(item.ends_at).toLocaleDateString() : "Indefinite"}
                            </TableCell>
                            <TableCell>
                              {isActive ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300">Active</Badge>
                              ) : isRevoked ? (
                                <Badge className="bg-rose-500/15 text-rose-700 border-rose-300">Revoked</Badge>
                              ) : (
                                <Badge className="bg-amber-500/15 text-amber-700 border-amber-300">Expired</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-teal-900/70 max-w-xs truncate">
                              {item.note || "—"}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {isActive ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setOverrideToRevoke(item)}
                                  className="border-rose-300 text-rose-700 hover:bg-rose-50 h-8 text-xs"
                                >
                                  Revoke
                                </Button>
                              ) : (
                                <span className="text-xs text-teal-900/40">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revoke Confirmation Modal */}
      <Dialog open={!!overrideToRevoke} onOpenChange={(open) => !open && setOverrideToRevoke(null)}>
        <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Revoke Price Override?
            </DialogTitle>
            <DialogDescription className="text-teal-900/70 pt-2">
              Are you sure you want to revoke the custom price override for{" "}
              <strong className="text-teal-900">{overrideToRevoke?.email}</strong> on{" "}
              <strong className="text-teal-900">{overrideToRevoke?.tool_slug}</strong>? Subsequent checkouts will be
              charged standard catalog pricing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOverrideToRevoke(null)}
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
    </AdminLayout>
  );
}
