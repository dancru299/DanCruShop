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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  SECTION_LABELS,
  SECTION_TYPES,
  createSection,
  type CategoriesSection,
  type FeaturedProductsSection,
  type HeroSection,
  type HomeSection,
  type SectionType,
} from "@/lib/store/home-layout";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; name: string; slug: string };

type HomeLayoutBuilderProps = {
  initialLayout: HomeSection[];
  categories: CategoryOption[];
};

// ---- small field primitives ----

function LabeledField({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

const COLUMN_OPTIONS = [
  { value: "2", label: "2 cột" },
  { value: "3", label: "3 cột" },
  { value: "4", label: "4 cột" },
];

const LAYOUT_OPTIONS = [
  { value: "grid", label: "Lưới (grid)" },
  { value: "row", label: "Hàng ngang (cuộn)" },
];

// ---- per-type editors ----

function HeroEditor({
  section,
  onChange,
}: {
  section: HeroSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-4">
      <LabeledField label="Kiểu hiển thị">
        <NativeSelect
          value={section.variant}
          onChange={(value) =>
            onChange({ variant: value as HeroSection["variant"] })
          }
          options={[
            { value: "split", label: "Hai cột + spotlight" },
            { value: "centered", label: "Căn giữa" },
            { value: "minimal", label: "Tối giản" },
          ]}
        />
      </LabeledField>
      <LabeledField label="Eyebrow (nhãn nhỏ)">
        <Input
          value={section.eyebrow}
          onChange={(event) => onChange({ eyebrow: event.target.value })}
        />
      </LabeledField>
      <LabeledField label="Tiêu đề">
        <Textarea
          value={section.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </LabeledField>
      <LabeledField label="Mô tả">
        <Textarea
          value={section.subtitle}
          onChange={(event) => onChange({ subtitle: event.target.value })}
        />
      </LabeledField>
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField label="Nút chính — nhãn">
          <Input
            value={section.primaryCta.label}
            onChange={(event) =>
              onChange({
                primaryCta: { ...section.primaryCta, label: event.target.value },
              })
            }
          />
        </LabeledField>
        <LabeledField label="Nút chính — link">
          <Input
            value={section.primaryCta.href}
            onChange={(event) =>
              onChange({
                primaryCta: { ...section.primaryCta, href: event.target.value },
              })
            }
          />
        </LabeledField>
        <LabeledField label="Nút phụ — nhãn">
          <Input
            value={section.secondaryCta.label}
            onChange={(event) =>
              onChange({
                secondaryCta: {
                  ...section.secondaryCta,
                  label: event.target.value,
                },
              })
            }
          />
        </LabeledField>
        <LabeledField label="Nút phụ — link">
          <Input
            value={section.secondaryCta.href}
            onChange={(event) =>
              onChange({
                secondaryCta: {
                  ...section.secondaryCta,
                  href: event.target.value,
                },
              })
            }
          />
        </LabeledField>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium">
          Hiện spotlight sản phẩm (chỉ kiểu hai cột)
        </span>
        <ToggleSwitch
          checked={section.showSpotlight}
          onChange={(value) => onChange({ showSpotlight: value })}
          label="Bật/tắt spotlight sản phẩm"
        />
      </div>

      <SignalsEditor section={section} onChange={onChange} />
    </div>
  );
}

function SignalsEditor({
  section,
  onChange,
}: {
  section: HeroSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  function updateSignal(index: number, patch: Partial<HeroSection["signals"][number]>) {
    const signals = section.signals.map((signal, i) =>
      i === index ? { ...signal, ...patch } : signal
    );
    onChange({ signals });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Điểm nhấn (signal cards)</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              signals: [...section.signals, { title: "", description: "" }],
            })
          }
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Thêm
        </Button>
      </div>
      {section.signals.map((signal, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3"
        >
          <div className="flex items-center gap-2">
            <Input
              value={signal.title}
              placeholder="Tiêu đề"
              onChange={(event) => updateSignal(index, { title: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa signal"
              onClick={() =>
                onChange({
                  signals: section.signals.filter((_, i) => i !== index),
                })
              }
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </div>
          <Textarea
            value={signal.description}
            placeholder="Mô tả"
            onChange={(event) =>
              updateSignal(index, { description: event.target.value })
            }
          />
        </div>
      ))}
    </div>
  );
}

function ContentFields({
  section,
  onChange,
}: {
  section: FeaturedProductsSection | CategoriesSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <>
      <LabeledField label="Tiêu đề">
        <Input
          value={section.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </LabeledField>
      <LabeledField label="Mô tả">
        <Textarea
          value={section.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </LabeledField>
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField label="Nút — nhãn">
          <Input
            value={section.actionLabel}
            onChange={(event) => onChange({ actionLabel: event.target.value })}
          />
        </LabeledField>
        <LabeledField label="Nút — link">
          <Input
            value={section.actionHref}
            onChange={(event) => onChange({ actionHref: event.target.value })}
          />
        </LabeledField>
      </div>
    </>
  );
}

function FeaturedEditor({
  section,
  onChange,
  categories,
}: {
  section: FeaturedProductsSection;
  onChange: (patch: Record<string, unknown>) => void;
  categories: CategoryOption[];
}) {
  return (
    <div className="grid gap-4">
      <ContentFields section={section} onChange={onChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField label="Nguồn sản phẩm">
          <NativeSelect
            value={section.source}
            onChange={(value) =>
              onChange({ source: value as FeaturedProductsSection["source"] })
            }
            options={[
              { value: "latest", label: "Mới nhất" },
              { value: "category", label: "Theo danh mục" },
            ]}
          />
        </LabeledField>
        {section.source === "category" ? (
          <LabeledField label="Danh mục">
            <NativeSelect
              value={section.categorySlug}
              onChange={(value) => onChange({ categorySlug: value })}
              options={[
                { value: "", label: "— Chọn danh mục —" },
                ...categories.map((category) => ({
                  value: category.slug,
                  label: category.name,
                })),
              ]}
            />
          </LabeledField>
        ) : null}
        <LabeledField label="Số sản phẩm">
          <Input
            type="number"
            min={1}
            max={12}
            value={section.limit}
            onChange={(event) =>
              onChange({ limit: Number(event.target.value) || 1 })
            }
          />
        </LabeledField>
        <LabeledField label="Bố cục">
          <NativeSelect
            value={section.layout}
            onChange={(value) =>
              onChange({ layout: value as FeaturedProductsSection["layout"] })
            }
            options={LAYOUT_OPTIONS}
          />
        </LabeledField>
        {section.layout === "grid" ? (
          <LabeledField label="Số cột">
            <NativeSelect
              value={String(section.columns)}
              onChange={(value) =>
                onChange({
                  columns: Number(value) as FeaturedProductsSection["columns"],
                })
              }
              options={COLUMN_OPTIONS}
            />
          </LabeledField>
        ) : null}
      </div>
    </div>
  );
}

function CategoriesEditor({
  section,
  onChange,
  categories,
}: {
  section: CategoriesSection;
  onChange: (patch: Record<string, unknown>) => void;
  categories: CategoryOption[];
}) {
  function toggleCategory(id: string) {
    const next = section.categoryIds.includes(id)
      ? section.categoryIds.filter((item) => item !== id)
      : [...section.categoryIds, id];
    onChange({ categoryIds: next });
  }

  return (
    <div className="grid gap-4">
      <ContentFields section={section} onChange={onChange} />
      <div className="grid gap-4 sm:grid-cols-3">
        <LabeledField label="Nguồn danh mục">
          <NativeSelect
            value={section.source}
            onChange={(value) =>
              onChange({ source: value as CategoriesSection["source"] })
            }
            options={[
              { value: "all", label: "Tất cả" },
              { value: "selected", label: "Chọn thủ công" },
            ]}
          />
        </LabeledField>
        <LabeledField label="Bố cục">
          <NativeSelect
            value={section.layout}
            onChange={(value) =>
              onChange({ layout: value as CategoriesSection["layout"] })
            }
            options={LAYOUT_OPTIONS}
          />
        </LabeledField>
        {section.layout === "grid" ? (
          <LabeledField label="Số cột">
            <NativeSelect
              value={String(section.columns)}
              onChange={(value) =>
                onChange({
                  columns: Number(value) as CategoriesSection["columns"],
                })
              }
              options={COLUMN_OPTIONS}
            />
          </LabeledField>
        ) : null}
      </div>

      {section.source === "selected" ? (
        <LabeledField
          label="Danh mục hiển thị"
          description="Thứ tự hiển thị theo sắp xếp ở trang Categories."
        >
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Chưa có danh mục nào.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = section.categoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </LabeledField>
      ) : null}
    </div>
  );
}

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
                  ) : (
                    <CategoriesEditor
                      section={section}
                      categories={categories}
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
