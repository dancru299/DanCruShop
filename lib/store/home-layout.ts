// Shared homepage layout model: types, defaults and defensive normalization.
// Intentionally free of server-only imports so the admin builder (client),
// the save action (server) and the home renderers (server) can all import it.

export const HOME_LAYOUT_KEY = "home.layout";

export type SectionType = "hero" | "featured_products" | "categories";

export type CtaConfig = { label: string; href: string };

export type ColumnCount = 2 | 3 | 4;

export type HeroSection = {
  id: string;
  type: "hero";
  enabled: boolean;
  variant: "split" | "centered" | "minimal";
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: CtaConfig;
  secondaryCta: CtaConfig;
  showSpotlight: boolean;
  signals: { title: string; description: string }[];
};

export type FeaturedProductsSection = {
  id: string;
  type: "featured_products";
  enabled: boolean;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  source: "latest" | "category";
  categorySlug: string;
  limit: number;
  layout: "grid" | "row";
  columns: ColumnCount;
};

export type CategoriesSection = {
  id: string;
  type: "categories";
  enabled: boolean;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  source: "all" | "selected";
  categoryIds: string[];
  layout: "grid" | "row";
  columns: ColumnCount;
};

export type HomeSection =
  | HeroSection
  | FeaturedProductsSection
  | CategoriesSection;

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  featured_products: "Sản phẩm nổi bật",
  categories: "Danh mục",
};

export const SECTION_TYPES: SectionType[] = [
  "hero",
  "featured_products",
  "categories",
];

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sec_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// Factory for a fresh section of a given type, pre-filled with sensible copy.
export function createSection(type: SectionType): HomeSection {
  switch (type) {
    case "hero":
      return {
        id: newId(),
        type: "hero",
        enabled: true,
        variant: "split",
        eyebrow: "DanCruShop cho builder",
        title: "Tool, source code và tài nguyên AI để ship nhanh hơn.",
        subtitle:
          "Quét nhanh kho hàng, hiểu rõ món cần mua và nhận tài nguyên gọn trong tài khoản sau checkout.",
        primaryCta: { label: "Xem sản phẩm", href: "/products" },
        secondaryCta: { label: "Khám phá tool", href: "/products" },
        showSpotlight: true,
        signals: [
          {
            title: "AI tool & account",
            description:
              "Tài nguyên cho workflow coding, automation và builder AI.",
          },
          {
            title: "Source code sẵn dùng",
            description: "Starter kit, template và mini tool để ship nhanh hơn.",
          },
          {
            title: "Giao ngay sau checkout",
            description:
              "Nhận file, link tải hoặc quyền truy cập trong tài khoản.",
          },
        ],
      };
    case "featured_products":
      return {
        id: newId(),
        type: "featured_products",
        enabled: true,
        title: "Sản phẩm nổi bật",
        description:
          "Các tài nguyên mở bán ngay bây giờ, ưu tiên thứ có mô tả rõ, giá rõ và nhận hàng nhanh.",
        actionLabel: "Xem toàn bộ",
        actionHref: "/products",
        source: "latest",
        categorySlug: "",
        limit: 6,
        layout: "grid",
        columns: 3,
      };
    case "categories":
      return {
        id: newId(),
        type: "categories",
        enabled: true,
        title: "Danh mục mua nhanh",
        description:
          "Quét nhanh loại tài nguyên bạn cần rồi đi thẳng vào kho sản phẩm.",
        actionLabel: "Mở kho hàng",
        actionHref: "/products",
        source: "all",
        categoryIds: [],
        layout: "grid",
        columns: 3,
      };
  }
}

export const DEFAULT_LAYOUT: HomeSection[] = [
  createSection("hero"),
  createSection("featured_products"),
  createSection("categories"),
];

// ---- defensive coercion ----

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asColumns(value: unknown, fallback: ColumnCount): ColumnCount {
  return value === 2 || value === 3 || value === 4 ? value : fallback;
}

function asCta(value: unknown, fallback: CtaConfig): CtaConfig {
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    label: asString(record.label, fallback.label),
    href: asString(record.href, fallback.href),
  };
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function normalizeSection(value: unknown): HomeSection | null {
  const record = (value ?? {}) as Record<string, unknown>;
  const type = record.type;

  if (type !== "hero" && type !== "featured_products" && type !== "categories") {
    return null;
  }

  const base = createSection(type);
  const id = asString(record.id, base.id);
  const enabled = asBool(record.enabled, base.enabled);

  if (base.type === "hero") {
    const signals = Array.isArray(record.signals)
      ? record.signals.map((item) => {
          const r = (item ?? {}) as Record<string, unknown>;
          return {
            title: asString(r.title, ""),
            description: asString(r.description, ""),
          };
        })
      : base.signals;

    return {
      ...base,
      id,
      enabled,
      variant: asEnum(record.variant, ["split", "centered", "minimal"], base.variant),
      eyebrow: asString(record.eyebrow, base.eyebrow),
      title: asString(record.title, base.title),
      subtitle: asString(record.subtitle, base.subtitle),
      primaryCta: asCta(record.primaryCta, base.primaryCta),
      secondaryCta: asCta(record.secondaryCta, base.secondaryCta),
      showSpotlight: asBool(record.showSpotlight, base.showSpotlight),
      signals,
    };
  }

  if (base.type === "featured_products") {
    const rawLimit = Number(record.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(12, Math.max(1, Math.trunc(rawLimit)))
      : base.limit;

    return {
      ...base,
      id,
      enabled,
      title: asString(record.title, base.title),
      description: asString(record.description, base.description),
      actionLabel: asString(record.actionLabel, base.actionLabel),
      actionHref: asString(record.actionHref, base.actionHref),
      source: asEnum(record.source, ["latest", "category"], base.source),
      categorySlug: asString(record.categorySlug, base.categorySlug),
      limit,
      layout: asEnum(record.layout, ["grid", "row"], base.layout),
      columns: asColumns(record.columns, base.columns),
    };
  }

  const categoryIds = Array.isArray(record.categoryIds)
    ? record.categoryIds.filter((id): id is string => typeof id === "string")
    : base.categoryIds;

  return {
    ...base,
    id,
    enabled,
    title: asString(record.title, base.title),
    description: asString(record.description, base.description),
    actionLabel: asString(record.actionLabel, base.actionLabel),
    actionHref: asString(record.actionHref, base.actionHref),
    source: asEnum(record.source, ["all", "selected"], base.source),
    categoryIds,
    layout: asEnum(record.layout, ["grid", "row"], base.layout),
    columns: asColumns(record.columns, base.columns),
  };
}

/**
 * Coerces an arbitrary stored value into a renderable layout array. Returns the
 * default layout when the value is missing or not a non-empty array.
 */
export function normalizeLayout(value: unknown): HomeSection[] {
  if (!Array.isArray(value)) {
    return DEFAULT_LAYOUT;
  }

  const sections = value
    .map(normalizeSection)
    .filter((section): section is HomeSection => section !== null);

  return sections.length > 0 ? sections : DEFAULT_LAYOUT;
}
