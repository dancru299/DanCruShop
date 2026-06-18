/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import {
  productShowcaseProducts,
  type ShowcaseProduct,
} from "@/lib/store/product-showcase";

// Ported from the static prototype in `packaged_showcase/`. Everything lives in
// a fixed 1024x576 coordinate space ("the stage") that scales to the container
// width via `scale(100cqw / 1024)` — so absolute px positions and the calibrated
// `matrix3d` screen warp stay perfectly aligned at any size. Do not change the
// stage dimensions or the matrix without re-running the calibration tool.
const STAGE_W = 1024;
const STAGE_H = 576;

// Auto-advance cadence and the cooldown after a manual pick (ms).
const AUTOPLAY_MS = 3800;
const PAUSE_AFTER_CLICK_MS = 9000;

const EYEBROW = "PREMIUM STARTER KITS";
const TITLE = "Build your next big product, the right way.";
const SUBTITLE = "";

// Calibrated perspective warp mapping the flat 1024x576 screen image onto the
// iMac glass in the workspace photo. Copied verbatim from the prototype.
const SCREEN_WARP =
  "matrix3d(0.4512666,0.0014721,0,0.0000036,0.0021257,0.4685420,0,0.0000038,0,0,1,0,102,135,0,1)";

// Frosted-glass panel shared by the selector and the floating price tag.
const glassPanel: CSSProperties = {
  background: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(22px) saturate(180%)",
  WebkitBackdropFilter: "blur(22px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.45)",
  boxShadow:
    "0 30px 60px -15px rgba(0,0,0,0.28), 0 10px 20px -10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
};

