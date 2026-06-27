import { describe, expect, it, vi } from "vitest";

import {
  expandBundleProductIds,
  grantProductAccess,
} from "@/lib/payments/access";

function makeAdmin(
  resultsByTable: Record<string, { data?: unknown; error: unknown }[]>
) {
  const queues = new Map(
    Object.entries(resultsByTable).map(([table, results]) => [
      table,
      [...results],
    ])
  );

  const from = vi.fn((table: string) => {
    const queue = queues.get(table);
    const dequeue = () => {
      if (!queue || queue.length === 0) {
        throw new Error(`No queued result for table "${table}"`);
      }
      return queue.shift()!;
    };

    function makeChain(): Record<string, unknown> {
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        in: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        upsert: vi.fn(async () => dequeue()),
        single: vi.fn(async () => dequeue()),
        maybeSingle: vi.fn(async () => dequeue()),
        // The Supabase query builder is thenable (await chain).
        then: (
          onFulfilled?: ((value: unknown) => unknown) | null,
          onRejected?: ((reason: unknown) => unknown) | null
        ) =>
          Promise.resolve()
            .then(() => dequeue())
            .then(onFulfilled, onRejected),
      };

      return chain;
    }

    return makeChain();
  });

  return { from, rpc: vi.fn() } as unknown as Parameters<
    typeof expandBundleProductIds
  >[0];
}

describe("expandBundleProductIds", () => {
  it("returns empty array for empty input", async () => {
    const admin = makeAdmin({});
    const result = await expandBundleProductIds(admin, []);
    expect(result).toEqual([]);
  });

  it("returns de-duplicated product ids with no bundles", async () => {
    const admin = makeAdmin({
      bundle_items: [{ data: [], error: null }],
    });
    const result = await expandBundleProductIds(admin, ["p1", "p2", "p1"]);
    expect(result).toEqual(["p1", "p2"]);
  });

  it("expands bundle children into the result set", async () => {
    const admin = makeAdmin({
      bundle_items: [
        {
          data: [
            { child_product_id: "child-1" },
            { child_product_id: "child-2" },
          ],
          error: null,
        },
      ],
    });
    const result = await expandBundleProductIds(admin, ["bundle-1"]);
    expect(result).toEqual(["bundle-1", "child-1", "child-2"]);
  });

  it("throws when the bundle_items query errors", async () => {
    const admin = makeAdmin({
      bundle_items: [{ data: null, error: { message: "db error" } }],
    });
    await expect(expandBundleProductIds(admin, ["p1"])).rejects.toThrow(
      /Could not expand bundle products/
    );
  });
});

describe("grantProductAccess", () => {
  it("returns empty array when variantIds is empty", async () => {
    const admin = makeAdmin({});
    const result = await grantProductAccess(admin, {
      variantIds: [],
      userId: "user-1",
    });
    expect(result).toEqual([]);
  });

  it("upserts purchases and returns the full product list", async () => {
    const admin = makeAdmin({
      product_variants: [
        // resolve purchased variants -> their products
        {
          data: [
            { id: "var-1", product_id: "prod-1" },
            { id: "var-2", product_id: "prod-2" },
          ],
          error: null,
        },
        // default variant for bundle child product
        { data: [{ id: "var-child-1", product_id: "child-1" }], error: null },
      ],
      bundle_items: [
        { data: [{ child_product_id: "child-1" }], error: null },
      ],
      // issueLicenseKeys queries products for licensed products
      products: [{ data: [], error: null }],
      // The purchases upsert
      purchases: [{ error: null }],
      // issueLicenseKeys inserts license keys
      license_keys: [{ error: null }],
    });

    const result = await grantProductAccess(admin, {
      orderId: "order-1",
      userId: "user-1",
      variantIds: ["var-1", "var-2"],
    });

    expect(result).toEqual(["prod-1", "prod-2", "child-1"]);
  });

  it("throws when purchases upsert fails", async () => {
    const admin = makeAdmin({
      product_variants: [
        { data: [{ id: "var-1", product_id: "prod-1" }], error: null },
      ],
      bundle_items: [{ data: [], error: null }],
      purchases: [{ data: null, error: { message: "insert error" } }],
    });

    await expect(
      grantProductAccess(admin, {
        variantIds: ["var-1"],
        userId: "user-1",
      })
    ).rejects.toThrow(/Could not grant product access/);
  });
});