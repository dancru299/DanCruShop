"use server";

import { headers } from "next/headers";
import { nanoid } from "nanoid";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

type ClaimResult =
  | { ok: true; code: string; expiresAt: string }
  | {
      ok: false;
      reason: "rate_limited" | "not_authenticated" | "already_claimed" | "budget_exhausted";
    };

/**
 * Easter egg: `sudo discount` — generates a single-use 10% off coupon
 * protected by rate-limit, one-per-user, and budget cap.
 *
 * Uses admin client (service role) for DB writes so RLS on coupons and
 * easter_egg_claims is bypassed — regular users can claim successfully.
 */
export async function claimDevDiscount(): Promise<ClaimResult> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    // 1. Rate limit: max 3 attempts per IP per day
    const { allowed } = await enforceRateLimit(`easter-egg:${ip}`, {
      max: 3,
      windowMs: 86400_000, // 24 hours
    });

    if (!allowed) {
      return { ok: false, reason: "rate_limited" };
    }

    // 2. Check authenticated user (user-scoped client for auth only)
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return { ok: false, reason: "not_authenticated" };
    }

    // 3–6 use admin client (service role) to bypass RLS
    const admin = createAdminClient();

    // 3. One-per-user: check existing claims
    const { data: existing } = await admin
      .from("easter_egg_claims")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return { ok: false, reason: "already_claimed" };
    }

    // 4. Budget cap (max 50 total claims)
    const { count } = await admin
      .from("easter_egg_claims")
      .select("id", { count: "exact", head: true });

    if (count !== null && count >= 50) {
      return { ok: false, reason: "budget_exhausted" };
    }

    // 5. Create single-use 10% coupon (admin bypasses RLS)
    const code = `DEVMODE-${nanoid(6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { error: couponError } = await admin.from("coupons").insert({
      code,
      discount_type: "percent",
      discount_value: 10,
      max_redemptions: 1,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_active: true,
    });

    if (couponError) {
      console.error("Failed to create easter-egg coupon", couponError);
      return { ok: false, reason: "budget_exhausted" };
    }

    // 6. Record claim
    const { error: claimError } = await admin.from("easter_egg_claims").insert({
      user_id: user.id,
      code,
      ip,
    });

    if (claimError) {
      console.error("Failed to record easter-egg claim", claimError);
      // Coupon was created but claim wasn't logged — still return ok
      // so the user gets their code. The unique constraint on user_id
      // will block duplicate claims on retry.
    }

    return { ok: true, code, expiresAt };
  } catch (error) {
    console.error("Unexpected error in claimDevDiscount", error);
    return { ok: false, reason: "budget_exhausted" };
  }
}