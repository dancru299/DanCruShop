/**
 * Controlled facet schema for the technical product comparison matrix.
 *
 * Specs live under `metadata.specs` as a flat object keyed by `SpecField.key`.
 * Using a controlled vocabulary (enum slugs) instead of free text is what makes
 * the /compare table align row-by-row across products and lets us render brand
 * badges + check/minus icons consistently. This single config drives BOTH the
 * admin form inputs and the comparison rows, so the two never drift apart.
 *
 * The "Overview" group (price, type, rating) is intentionally not modelled here
 * — it is derived from native product columns on the compare page.
 */

import type { ProductMetadata } from "@/lib/products/metadata";

export type SpecFieldType = "single" | "multi" | "boolean";

export type SpecOption = {
  value: string;
  /** Vietnamese label for the admin form. */
  label: string;
  /** English label for customer-facing UI; falls back to `label`. */
  labelEn?: string;
  /** Optional brand-ish badge classes; falls back to the outline variant. */
  className?: string;
  /** Logo path relative to /public, e.g. "/logo_tech/nextjs-white.svg". */
  logo?: string | null;
};

export type SpecField = {
  key: string;
  /** Vietnamese label for the admin form. */
  label: string;
  /** English label for customer-facing UI (compare matrix). */
  labelEn: string;
  type: SpecFieldType;
  options?: SpecOption[];
  /** Placeholder shown in the admin form for boolean/empty hints. */
  hint?: string;
};

export type SpecGroup = {
  id: string;
  /** Vietnamese label for the admin form. */
  label: string;
  /** English label for customer-facing UI (compare matrix). */
  labelEn: string;
  /** "tech" groups drive the stack builder, filters, Hero logos & compare. "meta" groups are compare/admin only. */
  kind: "tech" | "meta";
  fields: SpecField[];
};

const BRAND: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  neutral: "border-foreground/25 bg-foreground/5 text-foreground",
};

const FRAMEWORK_OPTIONS: SpecOption[] = [
  { value: "nextjs", label: "Next.js", className: BRAND.neutral, logo: "/logo_tech/nextjs-white.svg" },
  { value: "react", label: "React", className: BRAND.sky, logo: "/logo_tech/react_61DAFB.png" },
  { value: "vue", label: "Vue", className: BRAND.emerald, logo: "/logo_tech/vue.svg" },
  { value: "nuxt", label: "Nuxt", className: BRAND.emerald },
  { value: "svelte", label: "Svelte", className: BRAND.rose },
  { value: "remix", label: "Remix", className: BRAND.neutral },
  { value: "astro", label: "Astro", className: BRAND.violet },
  { value: "laravel", label: "Laravel", className: BRAND.rose, logo: "/logo_tech/laravel.svg" },
  { value: "nestjs", label: "NestJS", className: BRAND.rose },
  { value: "express", label: "Express", className: BRAND.neutral },
  { value: "go", label: "Go", className: BRAND.sky, logo: "/logo_tech/go_00ADD8.png" },
];

const CSS_OPTIONS: SpecOption[] = [
  { value: "tailwind", label: "Tailwind CSS", className: BRAND.sky, logo: "/logo_tech/tailwind-css.svg" },
  { value: "shadcn", label: "shadcn/ui", className: BRAND.neutral },
  { value: "css-modules", label: "CSS Modules" },
  { value: "styled-components", label: "styled-components", className: BRAND.violet },
  { value: "mui", label: "MUI", className: BRAND.sky },
  { value: "bootstrap", label: "Bootstrap", className: BRAND.violet, logo: "/logo_tech/bootstrap.svg" },
];

const DATABASE_OPTIONS: SpecOption[] = [
  { value: "supabase", label: "Supabase", className: BRAND.emerald, logo: "/logo_tech/supabase.svg" },
  { value: "postgres", label: "PostgreSQL", className: BRAND.sky, logo: "/logo_tech/postgresql.svg" },
  { value: "mysql", label: "MySQL", className: BRAND.sky },
  { value: "mongodb", label: "MongoDB", className: BRAND.emerald, logo: "/logo_tech/mongodb.svg" },
  { value: "sqlite", label: "SQLite", className: BRAND.neutral },
  { value: "planetscale", label: "PlanetScale", className: BRAND.neutral },
  { value: "firebase", label: "Firebase", className: BRAND.amber, logo: "/logo_tech/firebase.svg" },
  { value: "prisma", label: "Prisma", className: BRAND.neutral },
];

