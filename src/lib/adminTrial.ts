import { supabase } from "@/integrations/supabase/client";

export interface TrialOfferAdmin {
  tool_slug: string;
  access_slug: string;
  enabled: boolean;
  trial_days: number;
  slot_cap: number;
  slots_reserved: number;
  require_confirmed_email: boolean;
  updated_at: string;
  updated_by: string | null;
  claims_count: number;
  slots_taken: number;
  slots_left: number;
}

export interface TrialClaimAdmin {
  id: string;
  tool_slug: string;
  user_id: string | null;
  email: string;
  email_normalized: string;
  claimed_at: string;
  ends_at: string;
  converted_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  subscription_id: string | null;
  is_trial: boolean;
  status: "active" | "expired" | "converted" | "revoked";
}

export interface BlockedDomainAdmin {
  domain: string;
  created_at: string;
}

export interface PriceOverrideAdmin {
  id: string;
  user_id: string;
  email: string;
  tool_slug: string;
  kind: "fixed_price" | "percent_off";
  amount_cents: number | null;
  percent_off: number | null;
  currency: string;
  starts_at: string;
  ends_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
  is_active: boolean;
}

export interface RpcResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  isMissingMigration?: boolean;
}

export function isMigrationMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : (error.message || "");
  const code = error.code || "";
  return (
    code === "PGRST202" ||
    code === "42883" ||
    msg.toLowerCase().includes("could not find the function") ||
    msg.toLowerCase().includes("does not exist")
  );
}

// 1. Get Offer
export async function adminTrialGetOffer(toolSlug: string = "rccp"): Promise<RpcResult<TrialOfferAdmin>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_trial_get_offer", {
      p_tool_slug: toolSlug,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to load offer", message: data?.message };
    }
    return { ok: true, data: data.offer };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 2. Update Offer
export async function adminTrialUpdateOffer(params: {
  toolSlug: string;
  enabled: boolean;
  trialDays: number;
  slotCap: number;
  slotsReserved: number;
  requireConfirmedEmail: boolean;
}): Promise<RpcResult<TrialOfferAdmin>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_trial_update_offer", {
      p_tool_slug: params.toolSlug,
      p_enabled: params.enabled,
      p_trial_days: params.trialDays,
      p_slot_cap: params.slotCap,
      p_slots_reserved: params.slotsReserved,
      p_require_confirmed_email: params.requireConfirmedEmail,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to update offer", message: data?.message };
    }
    return { ok: true, data: data.offer };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 3. List Claims
export async function adminTrialListClaims(params: {
  toolSlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<RpcResult<{ claims: TrialClaimAdmin[]; total_count: number; limit: number; offset: number }>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_trial_list_claims", {
      p_tool_slug: params.toolSlug || "rccp",
      p_search: params.search?.trim() || null,
      p_limit: params.limit || 50,
      p_offset: params.offset || 0,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to list claims", message: data?.message };
    }
    return {
      ok: true,
      data: {
        claims: data.claims || [],
        total_count: data.total_count || 0,
        limit: data.limit || 50,
        offset: data.offset || 0,
      },
    };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 4. Extend Claim
export async function adminTrialExtend(claimId: string, days: number): Promise<RpcResult<{ new_ends_at: string }>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_trial_extend", {
      p_claim_id: claimId,
      p_days: days,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to extend claim", message: data?.message };
    }
    return { ok: true, data: { new_ends_at: data.new_ends_at } };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 5. Revoke Claim
export async function adminTrialRevoke(claimId: string): Promise<RpcResult<void>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_trial_revoke", {
      p_claim_id: claimId,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to revoke claim", message: data?.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 6. Reset Claim (Testing only)
export async function adminTrialResetClaim(claimId: string): Promise<RpcResult<void>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_trial_reset_claim", {
      p_claim_id: claimId,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to reset claim", message: data?.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 7. List Blocked Domains
export async function adminBlockedDomainsList(): Promise<RpcResult<BlockedDomainAdmin[]>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_blocked_domains_list");
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to list blocked domains", message: data?.message };
    }
    return { ok: true, data: data.domains || [] };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 8. Add Blocked Domain
export async function adminBlockedDomainAdd(domain: string): Promise<RpcResult<string>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_blocked_domain_add", {
      p_domain: domain,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to add domain", message: data?.message };
    }
    return { ok: true, data: data.domain };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 9. Remove Blocked Domain
export async function adminBlockedDomainRemove(domain: string): Promise<RpcResult<string>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_blocked_domain_remove", {
      p_domain: domain,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to remove domain", message: data?.message };
    }
    return { ok: true, data: data.domain };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 10. List Price Overrides
export async function adminPriceOverridesList(toolSlug?: string): Promise<RpcResult<PriceOverrideAdmin[]>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_price_overrides_list", {
      p_tool_slug: toolSlug?.trim() || null,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to list price overrides", message: data?.message };
    }
    return { ok: true, data: data.overrides || [] };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 11. Create Price Override
export async function adminPriceOverrideCreate(params: {
  userEmail: string;
  toolSlug: string;
  kind: "fixed_price" | "percent_off";
  amountCents?: number | null;
  percentOff?: number | null;
  endsAt?: string | null;
  note?: string | null;
}): Promise<RpcResult<{ override_id: string }>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_price_override_create", {
      p_user_email: params.userEmail,
      p_tool_slug: params.toolSlug,
      p_kind: params.kind,
      p_amount_cents: params.amountCents ?? null,
      p_percent_off: params.percentOff ?? null,
      p_ends_at: params.endsAt ?? null,
      p_note: params.note?.trim() || null,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to create price override", message: data?.message };
    }
    return { ok: true, data: { override_id: data.override_id } };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}

// 12. Revoke Price Override
export async function adminPriceOverrideRevoke(overrideId: string): Promise<RpcResult<void>> {
  try {
    const { data, error } = await (supabase.rpc as any)("admin_price_override_revoke", {
      p_override_id: overrideId,
    });
    if (error) {
      return { ok: false, error: error.message, isMissingMigration: isMigrationMissingError(error) };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || "Failed to revoke override", message: data?.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message, isMissingMigration: isMigrationMissingError(err) };
  }
}
