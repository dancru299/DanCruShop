"use client";

import { useState, useTransition } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { updateHomeLayout } from "@/actions/home-layout.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SECTION_LABELS,
  SECTION_TYPES,
  createSection,
  type HomeSection,
  type SectionType,
} from "@/lib/store/home-layout";

import { ToggleSwitch } from "./home-layout-builder/builder-primitives";
import {
  BannerGridEditor,
  CategoriesEditor,
  FeaturedEditor,
  FlashSaleEditor,
  HeroEditor,
  KeywordsEditor,
  type CategoryOption,
} from "./home-layout-builder/section-editors";

type HomeLayoutBuilderProps = {
  initialLayout: HomeSection[];
  categories: CategoryOption[];
};

// ---- main builder ----

export function HomeLayoutBuilder({
  initialLayout,
  categories,
}: HomeLayoutBuilderProps) {
  const [sections, setSections] = useState<HomeSection[]>(initialLayout);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialLayout[0]?.id ?? null
  );
  const [isPending, startTransition] = useTransition();

  function patchSection(id: string, patch: Record<string, unknown>) {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? ({ ...section, ...patch } as HomeSection) : section
      )
    );
  }

  function addSection(type: SectionType) {
    const section = createSection(type);
    setSections((current) => [...current, section]);
    setExpandedId(section.id);
  }

  function move(id: string, direction: "up" | "down") {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      const swap = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swap < 0 || swap >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  function removeSection(id: string) {
    setSections((current) => current.filter((section) => section.id !== id));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateHomeLayout(sections);

      if (!result.ok) {
        toast.error("Không lưu được bố cục", { description: result.error });
        return;
      }

      toast.success("Đã lưu bố cục trang chủ");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-1 text-sm font-medium text-muted-foreground">
            Thêm section:
          </span>
          {SECTION_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSection(type)}
              disabled={isPending}
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              {SECTION_LABELS[type]}
            </Button>
          ))}
        </div>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              data-icon="inline-start"
              aria-hidden="true"
              className="animate-spin"
            />
          ) : (
            <SaveIcon data-icon="inline-start" aria-hidden="true" />
          )}
          Lưu bố cục
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <SettingsIcon aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Chưa có section nào</p>
          <p className="text-sm text-muted-foreground">
            Dùng nút &quot;Thêm section&quot; ở trên để bắt đầu dựng trang chủ.
          </p>
        </div>
      ) : (
        sections.map((section, index) => {
          const expanded = expandedId === section.id;

          return (
            <div
              key={section.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="flex items-center gap-2 p-4">
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Lên"
                    disabled={index === 0 || isPending}
                    onClick={() => move(section.id, "up")}
                  >
                    <ChevronUpIcon aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Xuống"
                    disabled={index === sections.length - 1 || isPending}
                    onClick={() => move(section.id, "down")}
                  >
                    <ChevronDownIcon aria-hidden="true" />
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : section.id)
                  }
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <Badge variant="secondary">{SECTION_LABELS[section.type]}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {"title" in section && section.title
                      ? section.title
                      : SECTION_LABELS[section.type]}
                  </span>
                  {!section.enabled ? (
                    <Badge variant="outline">Đang ẩn</Badge>
                  ) : null}
                </button>

                <ToggleSwitch
                  checked={section.enabled}
                  onChange={(value) => patchSection(section.id, { enabled: value })}
                  label="Bật/tắt section"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Xóa section"
                  disabled={isPending}
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </div>

              {expanded ? (
                <div className="border-t p-4">
                  {section.type === "hero" ? (
                    <HeroEditor
                      section={section}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  ) : section.type === "featured_products" ? (
                    <FeaturedEditor
                      section={section}
                      categories={categories}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  ) : section.type === "categories" ? (
                    <CategoriesEditor
                      section={section}
                      categories={categories}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  ) : section.type === "keywords" ? (
                    <KeywordsEditor
                      section={section}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  ) : section.type === "flash_sale" ? (
                    <FlashSaleEditor
                      section={section}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  ) : (
                    <BannerGridEditor
                      section={section}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  )}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