const PAYMENT_OPTIONS: SpecOption[] = [
  { value: "stripe", label: "Stripe", className: BRAND.indigo, logo: "/logo_tech/stripe.svg" },
  { value: "vietqr", label: "VietQR", className: BRAND.rose },
  { value: "lemonsqueezy", label: "Lemon Squeezy", className: BRAND.amber },
  { value: "paypal", label: "PayPal", className: BRAND.sky },
  { value: "momo", label: "MoMo", className: BRAND.rose },
  { value: "paddle", label: "Paddle", className: BRAND.indigo },
];

const AUTH_OPTIONS: SpecOption[] = [
  { value: "supabase-auth", label: "Supabase Auth", className: BRAND.emerald },
  { value: "nextauth", label: "NextAuth / Auth.js", className: BRAND.violet },
  { value: "clerk", label: "Clerk", className: BRAND.violet },
  { value: "kinde", label: "Kinde", className: BRAND.neutral },
  { value: "auth0", label: "Auth0", className: BRAND.amber },
  { value: "firebase-auth", label: "Firebase Auth", className: BRAND.amber },
  { value: "custom", label: "Custom / JWT", className: BRAND.neutral },
];

const EMAIL_OPTIONS: SpecOption[] = [
  { value: "resend", label: "Resend", className: BRAND.neutral },
  { value: "mailgun", label: "Mailgun", className: BRAND.rose },
  { value: "sendgrid", label: "SendGrid", className: BRAND.sky },
  { value: "postmark", label: "Postmark", className: BRAND.amber },
  { value: "ses", label: "Amazon SES", className: BRAND.amber },
  { value: "nodemailer", label: "Nodemailer", className: BRAND.emerald },
];

const HOSTING_OPTIONS: SpecOption[] = [
  { value: "vercel", label: "Vercel", className: BRAND.neutral, labelEn: "Vercel", logo: "/logo_tech/vercel.svg" },
  { value: "railway", label: "Railway", className: BRAND.violet, labelEn: "Railway" },
  { value: "flyio", label: "Fly.io", className: BRAND.violet, labelEn: "Fly.io" },
  { value: "cloudflare", label: "Cloudflare", className: BRAND.amber, labelEn: "Cloudflare" },
];

const AI_OPTIONS: SpecOption[] = [
  { value: "openai", label: "OpenAI", className: BRAND.emerald, labelEn: "OpenAI", logo: "/logo_tech/openai.svg" },
  { value: "anthropic", label: "Anthropic", className: BRAND.amber, labelEn: "Anthropic", logo: "/logo_tech/claude_D97757.png" },
  { value: "langchain", label: "LangChain", className: BRAND.emerald, labelEn: "LangChain" },
  { value: "pinecone", label: "Pinecone", className: BRAND.emerald, labelEn: "Pinecone" },
];

const PROJECT_LIMIT_OPTIONS: SpecOption[] = [
  { value: "one", label: "1 dự án", labelEn: "1 project" },
  { value: "three", label: "3 dự án", labelEn: "3 projects" },
  { value: "unlimited", label: "Không giới hạn", labelEn: "Unlimited", className: BRAND.emerald },
];

const SUPPORT_OPTIONS: SpecOption[] = [
  { value: "discord", label: "Discord", className: BRAND.indigo },
  { value: "email", label: "Email", className: BRAND.sky },
  { value: "github", label: "GitHub Issues", className: BRAND.neutral },
  { value: "telegram", label: "Telegram", className: BRAND.sky },
  { value: "zalo", label: "Zalo", className: BRAND.sky },
];

