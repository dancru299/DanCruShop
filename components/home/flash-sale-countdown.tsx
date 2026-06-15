"use client";

import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getRemaining(target: number): Remaining {
  const diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-9 min-w-9 items-center justify-center rounded-md bg-foreground px-1.5 text-sm font-bold tabular-nums text-background">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function FlashSaleCountdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  // Render the live values only after mount so server/client clocks can't cause
  // a hydration mismatch on the ticking numbers.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) {
      return;
    }

    const tick = () => setRemaining(getRemaining(target));
    // First paint on the next frame (async, so no sync setState in the effect
    // body) then tick every second.
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [target]);

  if (Number.isNaN(target)) {
    return null;
  }

  const showDays = remaining ? remaining.days > 0 : false;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Kết thúc trong
      </span>
      <div className="flex items-end gap-1.5">
        {showDays && remaining ? (
          <Cell value={pad(remaining.days)} label="Ngày" />
        ) : null}
        <Cell value={remaining ? pad(remaining.hours) : "--"} label="Giờ" />
        <Cell value={remaining ? pad(remaining.minutes) : "--"} label="Phút" />
        <Cell value={remaining ? pad(remaining.seconds) : "--"} label="Giây" />
      </div>
    </div>
  );
}
