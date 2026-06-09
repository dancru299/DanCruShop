import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// fulfillment.ts imports the email module at load time; we never exercise the
// real Resend client here, so replace it with a no-op double.
vi.mock("@/lib/email/send-email", () => ({
  sendPurchaseSuccessEmail: vi.fn(async () => ({ id: "email-1" })),
}));

import {
  createFulfillmentMagicLink,
  getOrCreateFulfillmentUser,
  normalizeFulfillmentEmail,
} from "@/lib/payments/fulfillment";

type AdminHandlers = {
  rpc?: ReturnType<typeof vi.fn>;
  getUserById?: ReturnType<typeof vi.fn>;
  createUser?: ReturnType<typeof vi.fn>;
  generateLink?: ReturnType<typeof vi.fn>;
};

function makeAdmin(handlers: AdminHandlers = {}) {
  const admin = {
    // find_user_id_by_email is invoked through supabaseAdmin.rpc(...).
    rpc:
      handlers.rpc ?? vi.fn(async () => ({ data: null, error: null })),
    auth: {
      admin: {
        getUserById:
          handlers.getUserById ??
          vi.fn(async () => ({ data: { user: null }, error: null })),
        createUser:
          handlers.createUser ??
          vi.fn(async () => ({ data: { user: null }, error: null })),
        generateLink:
          handlers.generateLink ??
          vi.fn(async () => ({
            data: { properties: { hashed_token: "hash" } },
            error: null,
          })),
      },
    },
  };

  // The fulfillment helpers only touch supabaseAdmin.auth.admin, so a partial
  // shape cast to the SupabaseClient type is enough for these unit tests.
  return admin as unknown as Parameters<typeof getOrCreateFulfillmentUser>[0] &
    typeof admin;
}

describe("normalizeFulfillmentEmail", () => {
  it("trims surrounding whitespace and lower-cases the address", () => {
    expect(normalizeFulfillmentEmail("  Buyer@Example.COM ")).toBe(
      "buyer@example.com"
    );
  });
});

describe("getOrCreateFulfillmentUser", () => {
  it("uses the custom_data user when its email matches the order", async () => {
    const admin = makeAdmin({
      getUserById: vi.fn(async () => ({
        data: { user: { id: "u1", email: "Buyer@Example.com" } },
        error: null,
      })),
    });

    const user = await getOrCreateFulfillmentUser(admin, "buyer@example.com", "u1");

    expect(user.id).toBe("u1");
    expect(admin.auth.admin.getUserById).toHaveBeenCalledWith("u1");
    expect(admin.rpc).not.toHaveBeenCalled();
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("ignores a custom_data user whose email does not match the order", async () => {
    const admin = makeAdmin({
      getUserById: vi.fn(async (id: string) =>
        id === "u2"
          ? { data: { user: { id: "u2", email: "buyer@example.com" } }, error: null }
          : {
              data: { user: { id: "spoofed", email: "someone@else.com" } },
              error: null,
            }
      ),
      rpc: vi.fn(async () => ({ data: "u2", error: null })),
    });

    const user = await getOrCreateFulfillmentUser(admin, "buyer@example.com", "u1");

    expect(user.id).toBe("u2");
    expect(admin.rpc).toHaveBeenCalledWith("find_user_id_by_email", {
      p_email: "buyer@example.com",
    });
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("returns an existing user found by email when no custom_data id is given", async () => {
    const admin = makeAdmin({
      rpc: vi.fn(async () => ({ data: "u3", error: null })),
      getUserById: vi.fn(async () => ({
        data: { user: { id: "u3", email: "BUYER@example.com" } },
        error: null,
      })),
    });

    const user = await getOrCreateFulfillmentUser(admin, "buyer@example.com");

    expect(user.id).toBe("u3");
    expect(admin.rpc).toHaveBeenCalledWith("find_user_id_by_email", {
      p_email: "buyer@example.com",
    });
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("provisions a new user when none exists yet", async () => {
    const created = { id: "u4", email: "buyer@example.com" };
    const admin = makeAdmin({
      rpc: vi.fn(async () => ({ data: null, error: null })),
      createUser: vi.fn(async () => ({ data: { user: created }, error: null })),
    });

    const user = await getOrCreateFulfillmentUser(admin, "buyer@example.com");

    expect(user.id).toBe("u4");
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "buyer@example.com", email_confirm: true })
    );
  });

  it("recovers from a create race by re-fetching the conflicting user", async () => {
    let rpcCalls = 0;
    const admin = makeAdmin({
      rpc: vi.fn(async () => {
        rpcCalls += 1;

        return rpcCalls === 1
          ? { data: null, error: null }
          : { data: "u5", error: null };
      }),
      getUserById: vi.fn(async () => ({
        data: { user: { id: "u5", email: "buyer@example.com" } },
        error: null,
      })),
      createUser: vi.fn(async () => ({
        data: { user: null },
        error: { message: "email already registered" },
      })),
    });

    const user = await getOrCreateFulfillmentUser(admin, "buyer@example.com");

    expect(user.id).toBe("u5");
    expect(admin.rpc).toHaveBeenCalledTimes(2);
  });
});

describe("createFulfillmentMagicLink", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com";
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it("builds a confirm URL carrying the hashed token from Supabase", async () => {
    const admin = makeAdmin({
      generateLink: vi.fn(async () => ({
        data: { properties: { hashed_token: "abc123" } },
        error: null,
      })),
    });

    const link = await createFulfillmentMagicLink(admin, "buyer@example.com");

    expect(link).toContain("https://shop.example.com/auth/confirm");
    expect(link).toContain("token_hash=abc123");
    expect(link).toContain("type=magiclink");
  });

  it("throws when Supabase does not return a hashed token", async () => {
    const admin = makeAdmin({
      generateLink: vi.fn(async () => ({
        data: { properties: {} },
        error: null,
      })),
    });

    await expect(
      createFulfillmentMagicLink(admin, "buyer@example.com")
    ).rejects.toThrow(/hashed token/);
  });
});
