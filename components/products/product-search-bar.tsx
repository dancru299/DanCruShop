"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductSearchBar() {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  return (
    <ProductSearchForm
      key={currentQuery}
      initialValue={currentQuery}
      searchParamsString={searchParams.toString()}
    />
  );
}

function ProductSearchForm({
  initialValue,
  searchParamsString,
}: {
  initialValue: string;
  searchParamsString: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  function buildUrl(query: string) {
    const params = new URLSearchParams(searchParamsString);

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    params.delete("page");
    return `/products?${params.toString()}`;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildUrl(value));
  }

  function handleClear() {
    setValue("");
    router.push(buildUrl(""));
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search products..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-8 pr-8"
          aria-label="Search products"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
