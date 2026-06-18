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
  label: string;
  /** Optional brand-ish badge classes; falls back to the outline variant. */
  className?: string;
};

export type SpecField = {
  key: string;
  label: string;
  type: SpecFieldType;
  options?: SpecOption[];
  /** Placeholder shown in the admin form for boolean/empty hints. */
  hint?: string;
};

export type SpecGroup = {
  id: string;
  label: string;
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
  { value: "nextjs", label: "Next.js", className: BRAND.neutral },
  { value: "react", label: "React", className: BRAND.sky },
  { value: "vue", label: "Vue", className: BRAND.emerald },
  { value: "nuxt", label: "Nuxt", className: BRAND.emerald },
  { value: "svelte", label: "Svelte", className: BRAND.rose },
  { value: "remix", label: "Remix", className: BRAND.neutral },
  { value: "astro", label: "Astro", className: BRAND.violet },
  { value: "laravel", label: "Laravel", className: BRAND.rose },
  { value: "nestjs", label: "NestJS", className: BRAND.rose },
  { value: "express", label: "Express", className: BRAND.neutral },
  { value: "go", label: "Go", className: BRAND.sky },
];

const CSS_OPTIONS: SpecOption[] = [
  { value: "tailwind", label: "Tailwind CSS", className: BRAND.sky },
  { value: "shadcn", label: "shadcn/ui", className: BRAND.neutral },
  { value: "css-modules", label: "CSS Modules" },
  { value: "styled-components", label: "styled-components", className: BRAND.violet },
  { value: "mui", label: "MUI", className: BRAND.sky },
  { value: "bootstrap", label: "Bootstrap", className: BRAND.violet },
];

const DATABASE_OPTIONS: SpecOption[] = [
  { value: "supabase", label: "Supabase", className: BRAND.emerald },
  { value: "postgres", label: "PostgreSQL", className: BRAND.sky },
  { value: "mysql", label: "MySQL", className: BRAND.sky },
  { value: "mongodb", label: "MongoDB", className: BRAND.emerald },
  { value: "sqlite", label: "SQLite", className: BRAND.neutral },
  { value: "planetscale", label: "PlanetScale", className: BRAND.neutral },
  { value: "firebase", label: "Firebase", className: BRAND.amber },
  { value: "prisma", label: "Prisma", className: BRAND.neutral },
];

const PAYMENT_OPTIONS: SpecOption[] = [
  { value: "stripe", label: "Stripe", className: BRAND.indigo },
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

const PROJECT_LIMIT_OPTIONS: SpecOption[] = [
  { value: "one", label: "1 dự án" },
  { value: "three", label: "3 dự án" },
  { value: "unlimited", label: "Không giới hạn", className: BRAND.emerald },
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
    fields: [
      { key: "framework", label: "Framework chính", type: "single", options: FRAMEWORK_OPTIONS },
      { key: "css", label: "CSS / UI", type: "multi", options: CSS_OPTIONS },
      { key: "database", label: "Database", type: "single", options: DATABASE_OPTIONS },
    ],
  },
  {
    id: "integrations",
    label: "Tính năng tích hợp",
    fields: [
      { key: "payment", label: "Cổng thanh toán", type: "multi", options: PAYMENT_OPTIONS },
      { key: "auth", label: "Xác thực (Auth)", type: "single", options: AUTH_OPTIONS },
      { key: "email", label: "Email", type: "multi", options: EMAIL_OPTIONS },
    ],
  },
  {
    id: "license-support",
    label: "Bản quyền & Hỗ trợ",
    fields: [
      { key: "project_limit", label: "Giới hạn dự án", type: "single", options: PROJECT_LIMIT_OPTIONS },
      {
        key: "lifetime_updates",
        label: "Cập nhật trọn đời",
        type: "boolean",
        hint: "Người mua nhận update mãi mãi.",
      },
      { key: "support", label: "Kênh hỗ trợ", type: "multi", options: SUPPORT_OPTIONS },
    ],
  },
];

export const SPEC_FIELDS: SpecField[] = SPEC_GROUPS.flatMap(
  (group) => group.fields
);

const SPEC_FIELD_BY_KEY = new Map(SPEC_FIELDS.map((field) => [field.key, field]));

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