export const SPEC_GROUPS: SpecGroup[] = [
  {
    id: "tech-stack",
    label: "Stack công nghệ",
    labelEn: "Tech stack",
    kind: "tech",
    fields: [
      { key: "framework", label: "Framework chính", labelEn: "Main framework", type: "single", options: FRAMEWORK_OPTIONS },
      { key: "css", label: "CSS / UI", labelEn: "CSS / UI", type: "multi", options: CSS_OPTIONS },
      { key: "database", label: "Database", labelEn: "Database", type: "single", options: DATABASE_OPTIONS },
    ],
  },
  {
    id: "integrations",
    label: "Tính năng tích hợp",
    labelEn: "Integrations",
    kind: "tech",
    fields: [
      { key: "payment", label: "Cổng thanh toán", labelEn: "Payments", type: "multi", options: PAYMENT_OPTIONS },
      { key: "auth", label: "Xác thực (Auth)", labelEn: "Authentication", type: "single", options: AUTH_OPTIONS },
      { key: "email", label: "Email", labelEn: "Email", type: "multi", options: EMAIL_OPTIONS },
    ],
  },
  {
    id: "hosting",
    label: "Hosting",
    labelEn: "Hosting",
    kind: "tech",
    fields: [
      { key: "hosting", label: "Nền tảng hosting", labelEn: "Hosting", type: "multi", options: HOSTING_OPTIONS },
    ],
  },
  {
    id: "ai",
    label: "Trí tuệ nhân tạo",
    labelEn: "AI",
    kind: "tech",
    fields: [
      { key: "ai", label: "AI / ML", labelEn: "AI / ML", type: "multi", options: AI_OPTIONS },
    ],
  },
  {
    id: "license-support",
    label: "Bản quyền & Hỗ trợ",
    labelEn: "License & support",
    kind: "meta",
    fields: [
      { key: "project_limit", label: "Giới hạn dự án", labelEn: "Project limit", type: "single", options: PROJECT_LIMIT_OPTIONS },
      {
        key: "lifetime_updates",
        label: "Cập nhật trọn đời",
        labelEn: "Lifetime updates",
        type: "boolean",
        hint: "Người mua nhận update mãi mãi.",
      },
      { key: "support", label: "Kênh hỗ trợ", labelEn: "Support channels", type: "multi", options: SUPPORT_OPTIONS },
    ],
  },
];

export const SPEC_FIELDS: SpecField[] = SPEC_GROUPS.flatMap(
  (group) => group.fields
);

const SPEC_FIELD_BY_KEY = new Map(SPEC_FIELDS.map((field) => [field.key, field]));

// ---- Flat lookup by slug (across ALL groups) ----

const ALL_OPTIONS = SPEC_FIELDS.flatMap((field) => field.options ?? []);

const OPTION_BY_SLUG = new Map<string, SpecOption>(
  ALL_OPTIONS.map((option) => [option.value, option])
);

const TECH_GROUPS = SPEC_GROUPS.filter((group) => group.kind === "tech");

/** Normalized, validated specs value for a single field. */
export type SpecValue =
  | { type: "single" | "multi"; values: string[] }
  | { type: "boolean"; value: boolean };

function readSpecsObject(metadata: ProductMetadata): Record<string, unknown> {
  const specs = metadata.specs;
  return specs && typeof specs === "object" && !Array.isArray(specs)
    ? (specs as Record<string, unknown>)
    : {};
}

/**
 * Reads + validates one field's value from product metadata, dropping any
 * option slugs that are not in the controlled vocabulary.
 */
export function readSpecValue(
  metadata: ProductMetadata,
  field: SpecField
): SpecValue {
  const raw = readSpecsObject(metadata)[field.key];

  if (field.type === "boolean") {
    return { type: "boolean", value: raw === true };
  }

  const allowed = new Set((field.options ?? []).map((option) => option.value));
  const rawValues =
    field.type === "single"
      ? typeof raw === "string"
        ? [raw]
        : []
      : Array.isArray(raw)
        ? raw.filter((item): item is string => typeof item === "string")
        : [];

  return {
    type: field.type,
    values: rawValues.filter((value) => allowed.has(value)),
  };
}

export function getSpecOption(
  field: SpecField,
  value: string
): SpecOption | undefined {
  return field.options?.find((option) => option.value === value);
}

export function getSpecFieldByKey(key: string): SpecField | undefined {
  return SPEC_FIELD_BY_KEY.get(key);
}

/**
 * Builds the `specs` object to persist in metadata from the admin form state,
 * dropping empty fields so we never store noise.
 */
export function buildSpecsForSave(
  state: Record<string, string[] | boolean>
): Record<string, unknown> {
  const specs: Record<string, unknown> = {};

  for (const field of SPEC_FIELDS) {
    const value = state[field.key];

    if (field.type === "boolean") {
      if (value === true) {
        specs[field.key] = true;
      }
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      specs[field.key] = field.type === "single" ? value[0] : value;
    }
  }

  return specs;
}

// ---- NEW helpers (replacing stack-config.ts role) ----

/** Return tech groups (kind === "tech") for the Stack Builder UI. */
export function getTechSpecGroups(): SpecGroup[] {
  return TECH_GROUPS;
}

