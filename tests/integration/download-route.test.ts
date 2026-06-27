import { beforeEach, describe, expect, it, vi } from "vitest";

// Integration coverage for the secure download route handler. The Supabase
// admin/server clients, rate limiter, and analytics sink are mocked so the test
// exercises the handler's real orchestration — rate limit -> auth -> access
// check -> per-user download cap -> signed URL + logging — without a database.

type QueryResult = { data?: unknown; error: unknown; count?: number };

const { mockAdmin, mockServerClient } = vi.hoisted(() => ({
  mockAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
    storage: { from: vi.fn() },
  },
  mockServerClient: { auth: { getUser: vi.fn() } },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mockServerClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.7"),
}));

vi.mock("@/lib/analytics/server", () => ({
  recordAnalyticsEvent: vi.fn(),
}));

import { POST } from "@/app/api/products/[identifier]/download/route";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { enforceRateLimit } from "@/lib/rate-limit";

// Keep the suite output clean: the handler logs to console.error on the
// failure paths this test deliberately drives.
vi.spyOn(console, "error").mockImplementation(() => {});

/**
 * Builds a chainable Supabase admin double. Each table has a FIFO queue of
 * results; every terminal call (`.maybeSingle()`, `.single()`, or awaiting the
 * builder directly) dequeues the next result for that table.
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

    const builder: Record<string, unknown> = {};

    for (const method of chainMethods) {
      builder[method] = vi.fn((...args: unknown[]) => {
        ops.push(`${method}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`);
        return builder;
      });
    }

    builder.maybeSingle = vi.fn(async () => nextResult());
    builder.single = vi.fn(async () => nextResult());
    builder.then = (
      onFulfilled?: ((value: QueryResult) => unknown) | null,
      onRejected?: ((reason: unknown) => unknown) | null
    ) => Promise.resolve().then(nextResult).then(onFulfilled, onRejected);

    return builder;
  });
}

// getVariant() loads a product_variants row joined to its product.
const PAID_VARIANT = {
  id: "var-1",
  is_free: false,
  product: { id: "prod-1", status: "published" },
};
const FREE_VARIANT = {
  id: "var-2",
  is_free: true,
  product: { id: "prod-2", status: "published" },
};

function signedUrlStorage(signedUrl = "https://signed.example/app.zip") {
  return {
    createSignedUrl: vi.fn(async () => ({
      data: { signedUrl },
      error: null,
    })),
  };
}

function makeRequest(identifier = "prod-1") {
  return new Request(
    `http://localhost/api/products/${identifier}/download`,
    {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.7" },
    }
  );
}

function context(identifier = "prod-1") {
  return { params: Promise.resolve({ identifier }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(enforceRateLimit).mockResolvedValue({ allowed: true, remaining: 9 });
  mockServerClient.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockAdmin.rpc.mockResolvedValue({ error: null });
  mockAdmin.storage.from.mockReturnValue(signedUrlStorage());
});

describe("POST /api/products/[identifier]/download", () => {
  it("rejects an empty identifier with 400", async () => {
    const response = await POST(makeRequest(""), context(""));

    expect(response.status).toBe(400);
    expect(enforceRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    vi.mocked(enforceRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const response = await POST(makeRequest(), context());

    expect(response.status).toBe(429);
    // Auth is never checked once the request is throttled.
    expect(mockServerClient.auth.getUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockServerClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await POST(makeRequest(), context());

    expect(response.status).toBe(401);
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("returns 404 when the product is missing or unpublished", async () => {
    primeAdmin({ product_variants: [{ data: null, error: null }] });

    const response = await POST(makeRequest(), context());

    expect(response.status).toBe(404);
  });

  it("returns 403 when a paid product has no active purchase", async () => {
    primeAdmin({
      product_variants: [{ data: PAID_VARIANT, error: null }],
      purchases: [{ data: null, error: null }],
    });

    const response = await POST(makeRequest(), context());

    expect(response.status).toBe(403);
    expect(recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "download_error",
        metadata: { reason: "forbidden" },
      })
    );
  });

  it("returns 404 when the product has no primary file", async () => {
    primeAdmin({
      product_variants: [{ data: FREE_VARIANT, error: null }],
      product_files: [{ data: null, error: null }],
    });

    const response = await POST(makeRequest("prod-2"), context("prod-2"));

    expect(response.status).toBe(404);
  });

  it("issues a signed URL for a free product and logs the download", async () => {
    primeAdmin({
      product_variants: [{ data: FREE_VARIANT, error: null }],
      product_files: [
        {
          data: {
            id: "file-2",
            file_path: "prod-2/free.zip",
            max_downloads_per_user: null,
          },
          error: null,
        },
      ],
      // recordDownload inserts a download log row.
      download_logs: [{ error: null }],
    });

    const response = await POST(makeRequest("prod-2"), context("prod-2"));
    const body = (await response.json()) as { download_url?: string };

    expect(response.status).toBe(200);
    expect(body.download_url).toBe("https://signed.example/app.zip");
    expect(mockAdmin.rpc).toHaveBeenCalledWith("increment_download_count", {
      file_id_arg: "file-2",
    });
    expect(recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "download_success" })
    );
  });

  it("issues a signed URL for a purchased product under the download cap", async () => {
    primeAdmin({
      product_variants: [{ data: PAID_VARIANT, error: null }],
      purchases: [{ data: { id: "purchase-1" }, error: null }],
      product_files: [
        {
          data: {
            id: "file-1",
            file_path: "prod-1/app.zip",
            max_downloads_per_user: 3,
          },
          error: null,
        },
      ],
      // First dequeue: the download-count head query. Second: the insert.
      download_logs: [{ count: 1, error: null }, { error: null }],
    });

    const response = await POST(makeRequest(), context());
    const body = (await response.json()) as { download_url?: string };

    expect(response.status).toBe(200);
    expect(body.download_url).toBe("https://signed.example/app.zip");
  });

  it("returns 403 once the per-user download cap is reached", async () => {
    primeAdmin({
      product_variants: [{ data: FREE_VARIANT, error: null }],
      product_files: [
        {
          data: {
            id: "file-2",
            file_path: "prod-2/free.zip",
            max_downloads_per_user: 2,
          },
          error: null,
        },
      ],
      download_logs: [{ count: 2, error: null }],
    });

    const response = await POST(makeRequest("prod-2"), context("prod-2"));

    expect(response.status).toBe(403);
    // The cap is enforced before any signed URL is minted.
    expect(mockAdmin.storage.from).not.toHaveBeenCalled();
    expect(recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "download_error",
        metadata: { reason: "download_limit_reached" },
      })
    );
  });
});
