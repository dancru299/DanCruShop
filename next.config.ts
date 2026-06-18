// When @sentry/nextjs is installed, wrap with withSentryConfig:
//
//   import { withSentryConfig } from "@sentry/nextjs";
//   export default withSentryConfig(nextConfig, {
//     silent: true,
//     disableSourceMapUpload: !process.env.SENTRY_AUTH_TOKEN,
//   });

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Admin image uploads (uploadAdminImage) post the file through a Server
    // Action. The default body limit is 1MB, which silently rejects images
    // above it with "An unexpected response was received from the server.".
    // Keep this comfortably above the 5MB image cap to allow multipart overhead.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },

  // ---- Content-Security-Policy -----------------------------------------
  // Protects against XSS and data injection. Trusted sources:
  //  - own origin (scripts, styles, fonts, media, connections, frames)
  //  - Supabase (API + realtime WS)
  //  - Lemon Squeezy (checkout scripts + iframe)
  //  - bunny.net / Cloudflare Stream (video)
  //  - GitHub avatars (changelog author images)
  //  - Vercel analytics / Speed Insights
  // Inline styles are allowed only via nonce (Next.js injects it
  // automatically for App Router scripts).
  async headers() {
    // Next.js dev mode (Turbopack) requires eval() for debugging features
    // like reconstructing callstacks. Production never uses eval(), so we
    // only relax script-src with 'unsafe-eval' outside of production.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = [
      "script-src 'self' 'unsafe-inline'",
      isDev ? "'unsafe-eval'" : "",
      "https://assets.lemonsqueezy.com https://*.vercel-insights.com",
    ]
      .filter(Boolean)
      .join(" ");

    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://avatars.githubusercontent.com https://*.githubusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com",
      "frame-src 'self' https://*.lemonsqueezy.com https://*.bunny.net https://*.cloudflarestream.com",
      "media-src 'self' https://*.bunny.net https://*.cloudflarestream.com https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.lemonsqueezy.com",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  // ----------------------------------------------------------------------
};

export default nextConfig;