export function ProductShowcaseSection({
  products = productShowcaseProducts,
}: {
  // Auto-ranked published products; falls back to the prototype data when the
  // catalog has none to show yet.
  products?: ShowcaseProduct[];
}) {
  const count = products.length;
  const reducedMotion = usePrefersReducedMotion();

  const [active, setActive] = useState(0);
  // Refs so hover / cooldown changes don't tear down and restart the interval.
  const hoveringRef = useRef(false);
  const pausedRef = useRef(false);
  const cooldownRef = useRef<number | null>(null);

  // The stage is authored at a fixed 1024x576 so absolute positions and the
  // matrix3d screen warp stay aligned; we scale it to the rendered width. A
  // ResizeObserver is used instead of CSS `cqw` units, which don't reliably
  // apply inside a `transform`.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / STAGE_W);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || count <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      if (hoveringRef.current || pausedRef.current || document.hidden) {
        return;
      }
      setActive((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, reducedMotion]);

  // Clear any pending cooldown timer on unmount.
  useEffect(() => {
    return () => {
      if (cooldownRef.current !== null) {
        window.clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  const select = (index: number) => {
    // Pause auto-cycling for a beat after a manual pick, then resume.
    pausedRef.current = true;
    if (cooldownRef.current !== null) {
      window.clearTimeout(cooldownRef.current);
    }
    cooldownRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, PAUSE_AFTER_CLICK_MS);
    setActive(index);
  };

  const selected = products[active];
  const animate = !reducedMotion;

  return (
    <section
      id="product-showcase"
      className="relative w-full overflow-hidden bg-[#090a0f] text-white"
      aria-roledescription="Featured product carousel"
      onMouseEnter={() => {
        hoveringRef.current = true;
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
      }}
    >
      {/* Fixed 16:9 frame; the stage scales to fill its measured width. */}
      <div
        ref={wrapperRef}
        className="relative w-full"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div
          className="absolute left-0 top-0 overflow-hidden bg-cover bg-center"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
            // Hidden for the first frame until the width is measured, so it
            // never flashes at its native 1024px size.
            visibility: scale === 0 ? "hidden" : "visible",
            backgroundImage:
              "url('/showcase/workspace_twilight_imac_left_straight_169.png')",
          }}
        >
          {/* Ambient accent glow on the wall behind the iMac. */}
          <div
            style={{
              position: "absolute",
              left: 185,
              top: 140,
              width: 280,
              height: 220,
              background: `radial-gradient(circle, ${selected.accent}66, transparent 70%)`,
              filter: "blur(50px)",
              pointerEvents: "none",
              zIndex: 1,
              transition: "background .6s",
              animation: animate
                ? "showcase-glow-pulse 6s ease-in-out infinite"
                : undefined,
            }}
          />

          {/* Heading block (top-right of the 1024 coordinate space). */}
          <div
            style={{
              position: "absolute",
              left: 724,
              top: 120,
              maxWidth: 280,
              zIndex: 5,
              animation: animate ? "showcase-rise-in .8s .05s both" : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 2,
                  borderRadius: 2,
                  background: selected.accent,
                  transition: "background .6s",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  color: selected.accent,
                  transition: "color .6s",
                }}
              >
                {EYEBROW}
              </span>
            </div>
            <h2
              style={{
                fontWeight: 700,
                fontSize: 21,
                lineHeight: 1.15,
                margin: "0 0 7px",
                color: "#ffffff",
                letterSpacing: "-0.02em",
                textShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              {TITLE}
            </h2>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.45,
                margin: 0,
                color: "rgba(255,255,255,0.75)",
                maxWidth: 280,
                textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {SUBTITLE}
            </p>
          </div>

          {/* Product selector (frosted glass, floating). */}
          <div
            style={{
              ...glassPanel,
              position: "absolute",
              left: 724,
              top: 240,
              width: 260,
              zIndex: 6,
              borderRadius: 20,
              padding: 16,
              animation: animate
                ? "showcase-fade-in .8s .2s both, showcase-float-a 7.5s 1.4s ease-in-out infinite"
                : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#1c1e24",
                  letterSpacing: "-0.02em",
                }}
              >
                Product picker
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: selected.accent,
                  boxShadow: `0 0 0 4px ${selected.accent}33`,
                  transition: "all .5s",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {products.map((product, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => select(index)}
                    aria-pressed={isActive}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 8,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      font: "inherit",
                      transition: "all .35s cubic-bezier(.2,.7,.2,1)",
                      border: isActive
                        ? `1.5px solid ${product.accent}`
                        : "1px solid rgba(255,255,255,0.25)",
                      background: isActive
                        ? "rgba(255,255,255,0.75)"
                        : "rgba(255,255,255,0.15)",
                      boxShadow: isActive
                        ? `0 12px 24px -10px ${product.accent}55`
                        : "none",
                      transform: isActive ? "translateX(3px)" : "none",
                    }}
                  >
                    {/* Mini dashboard glyph. */}
                    <div
                      style={{
                        width: 54,
                        height: 40,
                        borderRadius: 8,
                        flexShrink: 0,
                        overflow: "hidden",
                        background: `linear-gradient(135deg, ${product.accent}, ${product.accentDark})`,
                        boxShadow: isActive
                          ? `0 8px 18px -8px ${product.accent}aa`
                          : "0 4px 10px -6px rgba(20,24,40,.35)",
                        transition: "box-shadow .35s",
                      }}
                    >
                      <span
                        style={{
                          height: 5,
                          borderRadius: 2,
                          background: "rgba(255,255,255,.9)",
                          margin: "5px 6px 0",
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 3,
                          alignItems: "flex-end",
                          padding: "6px 6px 0",
                          height: 18,
                        }}
                      >
                        {[60, 100, 40, 80].map((h, barIndex) => (
                          <span
                            key={barIndex}
                            style={{
                              flex: 1,
                              height: `${h}%`,
                              borderRadius: 1,
                              background: "rgba(255,255,255,.75)",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1c1e24",
                          lineHeight: 1.25,
                        }}
                      >
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isActive
                            ? product.text
                            : "rgba(28,30,36,0.7)",
                          marginTop: 2,
                          transition: "color .35s",
                        }}
                      >
                        Price: {product.priceLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating price tag over the desk. */}
          <div
            style={{
              ...glassPanel,
              position: "absolute",
              left: 450,
              bottom: 35,
              zIndex: 7,
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderRadius: 14,
              padding: "10px 14px",
              animation: animate
                ? "showcase-fade-in .8s .4s both, showcase-float-b 6.5s 1.6s ease-in-out infinite"
                : undefined,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${selected.accent}, ${selected.accentDark})`,
                boxShadow: `0 8px 16px -8px ${selected.accent}aa`,
                transition: "all .5s",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#1c1e24",
                  letterSpacing: "-0.01em",
                }}
              >
                {selected.brand}
              </div>
              <div style={{ fontSize: 11.5, color: "#555964", fontWeight: 600 }}>
                Price:{" "}
                <span style={{ color: selected.accent, transition: "color .5s" }}>
                  {selected.priceLabel}
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: selected.ratingCount > 0 ? selected.soft : "#e7f6ee",
                padding: "5px 9px",
                borderRadius: 8,
                transition: "background .5s",
              }}
            >
              {selected.ratingCount > 0 ? (
                <>
                  <span style={{ color: "#f5b50a", fontSize: 12 }}>★</span>
                  <span
                    style={{ fontSize: 12, fontWeight: 800, color: "#1c1e24" }}
                  >
                    {selected.rating}
                  </span>
                </>
              ) : (
                <span
                  style={{ fontSize: 11, fontWeight: 800, color: "#0f9d58" }}
                >
                  New
                </span>
              )}
            </div>
          </div>

          {/* Perspective-warped iMac screen — dashboards cross-fade in place. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: STAGE_W,
              height: STAGE_H,
              zIndex: 3,
              overflow: "hidden",
              background: "#f5f6f9",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
              transformOrigin: "0 0",
              transform: SCREEN_WARP,
              borderRadius: 12,
            }}
          >
            {products.map((product, index) => {
              const isActive = index === active;
              return (
                <img
                  key={product.id}
                  src={product.dashboardImg}
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition:
                      "opacity .55s ease, transform .7s cubic-bezier(.2,.7,.2,1)",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "scale(1)" : "scale(1.045)",
                    zIndex: isActive ? 2 : 1,
                    pointerEvents: "none",
                  }}
                />
              );
            })}

            {/* Glass reflections for a behind-the-glass look. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 4,
                background:
                  "linear-gradient(118deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.05) 15%, transparent 35%, transparent 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "34%",
                pointerEvents: "none",
                zIndex: 4,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.07), transparent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 4,
                background:
                  "radial-gradient(circle at 12% 15%, rgba(255,255,255,0.12) 0%, transparent 45%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
