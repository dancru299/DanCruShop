/* eslint-disable @next/next/no-img-element */
"use client"

import type { ReactNode } from "react"
import { GitCommitHorizontalIcon, HistoryIcon } from "lucide-react"

import type {
  ChangelogCategory,
  ChangelogEntry,
} from "@/lib/github/changelog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type ProductInfoTabsProps = {
  overview: ReactNode
  commits: ChangelogEntry[]
}

const CATEGORY_META: Record<
  ChangelogCategory,
  { label: string; className: string }
> = {
  feature: {
    label: "Feature",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  fix: {
    label: "Bug Fix",
    className:
      "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  docs: {
    label: "Documentation",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  optimization: {
    label: "Optimization",
    className:
      "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function formatDate(value: string) {
  if (!value) {
    return ""
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "" : dateFormatter.format(parsed)
}

export function ProductInfoTabs({ overview, commits }: ProductInfoTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Product details</TabsTrigger>
        <TabsTrigger value="changelog">
          <HistoryIcon aria-hidden="true" />
          Changelog
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>

      <TabsContent value="changelog">
        {commits.length > 0 ? (
          <ol className="relative grid gap-5 border-l border-border/70 pl-6">
            {commits.map((commit) => {
              const meta = CATEGORY_META[commit.category]
              const formattedDate = formatDate(commit.date)

              return (
                <li key={commit.sha} className="relative">
                  <span className="absolute -left-[1.6875rem] top-1 flex size-3 items-center justify-center rounded-full border-2 border-background bg-foreground/60" />
                  <div className="flex flex-col gap-2 rounded-lg border bg-card/60 p-4 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("h-5 px-2", meta.className)}
                      >
                        {meta.label}
                      </Badge>
                      {commit.scope ? (
                        <span className="text-xs text-muted-foreground">
                          {commit.scope}
                        </span>
                      ) : null}
                    </div>

                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium leading-6 text-foreground underline-offset-4 hover:underline"
                    >
                      {commit.subject}
                    </a>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {commit.author.avatarUrl ? (
                        <img
                          src={commit.author.avatarUrl}
                          alt={commit.author.name}
                          className="size-5 rounded-full"
                        />
                      ) : null}
                      <span className="font-medium text-foreground/80">
                        {commit.author.login ?? commit.author.name}
                      </span>
                      {formattedDate ? <span>· {formattedDate}</span> : null}
                      <span className="inline-flex items-center gap-1 font-mono">
                        <GitCommitHorizontalIcon
                          aria-hidden="true"
                          className="size-3"
                        />
                        {commit.shortSha}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No changelog to display yet.
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
