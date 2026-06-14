import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export type VerificationPurpose = "signup" | "password_reset";

// 6-digit numeric code, ~10 minute lifetime, max 5 verify attempts per code.
const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" };

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function generateCode() {
  // randomInt is cryptographically secure; pad to keep leading zeros.
  return randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, "0");
}

/**
 * Creates a fresh code for the email/purpose and returns the plaintext so the
 * caller can email it. Any earlier unconsumed code for the same pair is removed
 * so only the newest one is valid.
 */
export async function createVerificationCode(
  email: string,
  purpose: VerificationPurpose
): Promise<string> {
  const supabase = createAdminClient();
  const code = generateCode();

  await supabase
    .from("email_verification_codes")
    .delete()
    .eq("email", email)
    .eq("purpose", purpose);

  const { error } = await supabase.from("email_verification_codes").insert({
    email,
    code_hash: hashCode(code),
    purpose,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  if (error) {
    console.error("Failed to store verification code", { error, purpose });
    throw new Error("Could not create verification code.");
  }

  return code;
}

/**
 * Verifies a submitted code against the latest active row, enforcing expiry and
 * attempt limits. Consumes the code on success.
 */
export async function verifyCode(
  email: string,
  purpose: VerificationPurpose,
  code: string
): Promise<VerifyCodeResult> {
  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from("email_verification_codes")
    .select("id, code_hash, expires_at, attempts, consumed_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to read verification code", { error, purpose });
    throw new Error("Could not verify code.");
  }

  if (!row) {
    return { ok: false, reason: "invalid" };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const matches = safeEqualHex(row.code_hash, hashCode(code));

  if (!matches) {
    await supabase
      .from("email_verification_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);

    return { ok: false, reason: "invalid" };
  }

  await supabase
    .from("email_verification_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);

  return { ok: true };
}
