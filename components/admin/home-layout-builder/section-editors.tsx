import {
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { AdminMediaUploadField } from "@/components/admin/media-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  BannerGridSection,
  CategoriesSection,
  FeaturedProductsSection,
  FlashSaleSection,
  HeroSection,
  KeywordsSection,
} from "@/lib/store/home-layout";

import {
  ContentFields,
  isoToLocalInput,
  LabeledField,
  localInputToIso,
  NativeSelect,
  SignalsEditor,
  ToggleSwitch,
} from "./builder-primitives";

export type CategoryOption = { id: string; name: string; slug: string };

export const COLUMN_OPTIONS = [
  { value: "2", label: "2 cột" },
  { value: "3", label: "3 cột" },
  { value: "4", label: "4 cột" },
];

export const LAYOUT_OPTIONS = [
  { value: "grid", label: "Lưới (grid)" },
  { value: "row", label: "Hàng ngang (cuộn)" },
];

export function HeroEditor({
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

export function FeaturedEditor({
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

export function CategoriesEditor({
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

export function KeywordsEditor({
  section,
  onChange,
}: {
  section: KeywordsSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  function updateItem(
    index: number,
    patch: Partial<KeywordsSection["items"][number]>
  ) {
    const items = section.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onChange({ items });
  }

  return (
    <div className="grid gap-4">
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Danh sách từ khóa</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                items: [...section.items, { label: "", href: "/products" }],
              })
            }
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Thêm
          </Button>
        </div>
        {section.items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center"
          >
            <Input
              value={item.label}
              placeholder="Nhãn (vd: Công cụ AI)"
              onChange={(event) => updateItem(index, { label: event.target.value })}
            />
            <Input
              value={item.href}
              placeholder="Link (vd: /products?q=AI)"
              onChange={(event) => updateItem(index, { href: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa từ khóa"
              onClick={() =>
                onChange({
                  items: section.items.filter((_, i) => i !== index),
                })
              }
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlashSaleEditor({
  section,
  onChange,
}: {
  section: FlashSaleSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-4">
      <LabeledField label="Tiêu đề">
        <Input
          value={section.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </LabeledField>
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField label="Thời điểm kết thúc">
          <Input
            type="datetime-local"
            value={isoToLocalInput(section.endsAt)}
            onChange={(event) =>
              onChange({ endsAt: localInputToIso(event.target.value) })
            }
          />
        </LabeledField>
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
      <p className="text-xs leading-5 text-muted-foreground">
        Flash Sale tự lấy các sản phẩm đang có &quot;Giá gốc&quot; (đang giảm
        giá). Section sẽ tự ẩn khi hết giờ hoặc khi chưa có sản phẩm nào giảm
        giá.
      </p>
    </div>
  );
}

export function BannerGridEditor({
  section,
  onChange,
}: {
  section: BannerGridSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  function updateItem(
    index: number,
    patch: Partial<BannerGridSection["items"][number]>
  ) {
    const items = section.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onChange({ items });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Danh sách banner</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              items: [
                ...section.items,
                { imageUrl: "", href: "", title: "" },
              ],
            })
          }
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Thêm banner
        </Button>
      </div>

      {section.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chưa có banner nào. Banner đầu tiên sẽ là ô lớn của lưới.
        </p>
      ) : null}

      {section.items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Banner {index + 1}
              {index === 0 ? " (ô lớn)" : ""}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa banner"
              onClick={() =>
                onChange({
                  items: section.items.filter((_, i) => i !== index),
                })
              }
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </div>

          <AdminMediaUploadField
            folder="products"
            id={`banner-${section.id}-${index}`}
            label="Ảnh banner"
            description="Khuyến nghị ảnh ngang, rõ nét."
            placeholder="https://... hoặc bấm Upload"
            value={item.imageUrl}
            onChange={(value) => updateItem(index, { imageUrl: value })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={item.href}
              placeholder="Link khi bấm (vd: /products?q=...)"
              onChange={(event) => updateItem(index, { href: event.target.value })}
            />
            <Input
              value={item.title}
              placeholder="Tiêu đề trên banner (tùy chọn)"
              onChange={(event) =>
                updateItem(index, { title: event.target.value })
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
