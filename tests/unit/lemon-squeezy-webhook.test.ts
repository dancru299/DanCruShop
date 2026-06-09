/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Initialised before the hoisted vi.mock factory runs.
const { mockAdmin } = vi.hoisted(() => ({
  mockAdmin: { from: vi.fn(), rpc: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

// Replace the side-effectful fulfillment helpers (user creation + email) but
// keep a faithful normalizeFulfillmentEmail so order extraction behaves as in
// production.
vi.mock("@/lib/payments/fulfillment", () => ({
  normalizeFulfillmentEmail: (email: string) => email.trim().toLowerCase(),
  getOrCreateFulfillmentUser: vi.fn(async () => ({
    id: "user-1",
    email: "buyer@example.com",
  })),
  sendPurchaseAccessEmail: vi.fn(async () => "https://magic.link"),
}));

import * as fulfillment from "@/lib/payments/fulfillment";
import {
  processOrderCreatedEvent,
  processOrderRefundedEvent,
} from "@/lib/payments/lemon-squeezy-webhook";

type QueryResult = { data?: unknown; error: unknown };

/**
 * Builds a chainable Supabase admin double. Each table has a FIFO queue of
 * results; every terminal call (`.single()`, `.maybeSingle()`, or awaiting the
 * builder directly) dequeues the next result for that table, so the test can
 * assert the exact sequence of writes the handler performs.
 */
function primeAdmin(resultsByTable: Record<string, QueryResult[]>) {
  const chainMethods = [
    "select",
    "eq",
    "neq",
    "in",
    "order",
    "limit",
    "update",
    "delete",
    "insert",
    "upsert",
  ];

  mockAdmin.from.mockImplementation((table: string) => {
    const ops: string[] = [];

    const nextResult = (): QueryResult => {
      const queue = resultsByTable[table];

      if (!queue || queue.length === 0) {
        throw new Error(
          `No queued Supabase result for "${table}" (ops: ${ops.join(" -> ")})`
        );
      }

      return queue.shift() as QueryResult;
    };

    const builder: any = {};

    for (const method of chainMethods) {
      builder[method] = vi.fn((...args: unknown[]) => {
        ops.push(`${method}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`);
        return builder;
      });
    }

    builder.single = vi.fn(async () => nextResult());
    builder.maybeSingle = vi.fn(async () => nextResult());
    builder.then = (onFulfilled: any, onRejected: any) =>
      Promise.resolve().then(nextResult).then(onFulfilled, onRejected);

    return builder;
  });
}

const orderCreatedPayload = {
  meta: { event_name: "order_created", custom_data: {} },
  data: {
    id: "12345",
    type: "orders",
    attributes: {
      user_email: "Buyer@Example.com",
      total: 1900,
      currency: "usd",
      first_order_item: {
        variant_id: 999,
        price: 1900,
        quantity: 1,
      },
    },
  },
};

const orderRefundedPayload = {
  meta: { event_name: "order_refunded" },
  data: { id: "12345", type: "orders", attributes: {} },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processOrderCreatedEvent", () => {
  it("maps the order, unlocks the purchase atomically, and emails access", async () => {
    primeAdmin({
      products: [
        {
          data: {
            id: "prod-1",
            title: "Test Product",
            slug: "test-product",
            lemon_squeezy_variant_id: "999",
            price_cents: 1900,
          },
          error: null,
        },
      ],
    });
    mockAdmin.rpc.mockResolvedValue({ data: "order-1", error: null });

    const result = await processOrderCreatedEvent(orderCreatedPayload);

    expect(result).toEqual({
      orderId: "order-1",
      productId: "prod-1",
      productIds: ["prod-1"],
      userId: "user-1",
    });
    expect(mockAdmin.rpc).toHaveBeenCalledWith(
      "fulfill_paid_order",
      expect.objectContaining({
        p_provider_order_id: "12345",
        p_email: "buyer@example.com",
        p_currency: "USD",
        p_total_cents: 1900,
        p_user_id: "user-1",
        p_items: [{ product_id: "prod-1", price_cents: 1900, quantity: 1 }],
      })
    );
    expect(fulfillment.getOrCreateFulfillmentUser).toHaveBeenCalledWith(
      mockAdmin,
      "buyer@example.com",
      null
    );
    expect(fulfillment.sendPurchaseAccessEmail).toHaveBeenCalledWith(
      mockAdmin,
      "buyer@example.com",
      "Test Product"
    );
  });

  it("fails loudly without fulfilling when the variant maps to no product", async () => {
    primeAdmin({
      products: [{ data: null, error: null }],
    });

    await expect(processOrderCreatedEvent(orderCreatedPayload)).rejects.toThrow(
      /No product found for Lemon Squeezy variant 999/
    );
    expect(mockAdmin.rpc).not.toHaveBeenCalled();
    expect(fulfillment.sendPurchaseAccessEmail).not.toHaveBeenCalled();
  });
});

describe("processOrderRefundedEvent", () => {
  it("revokes purchases and marks the order refunded", async () => {
    primeAdmin({
      orders: [
        { data: { id: "order-1", status: "paid" }, error: null },
        { error: null },
      ],
      purchases: [{ data: [{ id: "p1" }, { id: "p2" }], error: null }],
    });

    const result = await processOrderRefundedEvent(orderRefundedPayload);

    expect(result).toEqual({
      alreadyRefunded: false,
      orderId: "order-1",
      revokedPurchaseIds: ["p1", "p2"],
    });
  });

  it("is idempotent for an already-refunded order", async () => {
    primeAdmin({
      // Only one queued orders result: markOrderRefunded must NOT run again.
      orders: [{ data: { id: "order-2", status: "refunded" }, error: null }],
      purchases: [{ data: [], error: null }],
    });

    const result = await processOrderRefundedEvent(orderRefundedPayload);

    expect(result).toEqual({
      alreadyRefunded: true,
      orderId: "order-2",
      revokedPurchaseIds: [],
    });
  });

  it("throws when refunding an order that was never stored locally", async () => {
    primeAdmin({
      orders: [{ data: null, error: null }],
    });

    await expect(
      processOrderRefundedEvent(orderRefundedPayload)
    ).rejects.toThrow(/before it exists locally/);
  });
});
