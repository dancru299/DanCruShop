"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sendVerificationCodeEmail } from "@/lib/email/send-email";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  createVerificationCode,
  verifyCode,
  type VerificationPurpose,
} from "@/lib/auth/verification-code";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

const RATE_LIMITED_MESSAGE =
  "You've sent too many requests. Please wait at least 1 minute and try again.";

const VERIFY_ERROR_MESSAGE: Record<
  Exclude<Awaited<ReturnType<typeof verifyCode>>, { ok: true }>["reason"],
  string
> = {
  invalid: "Incorrect code. Please check and try again.",
  expired: "The code has expired. Please request a new one.",
  too_many_attempts:
    "Too many incorrect attempts. Please request a new code.",
};

async function rateLimit(scope: string): Promise<boolean> {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const { allowed } = await enforceRateLimit(`${scope}:${ip}`, {
    max: 5,
    windowMs: 60_000,
  });

  return allowed;
}

type ExistingUser = { id: string; confirmed: boolean };

async function findExistingUser(email: string): Promise<ExistingUser | null> {
  const admin = createAdminClient();
  const { data: userId, error } = await admin.rpc("find_user_id_by_email", {
    p_email: email,
  });

  if (error) {
    console.error("Failed to resolve user by email", error);
    throw new Error("Could not look up account.");
  }

  if (!userId) {
    return null;
  }

  const { data, error: userError } = await admin.auth.admin.getUserById(
    userId as string
  );

  if (userError || !data.user) {
    return null;
  }

  return { id: data.user.id, confirmed: Boolean(data.user.email_confirmed_at) };
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<AuthActionResult> {
  try {
    if (!(await rateLimit("signup"))) {
      return { ok: false, error: RATE_LIMITED_MESSAGE };
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return { ok: false, error: "Please enter a valid email." };
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    const admin = createAdminClient();
    const existing = await findExistingUser(normalizedEmail);

    if (existing?.confirmed) {
      return {
        ok: false,
        error: "This email is already registered. Please log in.",
      };
    }

    if (existing) {
      // Unconfirmed account: refresh the password so the newest attempt wins.
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
      });

      if (error) {
        console.error("Failed to update pending signup password", error);
        return { ok: false, error: "Couldn't sign up right now. Please try again." };
      }
    } else {
      const { error } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
      });

      if (error) {
        console.error("Failed to create user", error);
        return { ok: false, error: "Couldn't sign up right now. Please try again." };
      }
    }

    const code = await createVerificationCode(normalizedEmail, "signup");
    await sendVerificationCodeEmail(normalizedEmail, code, "signup");

    return { ok: true };
  } catch (error) {
    console.error("Sign up failed", error);
    return { ok: false, error: "Couldn't sign up right now. Please try again." };
  }
}

export async function verifySignupCode(
  email: string,
  code: string
): Promise<AuthActionResult> {
  try {
    if (!(await rateLimit("verify-signup"))) {
      return { ok: false, error: RATE_LIMITED_MESSAGE };
    }

    const normalizedEmail = normalizeEmail(email);
    const result = await verifyCode(normalizedEmail, "signup", code.trim());

    if (!result.ok) {
      return { ok: false, error: VERIFY_ERROR_MESSAGE[result.reason] };
    }

    const existing = await findExistingUser(normalizedEmail);

    if (!existing) {
      return { ok: false, error: "Account not found. Please sign up again." };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
    });

    if (error) {
      console.error("Failed to confirm user", error);
      return { ok: false, error: "Couldn't activate the account. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Verify signup code failed", error);
    return { ok: false, error: "Couldn't activate the account. Please try again." };
  }
}

export async function requestPasswordReset(
  email: string
): Promise<AuthActionResult> {
  // Always return ok to avoid leaking which emails have accounts.
  try {
    if (!(await rateLimit("password-reset"))) {
      return { ok: false, error: RATE_LIMITED_MESSAGE };
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return { ok: false, error: "Please enter a valid email." };
    }

    const existing = await findExistingUser(normalizedEmail);

    if (existing?.confirmed) {
      const code = await createVerificationCode(
        normalizedEmail,
        "password_reset"
      );
      await sendVerificationCodeEmail(normalizedEmail, code, "password_reset");
    }

    return { ok: true };
  } catch (error) {
    console.error("Request password reset failed", error);
    // Still report success so the response is identical regardless of account state.
    return { ok: true };
  }
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): Promise<AuthActionResult> {
  try {
    if (!(await rateLimit("reset-verify"))) {
      return { ok: false, error: RATE_LIMITED_MESSAGE };
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    const normalizedEmail = normalizeEmail(email);
    const result = await verifyCode(
      normalizedEmail,
      "password_reset",
      code.trim()
    );

    if (!result.ok) {
      return { ok: false, error: VERIFY_ERROR_MESSAGE[result.reason] };
    }

    const existing = await findExistingUser(normalizedEmail);

    if (!existing) {
      return { ok: false, error: "Account not found." };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: newPassword,
    });

    if (error) {
      console.error("Failed to reset password", error);
      return { ok: false, error: "Couldn't reset the password. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Reset password failed", error);
    return { ok: false, error: "Couldn't reset the password. Please try again." };
  }
}

export async function resendCode(
  email: string,
  purpose: VerificationPurpose
): Promise<AuthActionResult> {
  if (purpose === "password_reset") {
    return requestPasswordReset(email);
  }

  try {
    if (!(await rateLimit("resend-signup"))) {
      return { ok: false, error: RATE_LIMITED_MESSAGE };
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await findExistingUser(normalizedEmail);

    if (!existing) {
      return { ok: false, error: "Account not found. Please sign up again." };
    }

    if (existing.confirmed) {
      return { ok: false, error: "This account is already activated. Please log in." };
    }

    const code = await createVerificationCode(normalizedEmail, "signup");
    await sendVerificationCodeEmail(normalizedEmail, code, "signup");

    return { ok: true };
  } catch (error) {
    console.error("Resend signup code failed", error);
    return { ok: false, error: "Couldn't resend the code. Please try again." };
  }
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/login");
}
