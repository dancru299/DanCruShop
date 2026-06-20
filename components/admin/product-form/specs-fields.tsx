import { SlidersHorizontalIcon } from "lucide-react";

import {
  Field,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { SPEC_GROUPS } from "@/lib/products/specs";

type SpecsFieldsProps = {
  specState: Record<string, string[] | boolean>;
  isPending: boolean;
  onToggleSpecOption: (key: string, value: string, type: "single" | "multi" | "boolean") => void;
  onToggleSpecBoolean: (key: string) => void;
};

export function SpecsFields({
  specState,
  isPending,
  onToggleSpecOption,
  onToggleSpecBoolean,
}: SpecsFieldsProps) {
  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal">
            Thông số kỹ thuật (bảng so sánh)
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Chọn đúng công nghệ để sản phẩm hiển thị chuẩn trong bảng so
            sánh kỹ thuật. Bỏ trống field nào thì field đó hiện dấu &ldquo;&mdash;&rdquo;.
          </p>
        </div>
        <SlidersHorizontalIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </div>

      <div className="flex flex-col gap-6">
        {SPEC_GROUPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            {group.fields.map((field) => {
              if (field.type === "boolean") {
                const active = specState[field.key] === true;

                return (
                  <Field key={field.key}>
                    <button
                      type="button"
                      onClick={() => onToggleSpecBoolean(field.key)}
                      disabled={isPending}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      <span className="grid gap-0.5">
                        <span className="text-sm font-medium">
                          {field.label}
                        </span>
                        {field.hint ? (
                          <span className="text-xs text-muted-foreground">
                            {field.hint}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
                          active ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "size-4 rounded-full bg-background transition-transform",
                            active ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </span>
                    </button>
                  </Field>
                );
              }

              const selected = Array.isArray(specState[field.key])
                ? (specState[field.key] as string[])
                : [];

              return (
                <Field key={field.key}>
                  <FieldLabel>
                    {field.label}
                    {field.type === "single" ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (chọn 1)
                      </span>
                    ) : null}
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {(field.options ?? []).map((option) => {
                      const active = selected.includes(option.value);

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            onToggleSpecOption(field.key, option.value, field.type)
                          }
                          disabled={isPending}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
