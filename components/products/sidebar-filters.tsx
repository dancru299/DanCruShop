"use client";
 
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productTypeLabels } from "@/lib/products/display";
import { getTechSpecGroups, techLabel } from "@/lib/products/specs";
import type {
  ProductCategory,
  ProductType,
} from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";
 
type SidebarFiltersProps = {
  categories: ProductCategory[];
};
 
const productTypes = Object.keys(productTypeLabels) as ProductType[];
 
export function SidebarFilters({ categories }: SidebarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
 
  const activeCategory = searchParams.get("category") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const rawStack = searchParams.get("stack") ?? "";
 
  const selectedKeys = useMemo(() => {
    if (!rawStack) return [];
    return rawStack
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);
  }, [rawStack]);
 
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const techSpecGroups = useMemo(() => getTechSpecGroups(), []);
 
  // Multi-select sets for Category and Type
  const activeCategoriesSet = useMemo(() => {
    if (!activeCategory) return new Set<string>();
    return new Set(
      activeCategory
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [activeCategory]);
 
  const activeTypesSet = useMemo(() => {
    if (!activeType) return new Set<string>();
    return new Set(
      activeType
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [activeType]);
 
  // Local search filter for the sidebar contents
  const [searchFilter, setSearchFilter] = useState("");
  const queryLower = searchFilter.toLowerCase().trim();
 
  // Accordion open/close state - COLLAPSED BY DEFAULT ([])
  const [openItems, setOpenItems] = useState<string[]>([]);
 
  // Relative/fuzzy query match helper (splits keywords by space/punctuation)
  const matchQuery = useCallback(
    (text: string) => {
      if (!queryLower) return true;
      const normalizedText = text.toLowerCase();
      const queryParts = queryLower.split(/[\s.\-_/]+/).filter(Boolean);
      return queryParts.every((part) => normalizedText.includes(part));
    },
    [queryLower]
  );
 
  // Accordion groups that contain matches while searching. Derived during render
  // (a memo, not an effect) so we never call setState inside an effect.
  const matchedGroups = useMemo(() => {
    if (!queryLower) return null;

    const groups: string[] = [];

    if (categories.some((c) => matchQuery(c.name))) groups.push("categories");

    if (productTypes.some((t) => matchQuery(productTypeLabels[t]))) {
      groups.push("types");
    }

    techSpecGroups.forEach((group) => {
      const hasTechMatch = group.fields.some((field) =>
        (field.options ?? []).some(
          (opt) =>
            matchQuery(opt.label) || (opt.labelEn && matchQuery(opt.labelEn))
        )
      );
      if (hasTechMatch) groups.push(group.id);
    });

    return groups;
  }, [queryLower, categories, techSpecGroups, matchQuery]);

  // While searching, expansion follows the matches; otherwise the user's manual
  // open/close state drives the accordion.
  const accordionValue = matchedGroups ?? openItems;
 
  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!queryLower) return categories;
    return categories.filter((c) => matchQuery(c.name));
  }, [categories, queryLower, matchQuery]);
 
  // Filtered product types
  const filteredTypes = useMemo(() => {
    if (!queryLower) return productTypes;
    return productTypes.filter((t) => matchQuery(productTypeLabels[t]));
  }, [queryLower, matchQuery]);
 
  // Filtered tech options grouped by SpecGroup
  const filteredTechGroups = useMemo(() => {
    return techSpecGroups.map((group) => {
      const allOptions = group.fields.flatMap((f) => f.options ?? []);
      const matchedOptions = allOptions.filter(
        (opt) =>
          matchQuery(opt.label) ||
          (opt.labelEn && matchQuery(opt.labelEn))
      );
      return {
        ...group,
        matchedOptions,
      };
    });
  }, [techSpecGroups, matchQuery]);
 
  // Toggle multiple Categories (comma-separated list)
  const toggleCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get("category") ?? "";
      const slugs = current
        ? current.split(",").map((s) => s.trim().toLowerCase())
        : [];
      const idx = slugs.indexOf(slug.toLowerCase());
 
      if (idx >= 0) {
        slugs.splice(idx, 1);
      } else {
        slugs.push(slug.toLowerCase());
      }
 
      if (slugs.length > 0) {
        params.set("category", slugs.join(","));
      } else {
        params.delete("category");
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
 
  // Toggle multiple Product Types (comma-separated list)
  const toggleType = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get("type") ?? "";
      const slugs = current
        ? current.split(",").map((s) => s.trim().toLowerCase())
        : [];
      const idx = slugs.indexOf(slug.toLowerCase());
 
      if (idx >= 0) {
        slugs.splice(idx, 1);
      } else {
        slugs.push(slug.toLowerCase());
      }
 
      if (slugs.length > 0) {
        params.set("type", slugs.join(","));
      } else {
        params.delete("type");
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
 
  const toggleTech = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get("stack") ?? "";
      const keys = current
        ? current.split(",").map((k) => k.trim().toLowerCase())
        : [];
      const idx = keys.indexOf(key.toLowerCase());
 
      if (idx >= 0) {
        keys.splice(idx, 1);
      } else {
        keys.push(key.toLowerCase());
      }
 
      if (keys.length > 0) {
        params.set("stack", keys.join(","));
      } else {
        params.delete("stack");
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
 
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("type");
    params.delete("stack");
    params.delete("page");
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
 
  const hasActiveFilters = Boolean(
    activeCategory || activeType || selectedKeys.length > 0
  );
 
  // Calculate selection counts per group for badges
  const categorySelectedCount = activeCategoriesSet.size;
  const typeSelectedCount = activeTypesSet.size;
 
  const groupSelectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    techSpecGroups.forEach((group) => {
      const options = group.fields.flatMap((f) => f.options ?? []);
      const count = options.filter((o) => selectedSet.has(o.value)).length;
      counts[group.id] = count;
    });
    return counts;
  }, [techSpecGroups, selectedSet]);
 
  const hasMatches =
    filteredCategories.length > 0 ||
    filteredTypes.length > 0 ||
    filteredTechGroups.some((g) => g.matchedOptions.length > 0);
 
  return (
    <div className="flex flex-col gap-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
          Filters
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary transition-all"
          >
            Clear all
          </Button>
        )}
      </div>
 
      {/* Sidebar Search Bar */}
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search sidebar filters..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-8 h-8 text-xs bg-muted/30 border-border/80 focus-visible:bg-background transition-colors"
        />
        {searchFilter && (
          <button
            type="button"
            onClick={() => setSearchFilter("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear sidebar search"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </div>
 
      {/* Accordion List */}
      {hasMatches ? (
        <Accordion
          multiple
          value={accordionValue}
          onValueChange={setOpenItems}
          className="w-full"
        >
          {/* Categories Accordion */}
          {filteredCategories.length > 0 && (
            <AccordionItem value="categories">
              <AccordionTrigger className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 hover:no-underline hover:text-foreground">
                <div className="flex items-center gap-2">
                  <span>Categories</span>
                  {categorySelectedCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {categorySelectedCount}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {filteredCategories.map((cat) => (
                    <StackPill
                      key={cat.slug}
                      label={cat.name}
                      logo={null}
                      active={activeCategoriesSet.has(cat.slug)}
                      onClick={() => toggleCategory(cat.slug)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
 
          {/* Product Types Accordion */}
          {filteredTypes.length > 0 && (
            <AccordionItem value="types">
              <AccordionTrigger className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 hover:no-underline hover:text-foreground">
                <div className="flex items-center gap-2">
                  <span>Product Types</span>
                  {typeSelectedCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {typeSelectedCount}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {filteredTypes.map((t) => (
                    <StackPill
                      key={t}
                      label={productTypeLabels[t]}
                      logo={null}
                      active={activeTypesSet.has(t)}
                      onClick={() => toggleType(t)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
 
          {/* Tech Stack Groups Accordion */}
          {filteredTechGroups.map((group) => {
            if (group.matchedOptions.length === 0) return null;
            const count = groupSelectionCounts[group.id] ?? 0;
 
            return (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 hover:no-underline hover:text-foreground">
                  <div className="flex items-center gap-2">
                    <span>{group.labelEn}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {count}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {group.matchedOptions.map((opt) => (
                      <StackPill
                        key={opt.value}
                        label={opt.labelEn ?? opt.label}
                        logo={opt.logo ?? null}
                        active={selectedSet.has(opt.value)}
                        onClick={() => toggleTech(opt.value)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No filters matching your search.
        </div>
      )}
 
      {/* Current Selection Summary display at the bottom if anything selected */}
      {hasActiveFilters && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 mt-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Selected Filters
          </span>
          <div className="flex flex-wrap gap-1.5">
            {/* Categories */}
            {Array.from(activeCategoriesSet).map((slug) => {
              const catName = categories.find((c) => c.slug === slug)?.name ?? slug;
              return (
                <button
                  key={`cat-${slug}`}
                  type="button"
                  onClick={() => toggleCategory(slug)}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:line-through hover:text-destructive"
                >
                  {catName}
                  <XIcon aria-hidden="true" className="size-2.5" />
                </button>
              );
            })}
 
            {/* Product Types */}
            {Array.from(activeTypesSet).map((t) => {
              const label = t in productTypeLabels ? productTypeLabels[t as ProductType] : t;
              return (
                <button
                  key={`type-${t}`}
                  type="button"
                  onClick={() => toggleType(t)}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:line-through hover:text-destructive"
                >
                  {label}
                  <XIcon aria-hidden="true" className="size-2.5" />
                </button>
              );
            })}
 
            {/* Stack Technologies */}
            {selectedKeys.map((key) => {
              const label = techLabel(key, "en");
              return (
                <button
                  key={`tech-${key}`}
                  type="button"
                  onClick={() => toggleTech(key)}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:line-through hover:text-destructive"
                >
                  {label}
                  <XIcon aria-hidden="true" className="size-2.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
 
function StackPill({
  label,
  logo,
  active,
  onClick,
}: {
  label: string;
  logo: string | null;
  active: boolean;
  onClick: () => void;
}) {
  const isMonochrome =
    logo &&
    (logo.includes("nextjs") ||
      logo.includes("vercel") ||
      logo.includes("openai"));
 
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-all cursor-pointer",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- small external tech logos, not worth next/image
        <img
          alt=""
          src={logo}
          className={cn(
            "size-3.5 object-contain",
            isMonochrome && "invert dark:invert-0"
          )}
        />
      ) : null}
      {label}
    </button>
  );
}
