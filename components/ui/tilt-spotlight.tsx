"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TiltSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  glowColor?: string;
  glowSize?: number;
}

export function TiltSpotlight({
  children,
  className,
  maxTilt = 8,
  glowColor = "rgba(59, 130, 246, 0.12)",
  glowSize = 250,
  ...props
}: TiltSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track mouse coordinates inside the element
    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);

    // Calculate 3D tilt rotation
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((y - yc) / yc) * -maxTilt;
    const rotateY = ((x - xc) / xc) * maxTilt;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--mouse-x", `-9999px`);
      el.style.setProperty("--mouse-y", `-9999px`);
    }
    setStyle({
      transform: "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)",
      transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={cn(
        "group/spotlight relative overflow-hidden rounded-xl border bg-card/65 transition-all duration-300 hover:border-foreground/30 hover:shadow-xl hover:shadow-primary/5",
        className
      )}
      {...props}
    >
      {/* Background radial glow following cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: `radial-gradient(${glowSize}px circle at var(--mouse-x, -9999px) var(--mouse-y, -9999px), ${glowColor}, transparent 80%)`,
        }}
      />
      
      {/* Dynamic border highlight following cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: `radial-gradient(${glowSize * 0.8}px circle at var(--mouse-x, -9999px) var(--mouse-y, -9999px), rgba(255, 255, 255, 0.08), transparent 70%)`,
          border: "1px solid transparent",
          maskImage: "linear-gradient(#fff, #fff) exclude, linear-gradient(#fff, #fff)",
          WebkitMaskComposite: "source-in, xor",
          maskComposite: "exclude",
        }}
      />

      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
