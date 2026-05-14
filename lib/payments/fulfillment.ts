import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { sendPurchaseSuccessEmail } from "@/lib/email/send-email";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  return siteUrl ? siteUrl.replace(/\/$/, "") : "http://localhost:3000";
}

function getMagicLinkUrl(hashedToken: string) {
  const url = new URL("/auth/confirm", getSiteUrl());

  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", "/dashboard");

  return url.toString();
}

export function normalizeFulfillmentEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findUserByEmail(
  supabaseAdmin: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalizedEmail = normalizeFulfillmentEmail(email);
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list users: ${error.message}`);
    }

    const foundUser = data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (foundUser) {
      return foundUser;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  throw new Error("Could not find user by email within pagination limit.");
}

async function getUserFromCustomData(
  supabaseAdmin: SupabaseClient,
  userId: string | null,
  email: string
) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return null;
  }

  if (data.user.email?.toLowerCase() !== normalizeFulfillmentEmail(email)) {
    return null;
  }

  return data.user;
}

export async function getOrCreateFulfillmentUser(
  supabaseAdmin: SupabaseClient,
  email: string,
  customUserId: string | null = null
) {
  const normalizedEmail = normalizeFulfillmentEmail(email);
  const userFromCustomData = await getUserFromCustomData(
    supabaseAdmin,
    customUserId,
    normalizedEmail
  );

  if (userFromCustomData) {
    return userFromCustomData;
  }

  const existingUser = await findUserByEmail(supabaseAdmin, normalizedEmail);

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: {
      source: "purchase_fulfillment",
    },
  });

  if (error) {
    const userAfterConflict = await findUserByEmail(
      supabaseAdmin,
      normalizedEmail
    );

    if (userAfterConflict) {
      return userAfterConflict;
    }

    throw new Error(`Could not create user for purchase: ${error.message}`);
  }

  if (!data.user) {
    throw new Error("Supabase did not return a user after createUser.");
  }

  return data.user;
}

export async function createFulfillmentMagicLink(
  supabaseAdmin: SupabaseClient,
  email: string
) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizeFulfillmentEmail(email),
    options: {
      redirectTo: `${getSiteUrl()}/dashboard`,
    },
  });

  if (error) {
    throw new Error(`Could not generate magic link: ${error.message}`);
  }

  const hashedToken = data.properties?.hashed_token;

  if (!hashedToken) {
    throw new Error("Supabase did not return a hashed token for magic link.");
  }

  return getMagicLinkUrl(hashedToken);
}

export async function sendPurchaseAccessEmail(
  supabaseAdmin: SupabaseClient,
  email: string,
  productName: string
) {
  const magicLink = await createFulfillmentMagicLink(supabaseAdmin, email);

  await sendPurchaseSuccessEmail(
    normalizeFulfillmentEmail(email),
    productName,
    magicLink
  );

  return magicLink;
}
