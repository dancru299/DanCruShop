"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
};

/**
 * Segmented numeric code input. Renders `length` boxes that together form a
 * single string `value`. Supports paste, backspace, and arrow navigation.
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  autoFocus,
}: CodeInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function focusInput(index: number) {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }

  function setDigit(index: number, digit: string) {
    const next = value.split("");
    next[index] = digit;
    // Keep length bounded and drop trailing empties.
    onChange(next.join("").slice(0, length));
  }

  function handleChange(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const raw = event.target.value.replace(/\D/g, "");

    if (!raw) {
      setDigit(index, "");
      return;
    }

    // Support typing/pasting multiple digits at once from any box.
    const chars = raw.split("");
    const next = value.split("");

    for (let i = 0; i < chars.length && index + i < length; i += 1) {
      next[index + i] = chars[i];
    }

    onChange(next.join("").slice(0, length));
    focusInput(Math.min(index + chars.length, length - 1));
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace") {
      if (value[index]) {
        setDigit(index, "");
        return;
      }

      if (index > 0) {
        event.preventDefault();
        setDigit(index - 1, "");
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Mã xác thực">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={value[index] ?? ""}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-invalid={invalid || undefined}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "h-12 w-full min-w-0 rounded-lg border border-input bg-transparent text-center text-lg font-semibold transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            "dark:bg-input/30"
          )}
        />
      ))}
    </div>
  );
}
