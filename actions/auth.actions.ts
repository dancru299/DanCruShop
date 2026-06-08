"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  checkRateLimit,
  createRateLimiter,
  getClientIp,
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const magicLinkLimiter = createRateLimiter({ max: 5, windowMs: 60_000 });

export type MagicLinkActionResult =
  | {
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return "Ban da gui qua nhieu email dang nhap. Vui long doi it nhat 60 giay roi thu lai. Neu dung email mac dinh cua Supabase, co the can doi lau hon hoac cau hinh Custom SMTP.";
  }

  return message;
}

async function getSiteUrl() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (origin && process.env.NODE_ENV !== "production") {
    return origin.replace(/\/$/, "");
  }

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

export async function signInWithMagicLink(
  email: string
): Promise<MagicLinkActionResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIp(requestHeaders);
    const { allowed } = checkRateLimit(magicLinkLimiter, ip);

    if (!allowed) {
      return {
        error:
          "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi ít nhất 1 phút rồi thử lại.",
        ok: false,
      };
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return {
        error: "Vui long nhap email hop le.",
        ok: false,
      };
    }

    const supabase = await createClient();
    const siteUrl = await getSiteUrl();
    const emailRedirectTo = `${siteUrl}/auth/confirm?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        error: getAuthErrorMessage(error.message),
        ok: false,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Failed to send magic link", error);

    return {
      error: "Khong the gui link dang nhap luc nay. Vui long thu lai.",
      ok: false,
    };
  }
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/login");
}
