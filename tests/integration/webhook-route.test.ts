import { beforeEach, describe, expect, it, vi } from "vitest";

// Integration coverage for the Lemon Squeezy webhook route handler. The
// signature check, the order processors, the failure alerter, and the Supabase
// admin client are mocked so the test drives the handler's real control flow:
// signature gating -> payload parse -> idempotent storage -> event dispatch ->
// processed marker -> failure alerting.

type QueryResult = { data?: unknown; error: unknown };

const { mockAdmin } = vi.hoisted(() => ({
  mockAdmin: { from: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

vi.mock("@/lib/payments/lemon-squeezy", () => ({
  verifyWebhookSignature: vi.fn(),
}));

vi.mock("@/lib/payments/lemon-squeezy-webhook", () => ({
  processOrderCreatedEvent: vi.fn(),
  processOrderRefundedEvent: vi.fn(),
}));

vi.mock("@/lib/payments/webhook-failure-alert", () => ({
  notifyWebhookFailure: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/lemon-squeezy/route";
import { verifyWebhookSignature } from "@/lib/payments/lemon-squeezy";
import {
  processOrderCreatedEvent,
  processOrderRefundedEvent,
} from "@/lib/payments/lemon-squeezy-webhook";
import { notifyWebhookFailure } from "@/lib/payments/webhook-failure-alert";

// The handler logs through console.warn/info/error on the paths exercised here.
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

function primeWebhookEvents(results: QueryResult[]) {
  const queue = [...results];
  const chainMethods = ["select", "eq", "insert", "update"];

  mockAdmin.from.mockImplementation(() => {
    const nextResult = (): QueryResult => {
      if (queue.length === 0) {
        throw new Error("No queued webhook_events result");
      }

      return queue.shift() as QueryResult;
    };

    const builder: Record<string, unknown> = {};

    for (const method of chainMethods) {
      builder[method] = vi.fn(() => builder);
    }

    builder.single = vi.fn(async () => nextResult());
    builder.then = (
      onFulfilled?: ((value: QueryResult) => unknown) | null,
      onRejected?: ((reason: unknown) => unknown) | null
    ) => Promise.resolve().then(nextResult).then(onFulfilled, onRejected);

    return builder;
  });
}

function makeRequest(
  body: unknown,
  headers: Record<string, string> = { "x-signature": "valid-signature" }
) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);

  return new Request("http://localhost/api/webhooks/lemon-squeezy", {
    method: "POST",
    headers,
    body: raw,
  });
}

function orderPayload(eventName: string, id = "evt-123") {
  return {
    meta: { event_name: eventName, custom_data: {} },
    data: {
      id,
      type: "orders",
      attributes: {
        user_email: "buyer@example.com",
        total: 1900,
        currency: "USD",
        first_order_item: { variant_id: 999, price: 1900, quantity: 1 },
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyWebhookSignature).mockReturnValue(true);
  vi.mocked(processOrderCreatedEvent).mockResolvedValue(undefined as never);
  vi.mocked(processOrderRefundedEvent).mockResolvedValue(undefined as never);
});

describe("POST /api/webhooks/lemon-squeezy", () => {
  it("returns 401 when the signature header is missing", async () => {
    const response = await POST(makeRequest(orderPayload("order_created"), {}));

    expect(response.status).toBe(401);
    expect(verifyWebhookSignature).not.toHaveBeenCalled();
  });

  it("returns 401 when the signature is invalid", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(false);

    const response = await POST(makeRequest(orderPayload("order_created")));

    expect(response.status).toBe(401);
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("returns 500 when signature verification throws", async () => {
    vi.mocked(verifyWebhookSignature).mockImplementation(() => {
      throw new Error("missing secret");
    });

    const response = await POST(makeRequest(orderPayload("order_created")));

    expect(response.status).toBe(500);
  });

  it("returns 400 when the payload is not valid JSON", async () => {
    const response = await POST(makeRequest("{not-json"));

    expect(response.status).toBe(400);
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("processes a new order_created event and marks it processed", async () => {
    primeWebhookEvents([
      // storeWebhookEvent insert -> select -> single
      { data: { id: "evt-row-1", processed_at: null }, error: null },
      // markWebhookEventProcessed update -> eq (awaited)
      { error: null },
    ]);

    const response = await POST(makeRequest(orderPayload("order_created")));
    const body = (await response.json()) as { received?: boolean };

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(processOrderCreatedEvent).toHaveBeenCalledTimes(1);
    expect(processOrderRefundedEvent).not.toHaveBeenCalled();
  });

  it("dispatches order_refunded to the refund processor", async () => {
    primeWebhookEvents([
      { data: { id: "evt-row-2", processed_at: null }, error: null },
      { error: null },
    ]);

    const response = await POST(makeRequest(orderPayload("order_refunded")));

    expect(response.status).toBe(200);
    expect(processOrderRefundedEvent).toHaveBeenCalledTimes(1);
    expect(processOrderCreatedEvent).not.toHaveBeenCalled();
  });

  it("marks an unrecognized event processed without dispatching", async () => {
    primeWebhookEvents([
      { data: { id: "evt-row-3", processed_at: null }, error: null },
      { error: null },
    ]);

    const response = await POST(makeRequest(orderPayload("subscription_created")));

    expect(response.status).toBe(200);
    expect(processOrderCreatedEvent).not.toHaveBeenCalled();
    expect(processOrderRefundedEvent).not.toHaveBeenCalled();
  });

  it("skips reprocessing an already-processed duplicate event", async () => {
    primeWebhookEvents([
      // Insert hits the unique constraint...
      { data: null, error: { code: "23505" } },
      // ...and the existing row was already processed.
      {
        data: { id: "evt-row-1", processed_at: "2026-01-01T00:00:00.000Z" },
        error: null,
      },
    ]);

    const response = await POST(makeRequest(orderPayload("order_created")));
    const body = (await response.json()) as { duplicate?: boolean };

    expect(response.status).toBe(200);
    expect(body.duplicate).toBe(true);
    expect(processOrderCreatedEvent).not.toHaveBeenCalled();
  });

  it("alerts and returns 500 when the order processor throws", async () => {
    primeWebhookEvents([
      { data: { id: "evt-row-9", processed_at: null }, error: null },
    ]);
    vi.mocked(processOrderCreatedEvent).mockRejectedValue(
      new Error("fulfillment exploded")
    );

    const response = await POST(makeRequest(orderPayload("order_created")));

    expect(response.status).toBe(500);
    expect(notifyWebhookFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "fulfillment exploded",
        provider: "lemon_squeezy",
      })
    );
  });
});