/**
 * Collect all tech slugs from a product's `metadata.specs` (tech groups only).
 * Used by the Stack Builder filter, Hero spotlight logos, and product detail.
 */
export function getProductTechSlugs(metadata: ProductMetadata): string[] {
  const obj = readSpecsObject(metadata);
  const slugs: string[] = [];

  for (const group of TECH_GROUPS) {
    for (const field of group.fields) {
      const raw = obj[field.key];
      if (field.type === "boolean" || raw == null) continue;

      if (field.type === "single" && typeof raw === "string") {
        slugs.push(raw);
      } else if (Array.isArray(raw)) {
        for (const item of raw) {
          if (typeof item === "string") slugs.push(item);
        }
      }
    }
  }

  return slugs;
}

/** Lookup a SpecOption globally by slug. */
export function getTechOption(slug: string): SpecOption | undefined {
  return OPTION_BY_SLUG.get(slug);
}

/** Human-readable label for a slug (English); falls back to slug. */
export function techLabel(slug: string, lang: "en" | "vi" = "en"): string {
  const option = OPTION_BY_SLUG.get(slug);
  if (!option) return slug;
  if (lang === "vi") return option.label;
  return option.labelEn ?? option.label;
}

/** Logo path for a slug, or `null`. */
export function techLogo(slug: string): string | null {
  const option = OPTION_BY_SLUG.get(slug);
  return option?.logo ?? null;
}

/**
 * Filter + deduplicate user-submitted tech slugs against the controlled
 * vocabulary (replaces `normalizeStackKeys` from stack-config).
 */
export function validateTechSlugs(raw: string[]): string[] {
  return Array.from(
    new Set(
      raw
        .map((k) => k.trim().toLowerCase())
        .filter((k) => OPTION_BY_SLUG.has(k))
    )
  ).sort();
}

// ─── DB-backed fetch (primary source, hardcoded data as fallback) ───
// NOTE: define mapping types inline to avoid importing @/lib/supabase/queries/specs
// which would pull server-only deps (next/headers) into client bundles.

import { cache } from "react";

type SpecGroupRowLike = {
  id: string;
  label: string;
  label_en: string;
  kind: "tech" | "meta";
  fields?: SpecFieldRowLike[];
};

type SpecFieldRowLike = {
  key: string;
  label: string;
  label_en: string;
  type: SpecFieldType;
  hint: string | null;
  options?: SpecOptionRowLike[];
};

type SpecOptionRowLike = {
  value: string;
  label: string;
  label_en: string | null;
  class_name: string | null;
  logo: string | null;
  is_active: boolean;
};

function mapOption(row: SpecOptionRowLike): SpecOption {
  return {
    value: row.value,
    label: row.label,
    labelEn: row.label_en ?? undefined,
    className: row.class_name ?? undefined,
    logo: row.logo ?? undefined,
  };
}

function mapField(row: SpecFieldRowLike): SpecField {
  return {
    key: row.key,
    label: row.label,
    labelEn: row.label_en,
    type: row.type,
    hint: row.hint ?? undefined,
    options: (row.options ?? []).map(mapOption),
  };
}

function mapGroup(row: SpecGroupRowLike): SpecGroup {
  return {
    id: row.id,
    label: row.label,
    labelEn: row.label_en,
    kind: row.kind,
    fields: (row.fields ?? []).map(mapField),
  };
}

function mapGroups(rows: SpecGroupRowLike[]): SpecGroup[] {
  return rows.map(mapGroup);
}

export const getSpecGroupsFromDB = cache(async (): Promise<SpecGroup[]> => {
  try {
    const { getPublicSpecGroups } = await import("@/lib/supabase/queries/specs");
    const groups = await getPublicSpecGroups();
    if (groups.length > 0) return mapGroups(groups);
  } catch (e) {
    console.warn("Failed to fetch specs from DB, using fallback", e);
  }
  return SPEC_GROUPS;
});

export const getAdminSpecGroupsFromDB = cache(async (): Promise<SpecGroup[]> => {
  try {
    const { getAdminSpecGroups } = await import("@/lib/supabase/queries/specs");
    const groups = await getAdminSpecGroups();
    if (groups.length > 0) return mapGroups(groups);
  } catch (e) {
    console.warn("Failed to fetch admin specs from DB, using fallback", e);
  }
  return SPEC_GROUPS;
});