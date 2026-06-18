"use client";

import { useEffect, useRef } from "react";

export function DynamicHeroBg() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = bgRef.current;
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      el.style.setProperty("--hero-mouse-x", `${x}px`);
      el.style.setProperty("--hero-mouse-y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={bgRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Dynamic Cursor Light Orb (follows mouse) */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-500"
        style={{
          background: `radial-gradient(550px circle at var(--hero-mouse-x, 50%) var(--hero-mouse-y, 30%), var(--primary) 0%, transparent 100%)`,
        }}
      />
      
      {/* Stationary Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_40%),radial-gradient(circle_at_top_right,var(--muted)_0,transparent_45%)] opacity-25" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.07]" />
    </div>
  );
}
