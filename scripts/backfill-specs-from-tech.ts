/**
 * One-off migration: backfill `metadata.specs` from the old tech-stack data
 * (product_tech_icons + metadata.tech_stack).
 *
 * Run with: npx tsx scripts/backfill-specs-from-tech.ts
 *
 * After verifying the backfill, drop product_tech_icons and tech_icons tables
 * using a separate SQL migration file.
 */

import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

// Load .env.local without an external dep (Node >= 20.12 has process.loadEnvFile).
// Falls back to whatever is already in the environment otherwise.
if (
  existsSync(".env.local") &&
  typeof (process as { loadEnvFile?: (p: string) => void }).loadEnvFile ===
    "function"
) {
  (process as { loadEnvFile: (p: string) => void }).loadEnvFile(".env.local");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ----- Slug → Spec field mapping (must match specs.ts catalog) -----

const SLUG_TO_SPEC_FIELD: Record<string, { field: string; type: "single" | "multi" }> = {
  // Framework (single)
  nextjs: { field: "framework", type: "single" },
  react: { field: "framework", type: "single" },
  vue: { field: "framework", type: "single" },
  nuxt: { field: "framework", type: "single" },
  svelte: { field: "framework", type: "single" },
  remix: { field: "framework", type: "single" },
  astro: { field: "framework", type: "single" },
  laravel: { field: "framework", type: "single" },
  nestjs: { field: "framework", type: "single" },
  express: { field: "framework", type: "single" },
  go: { field: "framework", type: "single" },
  // CSS / UI (multi)
  tailwind: { field: "css", type: "multi" },
  shadcn: { field: "css", type: "multi" },
  "css-modules": { field: "css", type: "multi" },
  "styled-components": { field: "css", type: "multi" },
  mui: { field: "css", type: "multi" },
  bootstrap: { field: "css", type: "multi" },
  // Database (single)
  supabase: { field: "database", type: "single" },
  postgres: { field: "database", type: "single" },
  mysql: { field: "database", type: "single" },
  mongodb: { field: "database", type: "single" },
  sqlite: { field: "database", type: "single" },
  planetscale: { field: "database", type: "single" },
  firebase: { field: "database", type: "single" },
  prisma: { field: "database", type: "single" },
  // Payment (multi)
  stripe: { field: "payment", type: "multi" },
  vietqr: { field: "payment", type: "multi" },
  lemonsqueezy: { field: "payment", type: "multi" },
  paypal: { field: "payment", type: "multi" },
  momo: { field: "payment", type: "multi" },
  paddle: { field: "payment", type: "multi" },
  // Auth (single)
  "supabase-auth": { field: "auth", type: "single" },
  nextauth: { field: "auth", type: "single" },
  clerk: { field: "auth", type: "single" },
  kinde: { field: "auth", type: "single" },
  auth0: { field: "auth", type: "single" },
  "firebase-auth": { field: "auth", type: "single" },
  custom: { field: "auth", type: "single" },
  // Email (multi)
  resend: { field: "email", type: "multi" },
  mailgun: { field: "email", type: "multi" },
  sendgrid: { field: "email", type: "multi" },
  postmark: { field: "email", type: "multi" },
  ses: { field: "email", type: "multi" },
  nodemailer: { field: "email", type: "multi" },
  // Hosting (multi)
  vercel: { field: "hosting", type: "multi" },
  railway: { field: "hosting", type: "multi" },
  flyio: { field: "hosting", type: "multi" },
  cloudflare: { field: "hosting", type: "multi" },
  // AI (multi)
  openai: { field: "ai", type: "multi" },
  anthropic: { field: "ai", type: "multi" },
  langchain: { field: "ai", type: "multi" },
  pinecone: { field: "ai", type: "multi" },
};

// Map non-standard slugs from the old stack-config (e.g. "lemon-squeezy") to catalog slugs
const SLUG_ALIASES: Record<string, string> = {
  "lemon-squeezy": "lemonsqueezy",
  angular: "", // not in catalog, skip
  chakra: "", // not in catalog, skip
  pandacss: "", // not in catalog, skip
  drizzle: "", // not in catalog, skip
  trpc: "", // not in catalog, skip
  hono: "", // not in catalog, skip
};

function normalizeSlug(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  // Check aliases first
  if (trimmed in SLUG_ALIASES) {
    const mapped = SLUG_ALIASES[trimmed];
    return mapped || null; // empty string means skip
  }

  // Check direct match
  if (trimmed in SLUG_TO_SPEC_FIELD) return trimmed;

  // Unknown slug — skip
  return null;
}

async function main() {
  console.log("Starting backfill...");

  // Fetch all products with their tech_icons (via join) — just metadata + tech_stack
  const { data: products, error } = await supabase
    .from("products")
    .select("id, metadata");

  if (error) {
    console.error("Failed to fetch products:", error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("No products found.");
    return;
  }

  // Fetch tech_icon slugs per product
  const { data: techIconRows, error: techError } = await supabase
    .from("product_tech_icons")
    .select("product_id, tech_icon:tech_icons ( slug )");

  if (techError) {
    console.warn("Could not fetch tech_icons (table may not exist):", techError.message);
  }

  // Build map: product_id → slug[]
  const techIconMap = new Map<string, string[]>();
  if (techIconRows) {
    for (const row of techIconRows) {
      const productId = String(row.product_id);
      const joined = row.tech_icon as
        | { slug?: string }
        | { slug?: string }[]
        | null;
      const slug = (Array.isArray(joined) ? joined[0] : joined)?.slug;
      if (slug) {
        const existing = techIconMap.get(productId) ?? [];
        existing.push(slug);
        techIconMap.set(productId, existing);
      }
    }
  }

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const metadata = (product.metadata ?? {}) as Record<string, unknown>;
    const existingSpecs: Record<string, unknown> = metadata.specs && typeof metadata.specs === "object" && !Array.isArray(metadata.specs)
      ? { ...(metadata.specs as Record<string, unknown>) }
      : {};

    // Collect slugs from old tech_stack
    const techStackSlugs: string[] = [];
    const rawTechStack = metadata.tech_stack;
    if (Array.isArray(rawTechStack)) {
      for (const item of rawTechStack) {
        if (typeof item === "string") {
          techStackSlugs.push(item);
        }
      }
    }

    // Collect slugs from tech_icons
    const iconSlugs = techIconMap.get(String(product.id)) ?? [];

    // Merge all slugs
    const allSlugs = [...new Set([...techStackSlugs, ...iconSlugs])];

    if (allSlugs.length === 0) {
      skipped++;
      continue;
    }

    // Map slugs to spec fields, respecting single/multi types
    const specs: Record<string, string | string[]> = { ...existingSpecs } as Record<
      string,
      string | string[]
    >;

    for (const rawSlug of allSlugs) {
      const slug = normalizeSlug(rawSlug);
      if (!slug) continue;

      const mapping = SLUG_TO_SPEC_FIELD[slug];
      if (!mapping) continue;

      if (mapping.type === "single") {
        // Only set if not already present (first wins)
        if (specs[mapping.field] == null) {
          specs[mapping.field] = slug;
        }
      } else {
        // Multi: accumulate array
        const existing = Array.isArray(specs[mapping.field]) ? specs[mapping.field] as string[] : [];
        if (!existing.includes(slug)) {
          existing.push(slug);
          specs[mapping.field] = existing;
        }
      }
    }

    // Only update if specs actually changed
    const nextMetadata: Record<string, unknown> = { ...metadata };
    delete nextMetadata.tech_stack; // clean up obsolete field
    nextMetadata.specs = specs;

    const { error: updateError } = await supabase
      .from("products")
      .update({ metadata: nextMetadata })
      .eq("id", product.id);

    if (updateError) {
      console.error(`Failed to update product ${product.id}:`, updateError.message);
    } else {
      updated++;
      console.log(`Updated product ${product.id}:`, JSON.stringify(specs));
    }
  }

  console.log(`\nBackfill complete. Updated: ${updated}, Skipped (no tech data): ${skipped}, Total: ${products.length}`);
}

main().catch(console.error);