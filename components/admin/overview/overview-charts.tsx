import { cn } from "@/lib/utils";
import type { Tone, TrendPoint } from "@/lib/admin/overview-types";
import { toneHex } from "@/lib/admin/overview-utils";

export function getLineChartPaths(points: TrendPoint[]) {
  const width = 560;
  const height = 190;
  const paddingX = 14;
  const paddingY = 16;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step =
    points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;
  const baseline = height - paddingY;
  const coords = points.map((point, index) => {
    const x = paddingX + index * step;
    const y =
      baseline - (point.value / max) * (height - paddingY * 2 - 10);

    return { x, y };
  });
  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");
  const first = coords[0] ?? { x: paddingX, y: baseline };
  const last = coords[coords.length - 1] ?? { x: width - paddingX, y: baseline };
  const areaPath = `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

  return { areaPath, baseline, coords, height, linePath, width };
}

export function LineChart({
  emptyLabel,
  formatter,
  gradientId,
  points,
  tone,
}: {
  emptyLabel: string;
  formatter: (value: number) => string;
  gradientId: string;
  points: TrendPoint[];
  tone: Tone;
}) {
  const { areaPath, baseline, coords, height, linePath, width } =
    getLineChartPaths(points);
  const hasData = points.some((point) => point.value > 0);
  const chartColor = toneHex[tone];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-lg border bg-background/60">
        <svg
          aria-label="Revenue trend chart"
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.34" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="text-border">
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                stroke="currentColor"
                strokeDasharray="4 8"
                strokeWidth="1"
                x1="0"
                x2={width}
                y1={height * ratio}
                y2={height * ratio}
              />
            ))}
          </g>
          {hasData ? (
            <>
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
              />
              <path
                d={linePath}
                fill="none"
                stroke={chartColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {coords.map((coord, index) => (
                <circle
                  key={`${points[index]?.label}-${index}`}
                  cx={coord.x}
                  cy={coord.y}
                  fill={chartColor}
                  r={index === coords.length - 1 ? "4" : "2.5"}
                />
              ))}
            </>
          ) : (
            <>
              <line
                className="text-muted-foreground/40"
                stroke="currentColor"
                strokeDasharray="6 8"
                strokeWidth="2"
                x1="16"
                x2={width - 16}
                y1={baseline}
                y2={baseline}
              />
              <text
                className="fill-muted-foreground"
                fontSize="13"
                textAnchor="middle"
                x={width / 2}
                y={height / 2}
              >
                {emptyLabel}
              </text>
            </>
          )}
        </svg>
      </div>
      <div className="grid grid-cols-3 text-xs text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span className="text-center">
          {formatter(Math.max(...points.map((point) => point.value), 0))} peak
        </span>
        <span className="text-right">{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function MiniBars({
  points,
  tone,
}: {
  points: TrendPoint[];
  tone: Tone;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="flex h-24 items-end gap-1.5">
      {points.map((point, index) => {
        const height = Math.max(8, (point.value / max) * 100);

        return (
          <div
            key={`${point.label}-${index}`}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-20 w-full items-end rounded-sm bg-muted/40">
              <div
                className={cn("w-full rounded-sm", {
                  "bg-amber-400": tone === "amber",
                  "bg-emerald-400": tone === "emerald",
                  "bg-rose-400": tone === "rose",
                  "bg-sky-400": tone === "sky",
                  "bg-violet-400": tone === "violet",
                })}
                style={{ height: `${height}%` }}
                title={`${point.label}: ${new Intl.NumberFormat("en-US").format(point.value)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
