import {
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  CategoriesSection,
  FeaturedProductsSection,
  HeroSection,
} from "@/lib/store/home-layout";

export function LabeledField({
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

export function NativeSelect({
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

export function ToggleSwitch({
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

export function SignalsEditor({
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

export function ContentFields({
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

export function isoToLocalInput(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localInputToIso(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
